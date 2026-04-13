# ============================================================================
# FICHIER: devices.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère l'enregistrement, la configuration et la gestion
#   des dispositifs ESP32 qui surveillent les panneaux solaires.
#   Chaque device physique (ESP32 avec capteurs) doit être enregistré
#   ici avant de pouvoir envoyer des données.
#
# 📥 ENDPOINTS:
#   POST   /api/v1/devices/           - Ajouter un nouveau device
#   GET    /api/v1/devices/           - Lister tous les devices
#   GET    /api/v1/devices/{device_id} - Détails d'un device spécifique
#   PUT    /api/v1/devices/{device_id} - Modifier un device
#   DELETE /api/v1/devices/{device_id} - Supprimer un device
#
# 📊 STRUCTURE D'UN DEVICE:
#   {
#     "device_id": "esp2",              # Identifiant unique
#     "name": "ESP32 Zone A",           # Nom descriptif
#     "installation_date": "2026-04-01T...", # Date d'installation
#     "last_maintenance": "...",        # Dernière maintenance (optionnel)
#     "status": "active",               # active/maintenance/offline/error
#     "last_heartbeat": "...",          # Dernier signal de vie
#     "latitude": 36.8065,              # Position GPS (optionnel)
#     "longitude": 10.1815,             # Position GPS (optionnel)
#     "zone": "Zone Test"               # Zone géographique (optionnel)
#   }
#
# 🚦 STATUTS POSSIBLES:
#   - active      : Device opérationnel, envoie des données
#   - maintenance : En maintenance, ignore les données
#   - offline     : Hors ligne (heartbeat non reçu)
#   - error       : En erreur (nécessite intervention)
#
# 🔐 AUTHENTIFICATION:
#   - GET (liste) et POST: optionnelle (optional_verify_token)
#   - PUT et DELETE: obligatoire + nécessite token valide
#
# 🔗 RELATION AVEC LE HEARTBEAT:
#   - Le champ last_heartbeat est mis à jour automatiquement
#     par le endpoint /api/v1/heartbeat
#   - Les devices offline sont détectés via offline_check.py
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from database import devices_collection
from auth import optional_verify_token, verify_token
from schemas import Device, DeviceCreate, DeviceUpdate

# Création du routeur pour la gestion des devices
# Toutes les routes commenceront par /api/v1/devices
router = APIRouter(prefix="/api/v1/devices", tags=["devices"])


# ============================================================================
# ➕ AJOUTER UN NOUVEAU DEVICE
# ============================================================================

