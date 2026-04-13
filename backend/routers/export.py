# ============================================================================
# FICHIER: export.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier permet d'exporter toutes les données de surveillance
#   des panneaux solaires dans différents formats (JSON ou CSV).
#   Utile pour l'analyse externe, les rapports ou la sauvegarde.
#
# 📥 ENDPOINT:
#   GET /api/v1/export - Exporte toutes les données
#     Paramètre: format = "json" (défaut) ou "csv"
#
# 📤 SORTIE:
#   - Format JSON: Fichier .json téléchargé
#   - Format CSV: Fichier .csv téléchargé
#
# 📊 CHAMPS EXPORTÉS (CSV):
#   - timestamp      : Date/heure de la mesure
#   - device_id      : Identifiant du device ESP32
#   - voltage        : Tension mesurée (Volts)
#   - current        : Courant mesuré (Ampères)
#   - power_output   : Puissance calculée (Watts)
#   - irradiance     : Irradiance solaire (W/m²)
#   - soiling_level  : Niveau d'ensablement (0-100%)
#   - status         : Clean/Warning/Critical
#   - confidence     : Confiance de l'IA (0-1)
#   - model_version  : Version du modèle IA utilisée
#   - temperature    : Température du panneau (°C)
#
# 🔒 AUTHENTIFICATION:
#   - Requise (verify_token) - Seuls les utilisateurs authentifiés
#     peuvent exporter les données
#
# ⚡ OPTIMISATIONS:
#   - Le champ image_b64 est exclu (trop lourd pour l'export)
#   - Toutes les données sont chargées en mémoire (attention volume)
#
# 💡 UTILISATION TYPIQUE:
#   - Export mensuel pour analyse Excel
#   - Sauvegarde des données historiques
#   - Intégration avec d'autres systèmes (via API)
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from io import StringIO
import csv
import json
from bson import json_util
from database import surveillance_collection
from auth import verify_token

# Création du routeur pour les endpoints d'export
# Toutes les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["export"])


# ============================================================================
# 📤 EXPORT DES DONNÉES (JSON ou CSV)
# ============================================================================

@router.get("/export")
async def export_data(
    format: str = "json",
    token_payload: dict = Depends(verify_token)
):
    """
    Exporte toutes les données de surveillance au format JSON ou CSV.
    
    📥 PARAMÈTRES:
        - format : "json" (défaut) ou "csv"
    
    📤 SORTIE:
        - Fichier téléchargé (Content-Disposition: attachment)
        - Nom du fichier: pv-data.json ou pv-data.csv
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    ⚠️ LIMITATIONS:
        - Exporte TOUTES les données (pas de pagination)
        - Attention aux volumes importants (mémoire)
        - Les images (base64) sont exclues
    
    💡 EXEMPLE D'UTILISATION:
        GET /api/v1/export?format=csv
        → Télécharge un fichier CSV avec toutes les mesures
    
    🚨 ERREURS:
        - 400: Format non supporté (ni json, ni csv)
        - 401: Token invalide ou absent
    """
    # Récupérer toutes les données (sans les images base64)
    cursor = surveillance_collection.find({}, {"media.image_b64": 0})
    data = await cursor.to_list(length=None)
    
    # ========================================================================
    # FORMAT JSON
    # ========================================================================
    if format.lower() == "json":
        # Convertir les données MongoDB (ObjectId, dates) en JSON standard
        json_data = json.loads(json_util.dumps(data))
        
        # Retourner le fichier JSON en téléchargement
        return JSONResponse(
            content=json_data,
            headers={"Content-Disposition": "attachment; filename=pv-data.json"}
        )
    
    # ========================================================================
    # FORMAT CSV
    # ========================================================================
    elif format.lower() == "csv":
        # Créer un buffer mémoire pour écrire le CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Écrire l'en-tête (noms des colonnes)
        writer.writerow([
            "timestamp", "device_id", "voltage", "current",
            "power_output", "irradiance", "soiling_level",
            "status", "confidence", "model_version", "temperature"
        ])
        
        # Écrire chaque mesure ligne par ligne
        for doc in data:
            writer.writerow([
                doc.get("timestamp"),
                doc.get("device_id"),
                doc.get("electrical_data", {}).get("voltage", 0),
                doc.get("electrical_data", {}).get("current", 0),
                doc.get("electrical_data", {}).get("power_output", 0),
                doc.get("electrical_data", {}).get("irradiance", 0),
                doc.get("ai_analysis", {}).get("soiling_level", 0),
                doc.get("ai_analysis", {}).get("status", ""),
                doc.get("ai_analysis", {}).get("confidence", 0),
                doc.get("ai_analysis", {}).get("model_version", ""),
                doc.get("electrical_data", {}).get("temperature", ""),
            ])
        
        # Retourner le fichier CSV en téléchargement
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=pv-data.csv"}
        )
    
    # ========================================================================
    # FORMAT NON SUPPORTÉ
    # ========================================================================
    else:
        raise HTTPException(status_code=400, detail="Format non supporté")