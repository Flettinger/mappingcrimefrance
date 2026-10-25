"""Local-only contract tests; never connect to the production database or CAPTCHA."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import event

scratch = tempfile.TemporaryDirectory(dir=Path.cwd())
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(scratch.name) / "acceptance.sqlite").as_posix()
spec = importlib.util.spec_from_file_location("acceptance_test_app", Path(__file__).parents[1] / "main.py")
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
app_module.UPLOAD_DIR = Path(scratch.name) / "uploads"
app_module.UPLOAD_DIR.mkdir()


class AcceptanceContractTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        app_module.engine.dispose()
        scratch.cleanup()

    def setUp(self):
        self.client = TestClient(app_module.app)
        app_module.RATE_LIMIT.clear()
        with app_module.SessionLocal() as db:
            db.query(app_module.IncidentRetentionHoldDB).delete()
            db.query(app_module.IncidentAcceptanceDB).delete()
            db.query(app_module.IncidentDB).delete()
            db.query(app_module.SubscriberDB).delete()
            db.commit()
        self.body = dict(
            reporter_email="citizen@example.invalid", type="Vol simple", address="Lieu de test",
            description="Déclaration locale de test", latitude=48.8, longitude=2.3,
            captcha_token="local-test", terms_accepted=True, declaration_accepted=True,
            privacy_acknowledged=True, legal_version=app_module.LEGAL_DOCUMENTS["version"],
        )

    def test_each_required_confirmation_is_enforced_on_server(self):
        for key in ("terms_accepted", "declaration_accepted", "privacy_acknowledged"):
            for value in (False, "true", 1):
                with self.subTest(key=key, value=value), patch.object(app_module, "verify_turnstile") as captcha:
                    response = self.client.post("/incidents", json={**self.body, key: value})
                    self.assertEqual(response.status_code, 422)
                    captcha.assert_not_called()
            missing = {k: v for k, v in self.body.items() if k != key}
            self.assertEqual(self.client.post("/incidents", json=missing).status_code, 422)

    def test_old_document_version_is_rejected(self):
        with patch.object(app_module, "verify_turnstile") as captcha:
            response = self.client.post("/incidents", json={**self.body, "legal_version": "outdated"})
            self.assertEqual(response.status_code, 409)
            captcha.assert_not_called()

    def test_acceptance_is_recorded_with_server_timestamp_and_snapshot(self):
        with patch.object(app_module, "verify_turnstile", return_value=True):
            response = self.client.post("/incidents", json={**self.body, "accepted_at": "1900-01-01"})
        self.assertEqual(response.status_code, 200)
        record_id = response.json()["id"]
        with app_module.SessionLocal() as db:
            proof = db.get(app_module.IncidentAcceptanceDB, record_id)
            self.assertGreater(proof.accepted_at.year, 2020)
            self.assertEqual(proof.legal_version, self.body["legal_version"])
            self.assertTrue(proof.terms_accepted and proof.declaration_accepted and proof.privacy_acknowledged)
            self.assertEqual(proof.documents_snapshot, app_module.LEGAL_SNAPSHOT)
            self.assertEqual(proof.documents_sha256, app_module.LEGAL_HASH)
            incident = db.get(app_module.IncidentDB, record_id)
            incident.status = "approved"
            db.commit()
        public = self.client.get("/incidents").json()[0]
        self.assertNotIn("reporter_email", public)
        self.assertNotIn("documents_snapshot", public)
        self.assertNotIn("documents_sha256", public)

    def test_failure_to_store_proof_rolls_back_the_report(self):
        def fail(*args):
            raise RuntimeError("simulated proof storage failure")
        event.listen(app_module.IncidentAcceptanceDB, "before_insert", fail)
        try:
            with patch.object(app_module, "verify_turnstile", return_value=True):
                with self.assertRaises(RuntimeError):
                    self.client.post("/incidents", json=self.body)
        finally:
            event.remove(app_module.IncidentAcceptanceDB, "before_insert", fail)
        with app_module.SessionLocal() as db:
            self.assertEqual(db.query(app_module.IncidentDB).count(), 0)
            self.assertEqual(db.query(app_module.IncidentAcceptanceDB).count(), 0)

    def test_captcha_is_still_required(self):
        with patch.object(app_module, "verify_turnstile", return_value=False):
            self.assertIn("error", self.client.post("/incidents", json=self.body).json())
        with app_module.SessionLocal() as db:
            self.assertEqual(db.query(app_module.IncidentAcceptanceDB).count(), 0)

    def test_retention_removes_expired_data_and_keeps_current_data(self):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        with app_module.SessionLocal() as db:
            for ident, status, days in [(1, "pending", 91), (2, "approved", 731), (3, "approved", 91), (4, "pending", 5)]:
                db.add(app_module.IncidentDB(id=ident, reporter_email="test@example.invalid", type="Vol simple", address="test", latitude=0, longitude=0, status=status, created_at=now-timedelta(days=days)))
            for ident, status, days in [(1, "pending", 8), (2, "confirmed", 8), (3, "pending", 1)]:
                db.add(app_module.SubscriberDB(id=ident, email="test@example.invalid", address="test", latitude=0, longitude=0, status=status, created_at=now-timedelta(days=days)))
            db.commit()
        app_module.purge_expired_data(now)
        with app_module.SessionLocal() as db:
            self.assertIsNone(db.get(app_module.IncidentDB, 1))
            self.assertIsNone(db.get(app_module.IncidentDB, 2))
            self.assertIsNone(db.get(app_module.IncidentDB, 3).reporter_email)
            self.assertIsNotNone(db.get(app_module.IncidentDB, 4).reporter_email)
            self.assertIsNone(db.get(app_module.SubscriberDB, 1))
            self.assertIsNotNone(db.get(app_module.SubscriberDB, 2))
            self.assertIsNotNone(db.get(app_module.SubscriberDB, 3))

    def test_documented_hold_preserves_data_but_not_expired_publication(self):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        with app_module.SessionLocal() as db:
            db.add(app_module.IncidentDB(id=9, reporter_email="test@example.invalid", type="Vol simple", address="test", latitude=0, longitude=0, status="approved", created_at=now-timedelta(days=731)))
            db.add(app_module.IncidentRetentionHoldDB(incident_id=9, until=now+timedelta(days=2)))
            db.commit()
        app_module.purge_expired_data(now)
        with app_module.SessionLocal() as db:
            self.assertIsNotNone(db.get(app_module.IncidentDB, 9).reporter_email)
        self.assertEqual(self.client.get("/incidents").json(), [])
        app_module.purge_expired_data(now+timedelta(days=3))
        with app_module.SessionLocal() as db:
            self.assertIsNone(db.get(app_module.IncidentDB, 9))

    def test_media_cleanup_cannot_delete_a_path_outside_uploads(self):
        outside = Path(scratch.name) / "must-stay.txt"
        outside.write_text("keep", encoding="utf-8")
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        with app_module.SessionLocal() as db:
            db.add(app_module.IncidentDB(id=10, type="Vol simple", address="test", latitude=0, longitude=0, status="pending", media_url="/uploads/../must-stay.txt", created_at=now-timedelta(days=91)))
            db.commit()
        app_module.purge_expired_data(now)
        self.assertTrue(outside.exists())


if __name__ == "__main__":
    unittest.main()
