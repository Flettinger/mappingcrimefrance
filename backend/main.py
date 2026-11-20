import hashlib
import hmac
import json
import math
import os
import re
from functools import lru_cache
import smtplib
import time
import urllib.parse
import urllib.request
import uuid
from datetime import date, datetime
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl, Field
from sqlalchemy import Column, Date, Float, Integer, String, Text, TIMESTAMP, Time, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
ADMIN_SESSION_SECONDS = 4 * 60 * 60
TURNSTILE_SECRET_KEY = os.getenv("TURNSTILE_SECRET_KEY")

EMAIL_HOST = os.getenv("EMAIL_HOST", "ssl0.ovh.net")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL manquant")

RATE_LIMIT = {}

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

app = FastAPI(title="MappingCrimeFrance API")


class IncidentDB(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    reporter_email = Column(Text, nullable=True)
    type = Column(String(100), nullable=False)
    incident_date = Column(Date, nullable=True)
    video_url = Column(Text, nullable=True)
    incident_time = Column(Time, nullable=True)
    address = Column(Text, nullable=False)
    description = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    media_url = Column(Text, nullable=True)
    media_type = Column(String(20), nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())


class SubscriberDB(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Integer, default=10)
    commune_code = Column(String(10), nullable=True)
    commune_name = Column(Text, nullable=True)
    commune_latitude = Column(Float, nullable=True)
    commune_longitude = Column(Float, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())


# IMPORTANT : créer les tables APRÈS la définition des modèles
Base.metadata.create_all(bind=engine)
with engine.begin() as connection:
    connection.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS incident_date DATE"))
    connection.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS video_url TEXT"))
    connection.execute(text("ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS commune_code VARCHAR(10)"))
    connection.execute(text("ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS commune_name TEXT"))
    connection.execute(text("ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS commune_latitude DOUBLE PRECISION"))
    connection.execute(text("ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS commune_longitude DOUBLE PRECISION"))



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://mappingcrimefrance.fr",
        "https://www.mappingcrimefrance.fr",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


class IncidentCreate(BaseModel):
    reporter_email: str
    type: str
    incident_date: Optional[date] = None
    video_url: Optional[HttpUrl] = None
    incident_time: Optional[str] = None
    address: str
    description: str
    latitude: float
    longitude: float
    captcha_token: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class SubscriberCreate(BaseModel):
    radius_km: int = Field(default=10, ge=1, le=10)
    email: str
    address: str
    latitude: float
    longitude: float


def send_email(to_email: str, subject: str, body: str):
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("Email non envoyé : EMAIL_USER ou EMAIL_PASSWORD manquant")
        return

    message = MIMEText(body, "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = EMAIL_USER
    message["To"] = to_email

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=15) as server:
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_USER, [to_email], message.as_string())


def verify_turnstile(token: str) -> bool:
    if not TURNSTILE_SECRET_KEY:
        print("TURNSTILE_SECRET_KEY manquant")
        return False

    data = urllib.parse.urlencode(
        {"secret": TURNSTILE_SECRET_KEY, "response": token}
    ).encode()

    request = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=data,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode())
            return result.get("success", False)
    except Exception as error:
        print("Erreur Turnstile:", error)
        return False


def calculate_distance_km(lat1, lon1, lat2, lon2):
    radius = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def send_subscription_approved_email(subscriber):
    subject = "Votre inscription aux alertes Mapping Crime France est validée"
    body = f"""
Bonjour,

Votre inscription aux alertes Mapping Crime France a été validée par un administrateur.

Vos alertes sont désormais actives dans un rayon de {subscriber.radius_km} km autour de :
{subscriber.address}

Vous recevrez un email lorsqu’un incident sera validé dans cette zone.

Pour vous désinscrire :
{FRONTEND_URL}/unsubscribe/{subscriber.id}

Cordialement,
Mapping Crime France
"""
    send_email(subscriber.email, subject, body)


def send_alert_email(to_email: str, incident, distance: float, subscriber_id: int, radius_km: int = 10):
    unsubscribe_link = f"{FRONTEND_URL}/unsubscribe/{subscriber_id}"

    incident_time_text = ""
    if incident.incident_time:
        incident_time_text = f"Horaire déclaré : {incident.incident_time}\n"

    subject = "Alerte MappingCrimeFrance - Incident près de chez vous"

    body = f"""
Bonjour,

Un incident vient d'être validé près de votre zone de surveillance.

Type d'incident : {incident.type}
{incident_time_text}Adresse : {incident.address}
Description : {incident.description}
Distance estimée : {round(distance, 2)} km

Vous recevez cet email car vous êtes inscrit aux alertes MappingCrimeFrance dans un rayon de {radius_km} km.

Pour vous désinscrire :
{unsubscribe_link}

Cordialement,
MappingCrimeFrance
"""

    send_email(to_email, subject, body)


