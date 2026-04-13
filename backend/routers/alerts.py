# ============================================================================
# FICHIER: alerts.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier contient toutes les routes API pour la gestion des alertes
#   du système PV Monitor. Il permet de consulter, prendre en compte,
#   résoudre et supprimer les alertes générées par le système.
#
# 📥 ENDPOINTS PRINCIPAUX:
#   GET    /api/v1/alerts/                      - Liste toutes les alertes (filtrable)
#   GET    /api/v1/alerts/{alert_id}            - Récupère une alerte spécifique
#   POST   /api/v1/alerts/{alert_id}/acknowledge - Marque une alerte comme lue
#   POST   /api/v1/alerts/{alert_id}/resolve    - Marque une alerte comme résolue
#   DELETE /api/v1/alerts/{alert_id}            - Supprime une alerte (admin)
#   POST   /api/v1/alerts/acknowledge-all       - Marque toutes les alertes comme lues
#   POST   /api/v1/alerts/resolve-all           - Marque toutes les alertes comme résolues
#
# 🚨 TYPES D'ALERTES (AlertType):
#   - soiling         : Ensablement des panneaux
#   - power_drop      : Baisse de production
#   - device_offline  : ESP32 hors ligne
#   - low_production  : Production anormalement basse
#   - high_temperature: Température élevée
#   - communication_error: Erreur de communication
#   - system          : Alerte système générique
#
# 📊 SÉVÉRITÉS (AlertSeverity):
#   - info     : Information simple
#   - warning  : Alerte modérée (nettoyage recommandé)
#   - critical : Alerte critique (action immédiate requise)
#
# 🔐 AUTHENTIFICATION:
#   - Tous les endpoints nécessitent un token JWT valide (verify_token)
#   - La suppression d'alerte nécessite un rôle admin
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from database import alerts_collection, users_collection
from auth import verify_token
from schemas import Alert, AlertSeverity, AlertType, AlertAcknowledge, AlertResolve

# Création du routeur pour regrouper toutes les routes d'alertes
# Toutes les routes commenceront par /api/v1/alerts
router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


# ============================================================================
# 📋 LISTE DES ALERTES (AVEC FILTRES)
# ============================================================================

@router.get("/", response_model=List[Alert])
async def get_alerts(
    severity: Optional[AlertSeverity] = None,
    resolved: bool = False,
    device_id: Optional[str] = None,
    alert_type: Optional[AlertType] = None,
    limit: int = 50,
    token_payload: dict = Depends(verify_token)
):
    """
    Récupère la liste des alertes avec possibilité de filtrage.
    
    📥 PARAMÈTRES DE FILTRAGE (tous optionnels):
        - severity   : Filtre par sévérité (info/warning/critical)
        - resolved   : Filtre par statut de résolution (False = actives)
        - device_id  : Filtre par identifiant de device ESP32
        - alert_type : Filtre par type d'alerte (soiling/power_drop/...)
        - limit      : Nombre maximum d'alertes à retourner (défaut=50)
    
    📤 SORTIE: Liste d'objets Alert (triées des plus récentes aux plus anciennes)
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    """
    # Construction de la requête MongoDB à partir des filtres
    query = {}
    if severity:
        query["severity"] = severity
    if resolved is not None:
        query["resolved"] = resolved
    if device_id:
        query["device_id"] = device_id
    if alert_type:
        query["type"] = alert_type
    
    # ✅ CORRECTION: Trier par created_at (timestamp n'existe pas dans la base)
    cursor = alerts_collection.find(query).sort("created_at", -1).limit(limit)
    alerts_data = await cursor.to_list(length=limit)
    
    # Formater les résultats pour le frontend
    result = []
    for doc in alerts_data:
        doc.pop("_id", None)  # Supprimer l'ID MongoDB
        
        # ✅ CORRECTION: S'assurer que timestamp existe pour le frontend
        if "timestamp" not in doc and "created_at" in doc:
            doc["timestamp"] = doc["created_at"]
        
        result.append(Alert(**doc))
    return result


