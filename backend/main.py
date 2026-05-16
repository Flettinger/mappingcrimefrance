import json
import math
import os
import smtplib
import time
import urllib.parse
import urllib.request
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Header, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import Column, Float, Integer, String, Text, TIMESTAMP, Time, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
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
    status = Column(String(20), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())


# IMPORTANT : créer les tables APRÈS la définition des modèles
Base.metadata.create_all(bind=engine)


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
    incident_time: Optional[str] = None
    address: str
    description: str
    latitude: float
    longitude: float
    captcha_token: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class SubscriberCreate(BaseModel):
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

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
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


def send_confirmation_email(subscriber):
    confirmation_link = f"{FRONTEND_URL}/confirm-subscription/{subscriber.id}"

    subject = "Confirmez votre inscription MappingCrimeFrance"

    body = f"""
Bonjour,

Vous avez demandé à recevoir les alertes MappingCrimeFrance dans un rayon de 10 km autour de :

{subscriber.address}

Pour confirmer votre inscription, cliquez sur le lien suivant :

{confirmation_link}

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

Cordialement,
MappingCrimeFrance
"""

    send_email(subscriber.email, subject, body)


def send_alert_email(to_email: str, incident, distance: float, subscriber_id: int):
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

Vous recevez cet email car vous êtes inscrit aux alertes MappingCrimeFrance dans un rayon de 10 km.

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
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    db = SessionLocal()
    query = db.query(IncidentDB).filter(IncidentDB.status == "approved")

    if sector:
        query = query.filter(IncidentDB.address.ilike(f"%{sector}%"))

    if date_from:
        query = query.filter(IncidentDB.created_at >= datetime.fromisoformat(date_from))

    if date_to:
        query = query.filter(IncidentDB.created_at <= datetime.fromisoformat(date_to))

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


@app.post("/subscribers")
def create_subscriber(subscriber: SubscriberCreate):
    db = SessionLocal()
    email = subscriber.email.strip().lower()

    existing = db.query(SubscriberDB).filter(SubscriberDB.email == email).first()

    if existing:
        existing.address = subscriber.address
        existing.latitude = subscriber.latitude
        existing.longitude = subscriber.longitude
        existing.radius_km = 10
        existing.status = "pending"

        db.commit()
        db.refresh(existing)

        try:
            send_confirmation_email(existing)
        except Exception as error:
            print("Erreur email confirmation :", error)

        db.close()
        return {"message": "Email de confirmation envoyé"}

    new_subscriber = SubscriberDB(
        email=email,
        address=subscriber.address,
        latitude=subscriber.latitude,
        longitude=subscriber.longitude,
        radius_km=10,
        status="pending",
    )

    db.add(new_subscriber)
    db.commit()
    db.refresh(new_subscriber)

    try:
        send_confirmation_email(new_subscriber)
    except Exception as error:
        print("Erreur email confirmation :", error)

    db.close()
    return {"message": "Email de confirmation envoyé"}


@app.put("/subscribers/{subscriber_id}/confirm")
def confirm_subscriber(subscriber_id: int):
    db = SessionLocal()
    subscriber = db.query(SubscriberDB).filter(SubscriberDB.id == subscriber_id).first()

    if not subscriber:
        db.close()
        return {"error": "Abonnement introuvable"}

    subscriber.status = "confirmed"
    db.commit()
    db.close()

    return {"message": "Inscription confirmée"}


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


@app.get("/admin/incidents")
def get_pending_incidents(x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        return {"error": "Accès refusé"}

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
def get_all_admin_incidents(x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        return {"error": "Accès refusé"}

    db = SessionLocal()
    incidents = db.query(IncidentDB).order_by(IncidentDB.created_at.desc()).all()
    db.close()

    return incidents


@app.put("/admin/incidents/{incident_id}/approve")
def approve_incident(incident_id: int, x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        return {"error": "Accès refusé"}

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
def reject_incident(incident_id: int, x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        return {"error": "Accès refusé"}

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
def delete_incident(incident_id: int, x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        return {"error": "Accès refusé"}

    db = SessionLocal()
    incident = db.query(IncidentDB).filter(IncidentDB.id == incident_id).first()

    if not incident:
        db.close()
        return {"error": "Incident introuvable"}

    db.delete(incident)
    db.commit()
    db.close()

    return {"message": "Incident supprimé"}