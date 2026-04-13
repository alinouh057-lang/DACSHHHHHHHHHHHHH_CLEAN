# ============================================================================
# FICHIER: maintenance.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère les logs de maintenance et le planning de nettoyage
#   des panneaux solaires. Il permet de suivre les actions effectuées
#   (nettoyage, réparation, inspection) et de planifier les prochaines
#   interventions en fonction du niveau d'ensablement.
#
# 📥 ENDPOINTS:
#   GET  /api/v1/maintenance/logs              - Liste des logs de maintenance
#   POST /api/v1/maintenance/logs              - Ajouter un log de maintenance
#   GET  /api/v1/maintenance/schedule/{device_id} - Planning de maintenance
#
# 📊 STRUCTURE D'UN LOG DE MAINTENANCE:
#   {
#     "id": "maintenance_1",           # Identifiant unique
#     "device_id": "esp2",             # Panneau concerné
#     "action": "cleaning",            # cleaning/repair/inspection/...
#     "date": "2026-04-11T10:30:00Z",  # Date de l'action
#     "description": "Nettoyage complet", # Description
#     "operator": "Ali Nouh",          # Opérateur
#     "images": ["url1.jpg", ...],     # Photos (optionnel)
#     "cost": 50.0,                    # Coût (optionnel)
#     "energy_gained_estimate": 12.5,  # Énergie récupérée (kWh)
#     "notes": "..."                   # Notes supplémentaires
#   }
#
# 🛠️ ACTIONS POSSIBLES (MaintenanceAction):
#   - cleaning         : Nettoyage des panneaux
#   - repair           : Réparation technique
#   - inspection       : Inspection visuelle
#   - firmware_update  : Mise à jour du firmware ESP32
#   - calibration      : Calibrage des capteurs
#
# 📅 PLANNING DE MAINTENANCE (MaintenanceSchedule):
#   {
#     "device_id": "esp2",
#     "next_cleaning": "2026-04-18T...",     # Prochain nettoyage suggéré
#     "next_inspection": "2026-07-10T...",   # Prochaine inspection (90j)
#     "recommended_actions": [...],          # Actions recommandées
#     "priority": "high"                     # low/medium/high
#   }
#
# 🔐 AUTHENTIFICATION:
#   - Tous les endpoints nécessitent un token JWT valide (verify_token)
#
# ⚠️ NOTE IMPORTANTE:
#   - Les logs sont actuellement stockés en mémoire (liste Python)
#   - À remplacer par MongoDB en production (persistance)
#   - Les données sont perdues au redémarrage du serveur
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from database import surveillance_collection
from auth import verify_token
from schemas import MaintenanceLog, MaintenanceLogCreate, MaintenanceSchedule

# Création du routeur pour les endpoints de maintenance
# Toutes les routes commenceront par /api/v1/maintenance
router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])

# ============================================================================
# 📦 STOCKAGE TEMPORAIRE (À REMPLACER PAR MONGODB)
# ============================================================================
# ⚠️ ATTENTION: Ces listes sont en mémoire vive
#    - Les données sont perdues au redémarrage
#    - Non persistentes entre les sessions
#    - À remplacer par interventions_collection de database.py
_maintenance_logs = []      # Liste des logs de maintenance
_maintenance_counter = 0    # Compteur pour générer des IDs uniques


# ============================================================================
# 📋 LISTE DES LOGS DE MAINTENANCE
# ============================================================================

@router.get("/logs", response_model=List[MaintenanceLog])
async def get_maintenance_logs(
    device_id: Optional[str] = None,
    limit: int = 50,
    token_payload: dict = Depends(verify_token)
):
    """
    Récupère la liste des logs de maintenance.
    
    📥 PARAMÈTRES (optionnels):
        - device_id : Filtrer par device spécifique
        - limit     : Nombre maximum de logs (défaut=50)
    
    📤 SORTIE: Liste des logs (triés par date décroissante)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    💡 UTILISATION TYPIQUE:
        - GET /logs → Tous les logs
        - GET /logs?device_id=esp2 → Logs pour esp2 seulement
        - GET /logs?limit=10 → Derniers 10 logs
    
    ⚠️ NOTE: Les logs sont triés du plus récent au plus ancien.
    """
    logs = _maintenance_logs
    if device_id:
        logs = [log for log in logs if log.device_id == device_id]
    logs.sort(key=lambda x: x.date, reverse=True)
    return logs[:limit]


# ============================================================================
# ➕ AJOUTER UN LOG DE MAINTENANCE
# ============================================================================