@router.post("/", response_model=Device)
async def add_device(
    device: DeviceCreate,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Enregistre un nouveau device ESP32 dans la base de données.
    
    📥 ENTRÉE (DeviceCreate):
        - device_id : Identifiant unique (ex: "esp2", "esp32_zoneA")
        - name      : Nom descriptif (optionnel, défaut = device_id)
    
    📤 SORTIE: Objet Device avec les champs par défaut ajoutés
        - installation_date : Date/heure UTC actuelle
        - status            : "active" par défaut
        - last_heartbeat    : None (sera mis à jour plus tard)
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    ⚠️ ERREURS:
        - 400: Device ID déjà existant
        - 500: Erreur interne (base de données)
    
    💡 UTILISATION:
        - Avant de démarrer un ESP32, il faut l'enregistrer ici
        - Sinon, l'ESP32 recevra une erreur 403 "Device non autorisé"
    """
    try:
        # Vérifier si le device existe déjà
        existing = await devices_collection.find_one({"device_id": device.device_id})
        if existing:
            raise HTTPException(status_code=400, detail="Device ID déjà existant")
        
        # Créer le document du nouveau device
        new_device = {
            "device_id": device.device_id,
            "name": device.name or device.device_id,
            "installation_date": datetime.now(timezone.utc),
            "status": "active",
            "last_heartbeat": None
        }
        
        # Insérer dans MongoDB
        await devices_collection.insert_one(new_device)
        
        # Retourner le device créé
        return {
            "device_id": new_device["device_id"],
            "name": new_device["name"],
            "installation_date": new_device["installation_date"],
            "status": new_device["status"],
            "last_heartbeat": None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 📋 LISTER TOUS LES DEVICES
# ============================================================================

@router.get("/", response_model=List[Device])
async def get_devices(token_payload: dict | None = Depends(optional_verify_token)):
    """
    Récupère la liste complète de tous les devices enregistrés.
    
    📤 SORTIE: Liste d'objets Device (maximum 100 devices)
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    💡 UTILISATION:
        - Dashboard principal (afficher tous les ESP32)
        - Sélecteur de device dans les filtres
        - Page d'administration des devices
    
    ⚠️ NOTE: En cas d'erreur, retourne une liste vide ([]), pas d'exception.
    """
    try:
        cursor = devices_collection.find({})
        devices = await cursor.to_list(length=100)
        result = []
        for device in devices:
            result.append({
                "device_id": device.get("device_id", ""),
                "name": device.get("name") or device.get("device_id", "Inconnu"),
                "installation_date": device.get("installation_date") or datetime.now(timezone.utc),
                "last_maintenance": device.get("last_maintenance"),
                "status": device.get("status", "active"),
                "last_heartbeat": device.get("last_heartbeat"),
                "latitude": device.get("latitude"),
                "longitude": device.get("longitude"),
                "zone": device.get("zone")
            })
        return result
    except Exception as e:
        # En cas d'erreur, retourner une liste vide (pas d'exception)
        return []


# ============================================================================
# 🔍 DÉTAILS D'UN DEVICE SPÉCIFIQUE
# ============================================================================

@router.get("/{device_id}", response_model=Device)
async def get_device(
    device_id: str,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Récupère les détails complets d'un device spécifique par son ID.
    
    📥 ENTRÉE:
        - device_id : Identifiant unique du device (ex: "esp2")
    
    📤 SORTIE: Objet Device complet
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    ⚠️ ERREURS:
        - 404: Device non trouvé
        - 500: Erreur interne
    """
    try:
        device = await devices_collection.find_one({"device_id": device_id})
        if not device:
            raise HTTPException(status_code=404, detail="Device non trouvé")
        
        return {
            "device_id": device.get("device_id", ""),
            "name": device.get("name") or device.get("device_id", "Inconnu"),
            "installation_date": device.get("installation_date") or datetime.now(timezone.utc),
            "last_maintenance": device.get("last_maintenance"),
            "status": device.get("status", "active"),
            "last_heartbeat": device.get("last_heartbeat"),
            "latitude": device.get("latitude"),
            "longitude": device.get("longitude"),
            "zone": device.get("zone")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ✏️ MODIFIER UN DEVICE
# ============================================================================

@router.put("/{device_id}")
async def update_device(
    device_id: str,
    update: DeviceUpdate,
    token_payload: dict = Depends(verify_token)
):
    """
    Met à jour les informations d'un device existant.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device à modifier
        - update    : Objet DeviceUpdate (champs optionnels à modifier)
          Champs modifiables: name, location, zone, status, last_maintenance
    
    📤 SORTIE: Device mis à jour (version simplifiée)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    ⚠️ ERREURS:
        - 404: Device non trouvé
        - 500: Erreur interne
    
    💡 UTILISATION TYPIQUE:
        - Changer le statut (active → maintenance)
        - Mettre à jour la date de dernière maintenance
        - Modifier le nom ou la zone
    """
    try:
        # Vérifier que le device existe
        existing = await devices_collection.find_one({"device_id": device_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Device non trouvé")
        
        # Construire les données de mise à jour (uniquement les champs fournis)
        update_data = {}
        for key, value in update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[key] = value
        
        # Appliquer la mise à jour si des champs sont à modifier
        if update_data:
            await devices_collection.update_one(
                {"device_id": device_id},
                {"$set": update_data}
            )
        
        # Récupérer le device mis à jour
        updated = await devices_collection.find_one({"device_id": device_id})
        
        return {
            "device_id": updated["device_id"],
            "name": updated.get("name") or updated["device_id"],
            "location": updated.get("location") or "Non spécifié",
            "last_maintenance": updated.get("last_maintenance"),
            "last_heartbeat": updated.get("last_heartbeat")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🗑️ SUPPRIMER UN DEVICE
# ============================================================================

@router.delete("/{device_id}")
async def delete_device_endpoint(
    device_id: str,
    token_payload: dict = Depends(verify_token)
):
    """
    Supprime définitivement un device de la base de données.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device à supprimer
    
    📤 SORTIE: {"status": "ok", "message": "Device supprimé"}
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    ⚠️ ERREURS:
        - 404: Device non trouvé
        - 500: Erreur interne
    
    💡 NOTES IMPORTANTES:
        - Cette suppression est IRRÉVERSIBLE
        - Les mesures historiques du device restent dans surveillance_collection
        - Le device ne pourra plus envoyer de données après suppression
        - Si vous voulez juste désactiver un device, utilisez PUT avec status="maintenance"
    """
    try:
        # Vérifier que le device existe
        existing = await devices_collection.find_one({"device_id": device_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Device non trouvé")
        
        # Supprimer le device
        result = await devices_collection.delete_one({"device_id": device_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Device non trouvé")
        
        return {"status": "ok", "message": "Device supprimé"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))