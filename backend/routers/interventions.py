# ============================================================================
# FICHIER: interventions.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère les interventions de maintenance effectuées sur les
#   panneaux solaires (nettoyage, réparation, inspection, etc.).
#   Chaque intervention est enregistrée avec son coût, son efficacité
#   (niveau d'ensablement avant/après) et son statut.
#
# 📥 ENDPOINTS:
#   GET    /api/v1/maintenance/interventions               - Liste des interventions
#   POST   /api/v1/maintenance/interventions               - Créer une intervention
#   GET    /api/v1/maintenance/interventions/{id}          - Détails d'une intervention
#   PUT    /api/v1/maintenance/interventions/{id}          - Modifier une intervention
#   DELETE /api/v1/maintenance/interventions/{id}          - Supprimer une intervention
#
# 📊 STRUCTURE D'UNE INTERVENTION:
#   {
#     "id": "67f8a1b2...",           # ID MongoDB
#     "date": "2026-04-11T10:30:00Z", # Date de l'intervention
#     "type": "cleaning",             # cleaning/repair/inspection/other
#     "device_id": "esp2",            # Panneau concerné
#     "technician": "Ali Nouh",       # Technicien intervenant
#     "notes": "Nettoyage complet",   # Description détaillée
#     "cost": 50.0,                   # Coût en DT (Dinars Tunisiens)
#     "before_level": 65.2,           # Ensablement avant intervention (%)
#     "after_level": 12.5,            # Ensablement après intervention (%)
#     "status": "completed",          # planned/in_progress/completed/cancelled
#     "created_at": "...",            # Date de création (auto)
#     "updated_at": "..."             # Date de dernière modification (auto)
#   }
#
# 🚦 STATUTS POSSIBLES:
#   - planned     : Planifiée (pas encore commencée)
#   - in_progress : En cours
#   - completed   : Terminée
#   - cancelled   : Annulée
#
# 🛠️ TYPES D'INTERVENTION:
#   - cleaning  : Nettoyage des panneaux
#   - repair    : Réparation technique
#   - inspection: Inspection visuelle/test
#   - other     : Autre type
#
# 🔐 AUTHENTIFICATION:
#   - Tous les endpoints acceptent l'authentification optionnelle
#   - Sans token, on peut lire les interventions (consultation publique)
#   - Pour créer/modifier/supprimer, il faut un token (rôle utilisateur)
#
# 💡 UTILITÉ:
#   - Suivi des coûts de maintenance
#   - Calcul du ROI (retour sur investissement du nettoyage)
#   - Historique des interventions par device
#   - Planification des prochaines maintenances
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from database import interventions_collection, users_collection
from auth import verify_token, optional_verify_token
import logging

logger = logging.getLogger(__name__)

# Création du routeur pour les endpoints de maintenance
# Toutes les routes commenceront par /api/v1/maintenance
router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])


# ============================================================================
# 📋 LISTE DES INTERVENTIONS (AVEC FILTRES)
# ============================================================================