# ============================================================================
# 🔍 ALERTE SPÉCIFIQUE
# ============================================================================

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str, token_payload: dict = Depends(verify_token)):
    """
    Récupère une alerte spécifique par son identifiant unique.
    
    📥 ENTRÉE:
        - alert_id: Identifiant unique de l'alerte (champ "id", pas "_id" MongoDB)
    
    📤 SORTIE: Objet Alert complet
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    """
    doc = await alerts_collection.find_one({"id": alert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    doc.pop("_id", None)
    
    # ✅ CORRECTION: S'assurer que timestamp existe
    if "timestamp" not in doc and "created_at" in doc:
        doc["timestamp"] = doc["created_at"]
    
    return Alert(**doc)


# ============================================================================
# ✅ PRISE EN COMPTE D'UNE ALERTE (ACKNOWLEDGE)
# ============================================================================

@router.post("/{alert_id}/acknowledge", response_model=Alert)
async def acknowledge_alert(
    alert_id: str,
    data: AlertAcknowledge,
    token_payload: dict = Depends(verify_token)
):
    """
    Marque une alerte comme "prise en compte" (lue par l'utilisateur).
    
    📥 ENTRÉE:
        - alert_id: Identifiant de l'alerte
        - data.acknowledged_by: Nom ou identifiant de la personne qui a pris en compte
    
    📤 SORTIE: Objet Alert mis à jour (acknowledged=True)
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 NOTE: Une alerte peut être prise en compte mais pas encore résolue.
             Cela permet de savoir qu'elle a été vue sans être encore traitée.
    """
    doc = await alerts_collection.find_one({"id": alert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    update_data = {
        "acknowledged": True,
        "acknowledged_by": data.acknowledged_by,
        "acknowledged_at": datetime.now(timezone.utc)
    }
    await alerts_collection.update_one({"id": alert_id}, {"$set": update_data})
    
    updated = await alerts_collection.find_one({"id": alert_id})
    updated.pop("_id", None)
    
    # ✅ CORRECTION: S'assurer que timestamp existe
    if "timestamp" not in updated and "created_at" in updated:
        updated["timestamp"] = updated["created_at"]
    
    return Alert(**updated)


# ============================================================================
# 🔧 RÉSOLUTION D'UNE ALERTE
# ============================================================================

@router.post("/{alert_id}/resolve", response_model=Alert)
async def resolve_alert(
    alert_id: str,
    data: AlertResolve,
    token_payload: dict = Depends(verify_token)
):
    """
    Marque une alerte comme "résolue" (le problème a été traité).
    
    📥 ENTRÉE:
        - alert_id: Identifiant de l'alerte
        - data.resolution_notes: Notes optionnelles sur la résolution
    
    📤 SORTIE: Objet Alert mis à jour (resolved=True, resolved_at, resolution_notes)
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 NOTE: Une alerte résolue est considérée comme fermée.
             On ne peut plus la réactiver après résolution.
    """
    doc = await alerts_collection.find_one({"id": alert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    update_data = {
        "resolved": True,
        "resolved_at": datetime.now(timezone.utc),
        "resolution_notes": data.resolution_notes
    }
    await alerts_collection.update_one({"id": alert_id}, {"$set": update_data})
    
    updated = await alerts_collection.find_one({"id": alert_id})
    updated.pop("_id", None)
    
    # ✅ CORRECTION: S'assurer que timestamp existe
    if "timestamp" not in updated and "created_at" in updated:
        updated["timestamp"] = updated["created_at"]
    
    return Alert(**updated)


# ============================================================================
# 🗑️ SUPPRESSION D'UNE ALERTE (ADMIN UNIQUEMENT)
# ============================================================================

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, token_payload: dict = Depends(verify_token)):
    """
    Supprime définitivement une alerte de la base de données.
    
    📥 ENTRÉE:
        - alert_id: Identifiant de l'alerte à supprimer
    
    📤 SORTIE: {"status": "ok", "message": "Alerte supprimée"}
    
    🔒 AUTHENTIFICATION: Token JWT requis + rôle admin
    
    ⚠️ ACTION IRREVERSIBLE: Cette suppression est définitive !
    """
    # Vérifier que l'utilisateur a le rôle admin
    user_id = token_payload.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    result = await alerts_collection.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"status": "ok", "message": "Alerte supprimée"}


# ============================================================================
# ✅ PRISE EN COMPTE DE TOUTES LES ALERTES (ACTION DE MASSE)
# ============================================================================

@router.post("/acknowledge-all", response_model=dict)
async def acknowledge_all_alerts(
    token_payload: dict = Depends(verify_token)
):
    """
    Marque TOUTES les alertes non lues et non résolues comme "prises en compte".
    
    📤 SORTIE: Nombre d'alertes modifiées
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 UTILISATION: Utile quand on veut tout marquer comme lu en une fois.
    """
    result = await alerts_collection.update_many(
        {"acknowledged": False, "resolved": False},
        {
            "$set": {
                "acknowledged": True,
                "acknowledged_by": token_payload.get("sub", "system"),
                "acknowledged_at": datetime.now(timezone.utc)
            }
        }
    )
    return {
        "status": "ok",
        "modified_count": result.modified_count,
        "message": f"{result.modified_count} alertes marquées comme lues"
    }


# ============================================================================
# 🔧 RÉSOLUTION DE TOUTES LES ALERTES (ACTION DE MASSE)
# ============================================================================

@router.post("/resolve-all", response_model=dict)
async def resolve_all_alerts(
    token_payload: dict = Depends(verify_token)
):
    """
    Marque TOUTES les alertes actives (non résolues) comme "résolues".
    
    📤 SORTIE: Nombre d'alertes modifiées
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 UTILISATION: Utile après une maintenance générale qui résout tous les problèmes.
    """
    result = await alerts_collection.update_many(
        {"resolved": False},
        {
            "$set": {
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc),
                "resolution_notes": "Résolution en masse par l'utilisateur"
            }
        }
    )
    return {
        "status": "ok",
        "modified_count": result.modified_count,
        "message": f"{result.modified_count} alertes résolues"
    }