def notify_subscribers(incident):
    db = SessionLocal()

    subscribers = (
        db.query(SubscriberDB)
        .filter(SubscriberDB.status == "confirmed")
        .all()
    )

    for subscriber in subscribers:
        distance = calculate_distance_km(
            incident.latitude,
            incident.longitude,
            subscriber.latitude,
            subscriber.longitude,
        )

        if distance <= subscriber.radius_km:
            try:
                send_alert_email(
                    subscriber.email,
                    incident,
                    distance,
                    subscriber.id,
                    subscriber.radius_km,
                )
                print(f"Email d'alerte envoyé à {subscriber.email}")
            except Exception as error:
                print(f"Erreur email alerte {subscriber.email} :", error)

    db.close()


@app.get("/")
def root():
    return {"message": "API MappingCrimeFrance OK"}


@app.get("/incidents")
def get_incidents(
    sector: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
):
    db = SessionLocal()
    query = db.query(IncidentDB).filter(IncidentDB.status == "approved")

    if sector:
        query = query.filter(IncidentDB.address.ilike(f"%{sector}%"))

    event_date = func.coalesce(IncidentDB.incident_date, func.date(IncidentDB.created_at))
    if date_from:
        query = query.filter(event_date >= date_from)

    if date_to:
        query = query.filter(event_date <= date_to)

    incidents = query.order_by(IncidentDB.created_at.desc()).all()
    db.close()
    return incidents


@app.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    allowed_extensions = {
        ".jpg", ".jpeg", ".png", ".webp", ".gif",
        ".mp4", ".mov", ".webm",
    }

    extension = Path(file.filename or "").suffix.lower()

    if extension not in allowed_extensions:
        return {"error": "Format de fichier non autorisé"}

    content = await file.read()

    max_size = 50 * 1024 * 1024
    if len(content) > max_size:
        return {"error": "Fichier trop volumineux. Maximum 50 Mo."}

    unique_name = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    media_type = "video" if extension in {".mp4", ".mov", ".webm"} else "image"

    return {
        "media_url": f"/uploads/{unique_name}",
        "media_type": media_type,
    }


