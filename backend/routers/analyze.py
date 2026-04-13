# ============================================================================
# FICHIER: analyze.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier permet l'analyse manuelle d'images de panneaux solaires.
#   Un utilisateur peut télécharger une photo d'un panneau, et le système
#   utilise l'IA pour déterminer le niveau d'ensablement.
#
# 📥 ENDPOINT PRINCIPAL:
#   POST /api/v1/analyze - Analyse une image téléchargée manuellement
#
# 🔬 FONCTIONNEMENT:
#   1. L'utilisateur télécharge une image (JPEG) et optionnellement des données
#      électriques (tension, courant)
#   2. L'image est sauvegardée dans le dossier "storage/"
#   3. Le modèle IA analyse l'image pour déterminer:
#      - Niveau d'ensablement (0-100%)
#      - Statut (Clean/Warning/Critical)
#      - Confiance de la prédiction (0-1)
#   4. L'image est convertie en base64 pour stockage et affichage
#   5. Toutes les données sont sauvegardées dans MongoDB
#   6. Le résultat est retourné au frontend
#
# 📤 SORTIE:
#   - soiling_level: Pourcentage d'ensablement (0-100)
#   - status: "Clean", "Warning", ou "Critical"
#   - confidence: Confiance de l'IA (0-100%)
#   - image_b64: Image encodée en base64 pour l'affichage
#   - cleaning_recommendation: "Nettoyage recommandé" ou "Panneau propre"
#
# 🔐 AUTHENTIFICATION:
#   - Optionnelle (optional_verify_token) - peut être utilisé sans login
#   - Les données sont associées au device "manual" par défaut
#
# ============================================================================

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from datetime import datetime, timezone
from pathlib import Path
import base64
import shutil
from config import Config
from auth import optional_verify_token
from inference_engine import predict_soiling_level
from database import surveillance_collection
from schemas import AnalyzeData

# Création du routeur pour les routes d'analyse
# Les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["analyze"])

# Dossier de stockage des images (depuis configuration)
UPLOAD_DIR = Config.UPLOAD_DIR


# ============================================================================
# 🔧 VALIDATION DES DONNÉES D'ANALYSE
# ============================================================================

async def valid_analyze_data(
    device_id: str = Form(default="manual"),
    voltage: float = Form(default=0.0),
    current: float = Form(default=0.0),
) -> AnalyzeData:
    """
    Valide et extrait les données du formulaire multipart.
    
    📥 PARAMÈTRES (champs du formulaire):
        - device_id : Identifiant du device (défaut="manual")
        - voltage   : Tension mesurée en Volts (défaut=0.0)
        - current   : Courant mesuré en Ampères (défaut=0.0)
    
    📤 SORTIE: Objet AnalyzeData validé
    
    🔧 UTILISATION: Dépendance FastAPI injectée dans la route principale
    """
    try:
        return AnalyzeData(device_id=device_id, voltage=voltage, current=current)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


# ============================================================================
# 📸 ANALYSE MANUELLE D'IMAGE
# ============================================================================

@router.post("/analyze")
async def analyze_manual(
    data: AnalyzeData = Depends(valid_analyze_data),
    image: UploadFile = File(...),
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Analyse une image téléchargée manuellement pour détecter l'ensablement.
    
    📥 ENTRÉE (multipart/form-data):
        - image     : Fichier image (JPEG) - REQUIS
        - device_id : Identifiant du device (optionnel, défaut="manual")
        - voltage   : Tension en Volts (optionnel, défaut=0.0)
        - current   : Courant en Ampères (optionnel, défaut=0.0)
    
    📤 SORTIE:
        {
            "soiling_level": 45.2,           # Pourcentage d'ensablement
            "status": "Warning",              # Clean/Warning/Critical
            "confidence": 87.5,              # Confiance en pourcentage
            "image_b64": "base64...",        # Image encodée
            "cleaning_recommendation": "Nettoyage recommandé"
        }
    
    🔓 AUTHENTIFICATION: Optionnelle (même sans login, l'analyse fonctionne)
    
    💡 DÉTAILS TECHNIQUES:
        1. L'image est sauvegardée avec un nom unique: manual_YYYYMMDD_HHMMSS.jpg
        2. Le modèle IA (Hybrid_v1) analyse l'image
        3. L'image est convertie en base64 pour l'affichage frontend
        4. Les données sont stockées dans MongoDB collection "surveillance"
    """
    
    # ========================================================================
    # 1. SAUVEGARDE DE L'IMAGE
    # ========================================================================
    # Générer un nom de fichier unique basé sur la date/heure
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"manual_{timestamp_str}.jpg"
    file_path = Path(UPLOAD_DIR) / file_name
    
    # Sauvegarder le fichier image sur le disque
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # ========================================================================
    # 2. ANALYSE PAR L'IA
    # ========================================================================
    # Initialisation avec valeurs par défaut en cas d'erreur
    soiling_percent, status, confidence = 0.0, "Error", 0.0
    try:
        # Appel au moteur d'inférence IA
        soiling_percent, status, confidence = predict_soiling_level(str(file_path))
        soiling_percent = float(soiling_percent)
        confidence = float(confidence)
    except Exception as e:
        # En cas d'erreur, les valeurs par défaut restent (0.0, "Error", 0.0)
        pass
    
    # ========================================================================
    # 3. CONVERSION EN BASE64 POUR LE FRONTEND
    # ========================================================================
    # L'image est encodée en base64 pour être affichée directement dans le navigateur
    image_b64 = ""
    try:
        with open(file_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")
    except:
        pass
    
    # ========================================================================
    # 4. CRÉATION DU DOCUMENT MONGODB
    # ========================================================================
    document = {
        "timestamp": datetime.now(timezone.utc),
        "device_id": data.device_id,                    # "manual" par défaut
        "source": "manual",                             # Distingue des ESP32
        "electrical_data": {
            "voltage": data.voltage,
            "current": data.current,
            "power_output": data.voltage * data.current,  # Calcul automatique
            "irradiance": 0                               # Non mesuré en manuel
        },
        "ai_analysis": {
            "soiling_level": soiling_percent,
            "status": status,
            "confidence": confidence,
            "model_version": "Hybrid_v1"                  # Version du modèle IA
        },
        "media": {
            "image_url": f"/storage/{file_name}",         # URL pour accès direct
            "image_b64": image_b64                        # Image encodée
        }
    }
    
    # Sauvegarder dans MongoDB
    await surveillance_collection.insert_one(document)
    
    # ========================================================================
    # 5. RÉPONSE AU CLIENT
    # ========================================================================
    return {
        "soiling_level": soiling_percent,
        "status": status,
        "confidence": round(confidence * 100, 1),         # Convertir 0.87 → 87.0%
        "image_b64": image_b64,
        "cleaning_recommendation": "Nettoyage recommandé" if soiling_percent > 30 else "Panneau propre"
    }