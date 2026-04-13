# ============================================================================
# FICHIER: ingest.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   C'est le fichier le PLUS IMPORTANT pour la collecte de données !
#   Il reçoit les données envoyées par les ESP32 (image + données électriques)
#   et les synchronise intelligemment.
#
# 🏗️ ARCHITECTURE: 2 ESP32 par panneau
#   - ESP32-CAM : Envoie uniquement l'image
#   - ESP32-ELEC : Envoie uniquement voltage/courant/température
#   - Ce serveur fusionne les deux sources en un seul document
#
# 🔄 MÉCANISME DE SYNCHRONISATION:
#   1. Le premier ESP32 qui envoie ses données démarre un timer de 5 secondes
#   2. Si le deuxième ESP32 envoie ses données pendant ce délai → fusion immédiate
#   3. Sinon → sauvegarde avec les données de la dernière mesure comme fallback
#
# 📥 ENDPOINT:
#   POST /api/v1/ingest (multipart/form-data)
#
# 📤 PARAMÈTRES:
#   - device_id   : Identifiant du device (obligatoire)
#   - voltage     : Tension en Volts (optionnel, ESP32-ELEC)
#   - current     : Courant en Ampères (optionnel, ESP32-ELEC)
#   - temperature : Température en °C (optionnel, ESP32-ELEC)
#   - image       : Fichier image JPEG (optionnel, ESP32-CAM)
#
# 🔐 AUTHENTIFICATION:
#   - Token JWT obligatoire (verify_token)
#   - Le device_id du token doit correspondre au device_id envoyé
#   - Le device doit avoir le statut "active"
#
# 🤖 TRAITEMENTS EFFECTUÉS:
#   - Sauvegarde de l'image sur disque
#   - Analyse IA de l'image (ensablement)
#   - Récupération de l'irradiance solaire (via API météo)
#   - Fusion des données image + électriques
#   - Stockage dans MongoDB
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path
import asyncio
import base64
import shutil
import time
from collections import defaultdict
from config import Config
from database import surveillance_collection, devices_collection
from auth import verify_token
from inference_engine import predict_soiling_level
from weather import getirradiance
from config_manager import get_config
import logging

logger = logging.getLogger(__name__)

# Création du routeur pour l'ingestion des données
# Toutes les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["ingest"])

# Dossier de stockage des images
UPLOAD_DIR = Config.UPLOAD_DIR

# ============================================================================
# 📦 CACHE PENDANT (pour synchroniser image + données électriques)
# ============================================================================
# Structure:
# pending_data[device_id] = {
#     "image": {...},       # Données image (b64, url, analyse IA)
#     "electrical": {...},  # Données électriques (V, A, Temp, irradiance)
#     "first_seen": timestamp,
#     "task": asyncio.Task
# }
pending_data = defaultdict(dict)


# ============================================================================
# 🔐 VÉRIFICATION D'AUTORISATION DU DEVICE
# ============================================================================

async def is_device_authorized(device_id: str) -> bool:
    """
    Vérifie si un device est autorisé à envoyer des données.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device ESP32
    
    📤 SORTIE:
        - True si le device existe et a le statut "active"
        - False sinon
    
    🔒 SÉCURITÉ:
        - Seuls les devices avec status="active" peuvent envoyer
        - status="maintenance" ou "offline" sont refusés
    """
    device = await devices_collection.find_one({"device_id": device_id}, {"status": 1})
    return device and device.get("status") == "active"


# ============================================================================
# 💾 SAUVEGARDE DU DOCUMENT COMPLET (IMAGE + ÉLECTRIQUE)
# ============================================================================