@app.post("/incidents")
def create_incident(incident: IncidentCreate, request: Request):
    db = SessionLocal()

    if not incident.reporter_email or "@" not in incident.reporter_email:
        db.close()
        return {"error": "Email de contact invalide"}

    if not verify_turnstile(incident.captcha_token):
        db.close()
        return {"error": "Captcha invalide"}

    client_ip = request.client.host if request.client else "unknown"

    if client_ip in RATE_LIMIT:
        last_time = RATE_LIMIT[client_ip]
        if time.time() - last_time < 60:
            db.close()
            return {"error": "Veuillez attendre 60 secondes avant un nouveau signalement"}

    RATE_LIMIT[client_ip] = time.time()

    new_incident = IncidentDB(
        reporter_email=incident.reporter_email.strip().lower(),
        type=incident.type,
        incident_date=incident.incident_date,
        video_url=str(incident.video_url) if incident.video_url else None,
        incident_time=incident.incident_time if incident.incident_time else None,
        address=incident.address,
        description=incident.description,
        latitude=incident.latitude,
        longitude=incident.longitude,
        media_url=incident.media_url,
        media_type=incident.media_type,
        status="pending",
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    db.close()

    return new_incident




@lru_cache(maxsize=110)
def department_commune_shapes(department):
    # Only a public department code is sent; never a subscriber address or location.
    query = "fields=nom,code,centre,contour&format=json&geometry=contour"
    with urllib.request.urlopen(
        "https://geo.api.gouv.fr/departements/" + department + "/communes?" + query, timeout=15
    ) as response:
        return json.load(response)


def point_in_ring(x, y, ring):
    inside = False
    for i, a in enumerate(ring):
        b = ring[i - 1]
        if (a[1] > y) != (b[1] > y):
            crossing = (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]
            if x < crossing:
                inside = not inside
    return inside


def commune_contains(commune, longitude, latitude):
    geometry = commune.get("contour", {})
    coordinates = geometry.get("coordinates", [])
    polygons = [coordinates] if geometry.get("type") == "Polygon" else coordinates if geometry.get("type") == "MultiPolygon" else []
    return any(polygon and point_in_ring(longitude, latitude, polygon[0])
               and not any(point_in_ring(longitude, latitude, hole) for hole in polygon[1:])
               for polygon in polygons)


@app.get("/subscriber-communes")
def subscriber_communes():
    """Public aggregate only; commune matching runs locally on the server."""
    db = SessionLocal()
    try:
        subscribers = db.query(SubscriberDB).filter(SubscriberDB.status == "confirmed").all()
        groups = {}
        for subscriber in subscribers:
            if not subscriber.commune_code:
                postal_codes = re.findall(r"\b\d{5}\b", subscriber.address)
                if not postal_codes:
                    continue
                postal = postal_codes[-1]
                department = postal[:3] if postal.startswith(("97", "98")) else postal[:2]
                departments = ["2A", "2B"] if department == "20" else [department]
                try:
                    matches = [commune for dep in departments for commune in department_commune_shapes(dep)
                               if commune_contains(commune, subscriber.longitude, subscriber.latitude)]
                    if len(matches) != 1:
                        continue
                    commune = matches[0]
                    coordinates = commune["centre"]["coordinates"]
                    subscriber.commune_code = commune["code"]
                    subscriber.commune_name = commune["nom"]
                    subscriber.commune_latitude = coordinates[1]
                    subscriber.commune_longitude = coordinates[0]
                except Exception:
                    continue
            code = subscriber.commune_code
            if code not in groups:
                groups[code] = {
                    "code": code, "name": subscriber.commune_name, "count": 0,
                    "latitude": subscriber.commune_latitude,
                    "longitude": subscriber.commune_longitude,
                }
            groups[code]["count"] += 1
        db.commit()
        return sorted(groups.values(), key=lambda group: group["code"])
    finally:
        db.close()

@app.post("/subscribers")
def create_subscriber(subscriber: SubscriberCreate):
    db = SessionLocal()
    email = subscriber.email.strip().lower()

    existing = db.query(SubscriberDB).filter(SubscriberDB.email == email).first()

    if existing:
        existing.commune_code = None
        existing.commune_name = None
        existing.commune_latitude = None
        existing.commune_longitude = None
        existing.address = subscriber.address
        existing.latitude = subscriber.latitude
        existing.longitude = subscriber.longitude
        existing.radius_km = subscriber.radius_km
        existing.status = "pending"

        db.commit()
        db.refresh(existing)


        db.close()
        return {"message": "Demande enregistrée, en attente de validation par un administrateur", "status": "pending"}

    new_subscriber = SubscriberDB(
        email=email,
        address=subscriber.address,
        latitude=subscriber.latitude,
        longitude=subscriber.longitude,
        radius_km=subscriber.radius_km,
        status="pending",
    )

    db.add(new_subscriber)
    db.commit()
    db.refresh(new_subscriber)


    db.close()
    return {"message": "Demande enregistrée, en attente de validation par un administrateur", "status": "pending"}


@app.put("/subscribers/{subscriber_id}/confirm")
def confirm_subscriber(subscriber_id: int):
    raise HTTPException(
        status_code=410,
        detail="L’inscription doit être validée par un administrateur. Un email sera envoyé après validation.",
    )


@app.delete("/subscribers/{subscriber_id}/unsubscribe")
def unsubscribe(subscriber_id: int):
    db = SessionLocal()
    subscriber = db.query(SubscriberDB).filter(SubscriberDB.id == subscriber_id).first()

    if not subscriber:
        db.close()
        return {"error": "Abonnement introuvable"}

    db.delete(subscriber)
    db.commit()
    db.close()

    return {"message": "Désinscription confirmée"}


class AdminLogin(BaseModel):
    username: str
    password: str


def sign_admin_session(payload: str) -> str:
    return hmac.new(
        ADMIN_TOKEN.encode(),
        b"mappingcrimefrance-admin-session:" + payload.encode(),
        hashlib.sha256,
    ).hexdigest()


def require_admin(session: Optional[str]) -> None:
    if len(ADMIN_TOKEN) < 32:
        raise HTTPException(status_code=503, detail="Administration indisponible")
    try:
        expires, nonce, signature = (session or "").split(".", 2)
        payload = f"{expires}.{nonce}"
        if int(expires) > int(time.time()) and hmac.compare_digest(
            signature.encode(), sign_admin_session(payload).encode()
        ):
            return
    except ValueError:
        pass
    raise HTTPException(status_code=401, detail="Connexion requise")


@app.post("/admin/session")
def create_admin_session(credentials: AdminLogin):
    if len(ADMIN_TOKEN) < 32:
        raise HTTPException(status_code=503, detail="Administration indisponible")
    password_matches = hmac.compare_digest(credentials.password.encode(), ADMIN_TOKEN.encode())
    if credentials.username != "flettinger" or not password_matches:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    payload = f"{int(time.time()) + ADMIN_SESSION_SECONDS}.{uuid.uuid4().hex}"
    return {"session": f"{payload}.{sign_admin_session(payload)}", "max_age": ADMIN_SESSION_SECONDS}


@app.get("/admin/incidents")
def get_pending_incidents(x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()

    incidents = (
        db.query(IncidentDB)
        .filter(IncidentDB.status == "pending")
        .order_by(IncidentDB.created_at.desc())
        .all()
    )

    db.close()
    return incidents


@app.get("/admin/incidents/all")
def get_all_admin_incidents(x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    incidents = db.query(IncidentDB).order_by(IncidentDB.created_at.desc()).all()
    db.close()

    return incidents


@app.put("/admin/incidents/{incident_id}/approve")
def approve_incident(incident_id: int, x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    incident = db.query(IncidentDB).filter(IncidentDB.id == incident_id).first()

    if not incident:
        db.close()
        return {"error": "Incident introuvable"}

    incident.status = "approved"
    db.commit()
    db.refresh(incident)

    notify_subscribers(incident)

    db.close()
    return {"message": "Incident validé et alertes envoyées"}


@app.put("/admin/incidents/{incident_id}/reject")
def reject_incident(incident_id: int, x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    incident = db.query(IncidentDB).filter(IncidentDB.id == incident_id).first()

    if not incident:
        db.close()
        return {"error": "Incident introuvable"}

    incident.status = "rejected"
    db.commit()
    db.close()

    return {"message": "Incident rejeté"}


@app.delete("/admin/incidents/{incident_id}")
def delete_incident(incident_id: int, x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    incident = db.query(IncidentDB).filter(IncidentDB.id == incident_id).first()

    if not incident:
        db.close()
        return {"error": "Incident introuvable"}

    db.delete(incident)
    db.commit()
    db.close()

    return {"message": "Incident supprimé"}

@app.get("/admin/subscribers")
def get_admin_subscribers(x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()

    subscribers = (
        db.query(SubscriberDB)
        .order_by(SubscriberDB.created_at.desc())
        .all()
    )

    db.close()
    return subscribers

@app.put("/admin/subscribers/{subscriber_id}/confirm")
def admin_confirm_subscriber(subscriber_id: int, x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    try:
        subscriber = db.query(SubscriberDB).filter(SubscriberDB.id == subscriber_id).with_for_update().first()
        if not subscriber:
            raise HTTPException(status_code=404, detail="Abonné introuvable")
        if subscriber.status == "confirmed":
            return {"message": "Abonné déjà confirmé"}

        if not EMAIL_USER or not EMAIL_PASSWORD:
            raise HTTPException(status_code=503, detail="Envoi du mail indisponible. L’inscription reste en attente.")
        try:
            send_subscription_approved_email(subscriber)
        except Exception:
            raise HTTPException(status_code=503, detail="Le mail de validation n’a pas pu être envoyé. Réessayez.")

        subscriber.status = "confirmed"
        db.commit()
        return {"message": "Abonné confirmé et email de validation envoyé"}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.delete("/admin/subscribers/{subscriber_id}")
def admin_delete_subscriber(subscriber_id: int, x_admin_session: Optional[str] = Header(None)):
    require_admin(x_admin_session)

    db = SessionLocal()
    subscriber = db.query(SubscriberDB).filter(SubscriberDB.id == subscriber_id).first()

    if not subscriber:
        db.close()
        return {"error": "Abonné introuvable"}

    db.delete(subscriber)
    db.commit()
    db.close()

    return {"message": "Abonné supprimé"}