# ============================================================================
# FICHIER: heartbeat.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère le système de "heartbeat" (battement de cœur)
#   des dispositifs ESP32. Chaque ESP32 doit envoyer régulièrement
#   un signal pour indiquer qu'il est toujours actif et connecté.
#   Cela permet de détecter les devices hors ligne.
#
# 📥 ENDPOINTS:
#   POST /api/v1/heartbeat - Envoi d'un heartbeat (ESP32 → serveur)
#   GET  /api/v1/heartbeat - Récupère le statut de tous les heartbeats
#
# 🫀 FONCTIONNEMENT:
#   - Les ESP32 envoient un heartbeat toutes les X secondes
#   - Le serveur enregistre la date du dernier signal reçu
#   - Une tâche de fond (offline_check.py) détecte les devices
#     qui n'ont pas envoyé de signal depuis plus de 65 secondes
#
# 📤 STRUCTURE D'UN HEARTBEAT (POST):
#   {
#     "device_id": "esp2",      # Identifiant du device
#     "uptime": 3600            # (optionnel) Uptime en secondes
#   }
#
# 🔐 AUTHENTIFICATION:
#   - POST: Optionnelle (optional_verify_token)
#   - GET: Sans authentification
#
# 🔗 INTÉGRATION:
#   - offline_checker : Tâche de fond qui surveille les heartbeats
#   - devices_collection : Stocke la dernière date de heartbeat
#   - alerts : Génère une alerte si device offline
#
# 💡 TYPICAL USAGE:
#   - ESP32: Envoie heartbeat toutes les 10 secondes
#   - Serveur: Met à jour last_heartbeat dans MongoDB
#   - Offline checker: Si last_heartbeat > 65s → alerte
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from auth import optional_verify_token
from schemas import HeartbeatData
from tasks.offline_check import get_offline_checker 

# Création du routeur pour les endpoints de heartbeat
# Toutes les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["heartbeat"])

# Cache mémoire local des heartbeats (utilisé comme fallback)
_heartbeats = {}


# ============================================================================
# 🔧 VALIDATION DES DONNÉES HEARTBEAT
# ============================================================================

async def valid_heartbeat(payload: dict) -> HeartbeatData:
    """
    Valide et convertit le payload du heartbeat en objet HeartbeatData.
    
    📥 ENTRÉE:
        - payload: Dictionnaire JSON reçu dans la requête
          {
              "device_id": "esp2",
              "uptime": 3600    # optionnel
          }
    
    📤 SORTIE: Objet HeartbeatData validé
    
    ⚠️ ERREURS:
        - 422: Validation échouée (device_id manquant ou invalide)
    """
    try:
        return HeartbeatData(**payload)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


# ============================================================================
# 📤 ENVOI D'UN HEARTBEAT (ESP32 → SERVEUR)
# ============================================================================

@router.post("/heartbeat")
async def heartbeat(
    payload: dict = Depends(valid_heartbeat),
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Reçoit un signal de vie (heartbeat) d'un device ESP32.
    
    📥 ENTRÉE:
        - payload.device_id : Identifiant du device ESP32
        - payload.uptime    : (optionnel) Temps de fonctionnement
    
    📤 SORTIE:
        {"status": "ok", "device_id": device_id}
    
    🔓 AUTHENTIFICATION: Optionnelle (les ESP32 peuvent envoyer sans token)
    
    🔄 ACTIONS EFFECTUÉES:
        1. Met à jour le cache mémoire offline_checker
        2. Met à jour la date last_heartbeat dans MongoDB
    
    💡 FRÉQUENCE RECOMMANDÉE:
        - Envoyer toutes les 10-30 secondes
        - Le seuil d'offline est de 65 secondes
    
    ⚠️ NOTE: Si le device n'existe pas dans devices_collection,
              l'option upsert=True le crée automatiquement.
    """
    device_id = payload.device_id
    
    # ========================================================================
    # 1. Mettre à jour le cache mémoire (offline_checker)
    # ========================================================================
    # offline_checker est une tâche de fond qui surveille les heartbeats
    # et détecte les devices offline
    offline_checker = get_offline_checker()
    offline_checker.update_heartbeat(device_id)
    
    # ========================================================================
    # 2. Mettre à jour la base de données MongoDB
    # ========================================================================
    # upsert=True : crée le document s'il n'existe pas
    from database import devices_collection
    await devices_collection.update_one(
        {"device_id": device_id},
        {"$set": {"last_heartbeat": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"status": "ok", "device_id": device_id}


# ============================================================================
# 📊 CONSULTATION DES STATUTS HEARTBEAT
# ============================================================================

@router.get("/heartbeat")
async def get_heartbeat():
    """
    Récupère le statut de tous les heartbeats (online/offline).
    
    📤 SORTIE:
        {
            "status": "ok",
            "devices": {
                "esp1": {
                    "last_heartbeat": "2026-04-11T15:30:00Z",
                    "online": true,
                    "seconds_since": 5
                },
                "esp2": {
                    "last_heartbeat": "2026-04-11T14:15:00Z",
                    "online": false,
                    "seconds_since": 75
                }
            }
        }
    
    🔓 AUTHENTIFICATION: Aucune (public)
    
    💡 UTILISATION:
        - Dashboard principal (afficher statut online/offline)
        - Page d'administration des devices
        - Monitoring en temps réel
    
    📊 INTERPRÉTATION:
        - online = true  : Device actif (heartbeat < 65s)
        - online = false : Device hors ligne (heartbeat ≥ 65s)
    """
    offline_checker = get_offline_checker()
    return {"status": "ok", "devices": offline_checker.get_all_heartbeats()}