@router.post("/logs", response_model=MaintenanceLog)
async def add_maintenance_log(
    log: MaintenanceLogCreate,
    token_payload: dict = Depends(verify_token)
):
    """
    Ajoute une nouvelle entrée dans le journal de maintenance.
    
    📥 ENTRÉE (MaintenanceLogCreate):
        - device_id              : Device concerné (requis)
        - action                 : Type d'action (requis)
        - description            : Description détaillée (requis)
        - operator               : Nom de l'opérateur (requis)
        - images                 : Liste d'URLs d'images (optionnel)
        - cost                   : Coût de l'intervention (optionnel)
        - energy_gained_estimate : Énergie récupérée estimée (kWh)
        - notes                  : Notes supplémentaires (optionnel)
    
    📤 SORTIE: Objet MaintenanceLog créé (avec id et date auto)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🔧 FONCTIONNALITÉS:
        - Génération automatique d'un ID unique
        - Date automatique (UTC)
        - Stockage en mémoire (à remplacer par MongoDB)
    
    💡 EXEMPLE D'UTILISATION:
        POST /api/v1/maintenance/logs
        {
            "device_id": "esp2",
            "action": "cleaning",
            "description": "Nettoyage après tempête de sable",
            "operator": "Ali Nouh",
            "cost": 50.0,
            "energy_gained_estimate": 8.5
        }
    """
    global _maintenance_counter
    _maintenance_counter += 1
    
    # Créer le nouveau log avec les champs automatiques
    new_log = MaintenanceLog(
        id=f"maintenance_{_maintenance_counter}",
        device_id=log.device_id,
        action=log.action,
        date=datetime.now(timezone.utc),
        description=log.description,
        operator=log.operator,
        images=log.images or [],
        cost=log.cost,
        energy_gained_estimate=log.energy_gained_estimate,
        notes=log.notes
    )
    _maintenance_logs.append(new_log)
    return new_log


# ============================================================================
# 📅 PLANNING DE MAINTENANCE PRÉVISIONNEL
# ============================================================================

@router.get("/schedule/{device_id}", response_model=MaintenanceSchedule)
async def get_maintenance_schedule(
    device_id: str,
    token_payload: dict = Depends(verify_token)
):
    """
    Génère un planning de maintenance prévisionnel basé sur l'ensablement.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device
    
    📤 SORTIE: Objet MaintenanceSchedule contenant:
        - next_cleaning      : Date suggérée pour le prochain nettoyage
        - next_inspection    : Date de la prochaine inspection (90 jours)
        - recommended_actions: Liste d'actions recommandées
        - priority           : low/medium/high
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    📊 LOGIQUE DE PLANIFICATION:
        - Ensablement > 60%  → Nettoyage dans 1 jour (priorité high)
        - Ensablement 30-60% → Nettoyage dans 7 jours (priorité medium)
        - Ensablement < 30%  → Nettoyage dans 30 jours (priorité low)
        - Inspection systématique tous les 90 jours
        - Actions recommandées basées sur le niveau d'ensablement
    
    💡 UTILISATION TYPIQUE:
        - Dashboard principal (afficher prochain nettoyage)
        - Page de planification des maintenances
        - Alertes automatiques avant échéance
    """
    # Récupérer la dernière mesure du device
    doc = await surveillance_collection.find_one(
        {"device_id": device_id},
        sort=[("timestamp", -1)]
    )
    
    # Extraire le niveau d'ensablement (ou 0 si pas de données)
    soiling = doc.get("ai_analysis", {}).get("soiling_level", 0) if doc else 0
    
    # ========================================================================
    # DÉTERMINER LA DATE DU PROCHAIN NETTOYAGE SELON L'ENSABLEMENT
    # ========================================================================
    if soiling > 60:
        priority = "high"
        next_cleaning = datetime.now(timezone.utc) + timedelta(days=1)
    elif soiling > 30:
        priority = "medium"
        next_cleaning = datetime.now(timezone.utc) + timedelta(days=7)
    else:
        priority = "low"
        next_cleaning = datetime.now(timezone.utc) + timedelta(days=30)
    
    # ========================================================================
    # ACTIONS RECOMMANDÉES BASÉES SUR L'ENSABLEMENT
    # ========================================================================
    recommended_actions = []
    if soiling > 30:
        recommended_actions.append("Nettoyage des panneaux")
    if soiling > 60:
        recommended_actions.append("Inspection visuelle")
    
    # ========================================================================
    # CONSTRUCTION DE LA RÉPONSE
    # ========================================================================
    return MaintenanceSchedule(
        device_id=device_id,
        next_cleaning=next_cleaning,
        next_inspection=datetime.now(timezone.utc) + timedelta(days=90),  # Tous les 90 jours
        recommended_actions=recommended_actions,
        priority=priority
    )