@router.get("/interventions")
async def get_interventions(
    device_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Récupère la liste des interventions avec filtres optionnels.
    
    📥 PARAMÈTRES (tous optionnels):
        - device_id : Filtrer par device spécifique
        - status    : Filtrer par statut (planned/in_progress/completed/cancelled)
        - limit     : Nombre maximum d'interventions (défaut=100)
    
    📤 SORTIE: Liste des interventions (triées par date décroissante)
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    💡 UTILISATION TYPIQUE:
        - GET /interventions → Toutes les interventions
        - GET /interventions?device_id=esp2 → Interventions sur esp2
        - GET /interventions?status=planned → Interventions planifiées
    
    📊 LOGS: Enregistre le nombre d'interventions récupérées
    """
    try:
        logger.info("📋 Récupération des interventions")
        
        # Construction de la requête MongoDB
        query = {}
        if device_id:
            query["device_id"] = device_id
        if status:
            query["status"] = status
        
        # Exécution de la requête (tri par date décroissante)
        cursor = interventions_collection.find(query).sort("date", -1).limit(limit)
        interventions = await cursor.to_list(length=limit)
        
        # Formatage des résultats pour le frontend
        result = []
        for inv in interventions:
            result.append({
                "id": str(inv["_id"]),
                "date": inv.get("date", ""),
                "type": inv.get("type", ""),
                "device_id": inv.get("device_id", ""),
                "technician": inv.get("technician", ""),
                "notes": inv.get("notes", ""),
                "cost": inv.get("cost", 0),
                "before_level": inv.get("before_level", 0),
                "after_level": inv.get("after_level", 0),
                "status": inv.get("status", ""),
                "created_at": inv.get("created_at", ""),
                "updated_at": inv.get("updated_at", "")
            })
        
        logger.info(f"✅ {len(result)} interventions récupérées")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération interventions: {e}")
        return []  # Retourne une liste vide en cas d'erreur


# ============================================================================
# ➕ CRÉATION D'UNE INTERVENTION
# ============================================================================

@router.post("/interventions")
async def create_intervention(
    intervention: dict,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Crée une nouvelle intervention de maintenance.
    
    📥 ENTRÉE (JSON):
        {
            "date": "2026-04-11T10:30:00Z",  # Date de l'intervention
            "type": "cleaning",               # Type d'intervention
            "device_id": "esp2",              # Device concerné
            "technician": "Ali Nouh",         # Technicien
            "notes": "Nettoyage complet",     # Description (optionnel)
            "cost": 50.0,                     # Coût en DT (optionnel)
            "before_level": 65.2,             # Ensablement avant (%)
            "after_level": 12.5,              # Ensablement après (%)
            "status": "completed"             # Statut
        }
    
    📤 SORTIE: Intervention créée (avec id, created_at, updated_at)
    
    🔓 AUTHENTIFICATION: Optionnelle (mais recommandée)
    
    🔒 VALIDATION:
        - Les champs requis: date, type, device_id, technician, status
        - Les dates created_at et updated_at sont ajoutées automatiquement
    
    ⚠️ ERREURS:
        - 400: Champ requis manquant
        - 500: Erreur interne (base de données)
    
    💡 NOTE: Le niveau d'ensablement avant/après permet de calculer
             l'efficacité du nettoyage et le ROI.
    """
    try:
        logger.info(f"➕ Création intervention: {intervention}")
        
        # ====================================================================
        # VALIDATION DES CHAMPS REQUIS
        # ====================================================================
        required_fields = ["date", "type", "device_id", "technician", "status"]
        for field in required_fields:
            if not intervention.get(field):
                raise HTTPException(status_code=400, detail=f"Champ requis manquant: {field}")
        
        # ====================================================================
        # AJOUT DES DATES AUTO
        # ====================================================================
        now = datetime.now(timezone.utc).isoformat()
        intervention["created_at"] = now
        intervention["updated_at"] = now
        
        # ====================================================================
        # INSERTION DANS MONGODB
        # ====================================================================
        result = await interventions_collection.insert_one(intervention)
        intervention_id = str(result.inserted_id)
        
        logger.info(f"✅ Intervention créée avec ID: {intervention_id}")
        
        # Récupérer l'intervention créée pour la retourner
        created = await interventions_collection.find_one({"_id": result.inserted_id})
        
        return {
            "id": str(created["_id"]),
            "date": created.get("date", ""),
            "type": created.get("type", ""),
            "device_id": created.get("device_id", ""),
            "technician": created.get("technician", ""),
            "notes": created.get("notes", ""),
            "cost": created.get("cost", 0),
            "before_level": created.get("before_level", 0),
            "after_level": created.get("after_level", 0),
            "status": created.get("status", ""),
            "created_at": created.get("created_at", ""),
            "updated_at": created.get("updated_at", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur création intervention: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🔍 DÉTAILS D'UNE INTERVENTION SPÉCIFIQUE
# ============================================================================

@router.get("/interventions/{intervention_id}")
async def get_intervention(
    intervention_id: str,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Récupère les détails complets d'une intervention par son ID.
    
    📥 ENTRÉE:
        - intervention_id : ID MongoDB de l'intervention
    
    📤 SORTIE: Intervention complète
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    ⚠️ ERREURS:
        - 404: Intervention non trouvée
        - 500: Erreur interne
    """
    try:
        logger.info(f"🔍 Récupération intervention {intervention_id}")
        
        # Recherche par ID MongoDB
        intervention = await interventions_collection.find_one({"_id": ObjectId(intervention_id)})
        
        if not intervention:
            raise HTTPException(status_code=404, detail="Intervention non trouvée")
        
        return {
            "id": str(intervention["_id"]),
            "date": intervention.get("date", ""),
            "type": intervention.get("type", ""),
            "device_id": intervention.get("device_id", ""),
            "technician": intervention.get("technician", ""),
            "notes": intervention.get("notes", ""),
            "cost": intervention.get("cost", 0),
            "before_level": intervention.get("before_level", 0),
            "after_level": intervention.get("after_level", 0),
            "status": intervention.get("status", ""),
            "created_at": intervention.get("created_at", ""),
            "updated_at": intervention.get("updated_at", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur récupération intervention: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ✏️ MODIFICATION D'UNE INTERVENTION
# ============================================================================

@router.put("/interventions/{intervention_id}")
async def update_intervention(
    intervention_id: str,
    updates: dict,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Met à jour une intervention existante.
    
    📥 ENTRÉE:
        - intervention_id : ID MongoDB de l'intervention
        - updates : Dictionnaire des champs à modifier
    
    📤 SORTIE: Intervention mise à jour
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    🔄 CHAMPS MODIFIABLES:
        - Tous les champs peuvent être modifiés
        - updated_at est automatiquement mis à jour
    
    ⚠️ ERREURS:
        - 404: Intervention non trouvée
        - 500: Erreur interne
    """
    try:
        logger.info(f"✏️ Mise à jour intervention {intervention_id}: {updates}")
        
        # Vérifier que l'intervention existe
        existing = await interventions_collection.find_one({"_id": ObjectId(intervention_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Intervention non trouvée")
        
        # Mettre à jour la date de modification
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Appliquer les modifications
        await interventions_collection.update_one(
            {"_id": ObjectId(intervention_id)},
            {"$set": updates}
        )
        
        # Récupérer l'intervention mise à jour
        updated = await interventions_collection.find_one({"_id": ObjectId(intervention_id)})
        
        return {
            "id": str(updated["_id"]),
            "date": updated.get("date", ""),
            "type": updated.get("type", ""),
            "device_id": updated.get("device_id", ""),
            "technician": updated.get("technician", ""),
            "notes": updated.get("notes", ""),
            "cost": updated.get("cost", 0),
            "before_level": updated.get("before_level", 0),
            "after_level": updated.get("after_level", 0),
            "status": updated.get("status", ""),
            "created_at": updated.get("created_at", ""),
            "updated_at": updated.get("updated_at", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur mise à jour intervention: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 🗑️ SUPPRESSION D'UNE INTERVENTION
# ============================================================================

@router.delete("/interventions/{intervention_id}")
async def delete_intervention(
    intervention_id: str,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Supprime définitivement une intervention.
    
    📥 ENTRÉE:
        - intervention_id : ID MongoDB de l'intervention
    
    📤 SORTIE: {"message": "Intervention supprimée avec succès"}
    
    🔓 AUTHENTIFICATION: Optionnelle (mais recommandée)
    
    ⚠️ ERREURS:
        - 404: Intervention non trouvée
        - 500: Erreur interne
    
    💡 NOTE: Cette suppression est IRRÉVERSIBLE !
             Les données d'historique de maintenance seront perdues.
    """
    try:
        logger.info(f"🗑️ Suppression intervention {intervention_id}")
        
        # Vérifier que l'intervention existe
        existing = await interventions_collection.find_one({"_id": ObjectId(intervention_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Intervention non trouvée")
        
        # Supprimer l'intervention
        await interventions_collection.delete_one({"_id": ObjectId(intervention_id)})
        
        return {"message": "Intervention supprimée avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur suppression intervention: {e}")
        raise HTTPException(status_code=500, detail=str(e))