async def save_complete_document(device_id: str, image_data: dict = None, electrical_data: dict = None):
    """
    Fusionne les données image et électriques en un seul document MongoDB.
    
    📥 ENTRÉE:
        - device_id       : Identifiant du device
        - image_data      : Données de l'image (b64, url, analyse IA)
        - electrical_data : Données électriques (V, A, Temp, irradiance)
    
    🔄 STRATÉGIE DE FUSION:
        - Priorité aux données reçues (image ou électrique)
        - Si manquantes → utiliser la dernière mesure connue (fallback)
    
    📤 SORTIE: Résultat de l'insertion MongoDB
    """
    # Récupérer la dernière mesure du device (pour fallback)
    last_doc = await surveillance_collection.find_one(
        {"device_id": device_id},
        sort=[("timestamp", -1)]
    )
    
    # ========================================================================
    # 1. INITIALISATION DES VALEURS
    # ========================================================================
    final_image_b64 = None
    final_image_url = None
    final_ai = {}
    voltage = 0.0
    current = 0.0
    temperature = None
    irradiance = 0.0

    # ========================================================================
    # 2. PRIORITÉ AUX NOUVELLES DONNÉES (IMAGE)
    # ========================================================================
    if image_data:
        final_image_b64 = image_data.get("b64")
        final_image_url = image_data.get("url")
        final_ai = image_data.get("ai", {})
    
    # ========================================================================
    # 3. PRIORITÉ AUX NOUVELLES DONNÉES (ÉLECTRIQUES)
    # ========================================================================
    if electrical_data:
        voltage = electrical_data.get("voltage", 0.0)
        current = electrical_data.get("current", 0.0)
        temperature = electrical_data.get("temperature")
        irradiance = electrical_data.get("irradiance", 0.0)

    # ========================================================================
    # 4. FALLBACK: Utiliser la dernière mesure si données manquantes
    # ========================================================================
    if not final_image_b64 and last_doc:
        final_image_b64 = last_doc.get("media", {}).get("image_b64")
        final_image_url = last_doc.get("media", {}).get("image_url")
        final_ai = last_doc.get("ai_analysis", {})
    
    if voltage == 0.0 and last_doc:
        voltage = last_doc.get("electrical_data", {}).get("voltage", 0.0)
        current = last_doc.get("electrical_data", {}).get("current", 0.0)
        temperature = last_doc.get("electrical_data", {}).get("temperature")
        irradiance = last_doc.get("electrical_data", {}).get("irradiance", 0.0)

    # ========================================================================
    # 5. CALCULS
    # ========================================================================
    power = voltage * current
    config = get_config()
    panel_area = config.get("panel_area_m2", 1.6)
    panel_efficiency = config.get("panel_efficiency", 0.20)

    # ========================================================================
    # 6. CRÉATION DU DOCUMENT COMPLET
    # ========================================================================
    complete_doc = {
        "timestamp": datetime.now(timezone.utc),
        "device_id": device_id,
        "electrical_data": {
            "voltage": voltage,
            "current": current,
            "power_output": power,
            "irradiance": irradiance,
        },
        "ai_analysis": final_ai,
        "media": {
            "image_url": final_image_url,
            "image_b64": final_image_b64,
        },
        "panel_config_used": {"area": panel_area, "efficiency": panel_efficiency},
        "synchronized": image_data is not None and electrical_data is not None  # True si les deux ESP ont envoyé
    }
    
    if temperature is not None:
        complete_doc["electrical_data"]["temperature"] = temperature
    
    # Sauvegarde dans MongoDB
    result = await surveillance_collection.insert_one(complete_doc)
    logger.info(f"✅ DOCUMENT COMPLET sauvegardé pour {device_id}")
    return result


# ============================================================================
# ⏱️ TIMER D'ATTENTE POUR SYNCHRONISATION
# ============================================================================

async def wait_and_merge(device_id: str, timeout: int = 5):
    """
    Attend le deuxième ESP32 pendant 'timeout' secondes.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device
        - timeout   : Temps d'attente maximum (secondes, défaut=5)
    
    🔄 FONCTIONNEMENT:
        1. Attend 'timeout' secondes
        2. Si l'autre ESP a envoyé ses données → fusion
        3. Sinon → sauvegarde avec données disponibles + fallback
        4. Nettoie le cache
    """
    await asyncio.sleep(timeout)
    data = pending_data.get(device_id)
    if not data:
        return
    await save_complete_document(device_id, data.get("image"), data.get("electrical"))
    if device_id in pending_data:
        del pending_data[device_id]
    logger.info(f"🧹 Cache nettoyé pour {device_id}")


# ============================================================================
# 📥 POINT D'ENTRÉE PRINCIPAL POUR LES ESP32
# ============================================================================

@router.post("/ingest")
async def ingest_data(
    device_id: str = Form(...),
    voltage: Optional[float] = Form(None),
    current: Optional[float] = Form(None),
    temperature: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    token_payload: dict = Depends(verify_token)
):
    """
    Reçoit et traite les données des ESP32 (image ou électriques).
    
    📥 PARAMÈTRES MULTIPART/FORM-DATA:
        - device_id   : Identifiant du device (obligatoire)
        - voltage     : Tension (V) - optionnel, ESP32-ELEC
        - current     : Courant (A) - optionnel, ESP32-ELEC
        - temperature : Température (°C) - optionnel, ESP32-ELEC
        - image       : Fichier JPEG - optionnel, ESP32-CAM
    
    🔒 SÉCURITÉ (3 niveaux):
        1. Le token JWT doit être valide
        2. Le device_id du token doit correspondre à celui de la requête
        3. Le device doit avoir le statut "active"
    
    🔄 LOGIQUE DE SYNCHRONISATION:
        - 1er ESP → démarre un timer de 5 secondes
        - 2ème ESP dans les 5s → fusion immédiate
        - Sinon → sauvegarde avec fallback
    
    📤 SORTIE:
        - synchronized: True si les deux ESP ont envoyé leurs données
        - pending: True si en attente de l'autre ESP
    """
    
    # ========================================================================
    # 1. AUTHENTIFICATION ET AUTORISATION
    # ========================================================================
    device_id_from_token = token_payload["device_id"]
    if device_id != device_id_from_token:
        raise HTTPException(status_code=403, detail="device_id ne correspond pas au token")
    
    if not await is_device_authorized(device_id):
        raise HTTPException(status_code=403, detail="Ce device n'est pas autorisé")

    # ========================================================================
    # 2. TRAITEMENT DE L'IMAGE (ESP32-CAM)
    # ========================================================================
    image_data = None
    if image:
        logger.info(f"📸 Traitement de l'image pour {device_id}")
        
        # Sauvegarde de l'image sur disque
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{device_id}_{timestamp_str}.jpg"
        file_path = Path(UPLOAD_DIR) / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Conversion en base64 pour stockage et affichage
        with open(file_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")
        
        # Analyse IA de l'image (détection d'ensablement)
        soiling_percent, status, confidence = 0.0, "Unknown", 0.0
        try:
            soiling_percent, status, confidence = predict_soiling_level(str(file_path))
            soiling_percent = float(soiling_percent)
            confidence = float(confidence)
            logger.info(f"🤖 IA: {soiling_percent:.1f}% ({status})")
        except Exception as e:
            logger.warning(f"⚠️ Erreur IA: {e}")
        
        # Structurer les données image
        image_data = {
            "b64": image_b64,
            "url": f"/storage/{file_name}",
            "ai": {
                "soiling_level": soiling_percent,
                "status": status,
                "confidence": confidence,
                "model_version": "Hybrid_v1",
            },
            "timestamp": time.time()
        }

    # ========================================================================
    # 3. TRAITEMENT DES DONNÉES ÉLECTRIQUES (ESP32-ELEC)
    # ========================================================================
    electrical_data = None
    if voltage is not None or current is not None:
        logger.info(f"⚡ Traitement des données électriques pour {device_id}")
        
        # Récupération de l'irradiance solaire via API météo
        irradiance = 0.0
        config = get_config()
        lat = config.get("latitude")
        lon = config.get("longitude")
        
        if lat and lon:
            try:
                irradiance = getirradiance(lat, lon)
                if irradiance:
                    irradiance = float(irradiance)
                    logger.info(f"🌞 irradiance: {irradiance:.1f} W/m²")
            except Exception as e:
                logger.warning(f"⚠️ Erreur irradiance: {e}")
        else:
            logger.warning("⚠️ Coordonnées globales non configurées")
        
        # Structurer les données électriques
        electrical_data = {
            "voltage": voltage if voltage is not None else 0.0,
            "current": current if current is not None else 0.0,
            "temperature": temperature,
            "irradiance": irradiance,
            "timestamp": time.time()
        }

    # ========================================================================
    # 4. VALIDATION : AU MOINS UN TYPE DE DONNÉES
    # ========================================================================
    if not image_data and not electrical_data:
        raise HTTPException(status_code=400, detail="Aucune donnée fournie")

    # ========================================================================
    # 5. STOCKAGE DANS LE CACHE PENDANT
    # ========================================================================
    if image_data:
        pending_data[device_id]["image"] = image_data
    if electrical_data:
        pending_data[device_id]["electrical"] = electrical_data

    # ========================================================================
    # 6. DÉMARRAGE DU TIMER (PREMIER ESP SEULEMENT)
    # ========================================================================
    if "first_seen" not in pending_data[device_id]:
        pending_data[device_id]["first_seen"] = time.time()
        task = asyncio.create_task(wait_and_merge(device_id))
        pending_data[device_id]["task"] = task
        logger.info(f"⏳ Timer démarré pour {device_id} (attente 5 secondes)")

    # ========================================================================
    # 7. SYNCHRONISATION IMMÉDIATE (DEUXIÈME ESP ARRIVÉ)
    # ========================================================================
    has_both = "image" in pending_data[device_id] and "electrical" in pending_data[device_id]
    if has_both:
        logger.info(f"🎯 Les DEUX types de données sont arrivés pour {device_id} !")
        # Annuler le timer car on a déjà tout reçu
        if "task" in pending_data[device_id]:
            pending_data[device_id]["task"].cancel()
        # Fusion et sauvegarde immédiate
        await save_complete_document(
            device_id,
            pending_data[device_id].get("image"),
            pending_data[device_id].get("electrical")
        )
        del pending_data[device_id]
        return {"status": "ok", "message": "Données synchronisées", "synchronized": True}

    # ========================================================================
    # 8. EN ATTENTE DE L'AUTRE ESP
    # ========================================================================
    return {
        "status": "pending",
        "message": "Données reçues, en attente de l'autre ESP (timeout 5s)",
        "has_image": image_data is not None,
        "has_electrical": electrical_data is not None
    }