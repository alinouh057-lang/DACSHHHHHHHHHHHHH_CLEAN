# ============================================================================
# FICHIER: __init__.py (dans backend/routers/)
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier est le point d'entrée pour tous les routeurs de l'API.
#   Il importe tous les routeurs individuels et les exporte dans une liste
#   qui sera utilisée par main.py pour les enregistrer auprès de FastAPI.
#
# 🗂️ LISTE DES ROUTEURS EXPORTÉS:
#   - admin_router         : Gestion administrateur (config, users, etc.)
#   - alerts_router        : Gestion des alertes
#   - analyze_router       : Analyse manuelle d'images
#   - cache_router         : Gestion du cache IA
#   - data_router          : Accès aux données (history, stats, latest)
#   - devices_router       : Gestion des devices ESP32
#   - export_router        : Export des données (JSON/CSV)
#   - heartbeat_router     : Réception des signaux de vie ESP32
#   - ingest_router        : Ingestion des données ESP32 (IMAGE + ELECTRIQUE)
#   - interventions_router : Gestion des interventions de maintenance
#   - maintenance_router   : Logs et planning de maintenance
#   - performance_router   : KPIs de performance (PR, rendement, etc.)
#   - reports_router       : Génération de rapports
#   - soiling_router       : Analyse d'ensablement (historique, prédictions)
#   - storage_router       : Gestion du stockage des images
#   - user_router          : Préférences utilisateur (fuseau horaire)
#
# 🔧 UTILISATION DANS main.py:
#   from routers import routers
#   for router in routers:
#       app.include_router(router)
#
# 📊 STRUCTURE DES URLS:
#   Tous les routeurs sont préfixés automatiquement:
#   - /api/v1/admin/*
#   - /api/v1/alerts/*
#   - /api/v1/analyze
#   - /api/v1/ai/cache-stats
#   - /api/v1/history, /api/v1/stats, etc.
#   - /api/v1/devices/*
#   - /api/v1/export
#   - /api/v1/heartbeat
#   - /api/v1/ingest
#   - /api/v1/maintenance/*
#   - /api/v1/performance/kpis
#   - /api/v1/export/report
#   - /api/v1/soiling/*
#   - /api/v1/storage/info
#   - /api/v1/user/timezone
#
# 💡 AVANTAGES DE CETTE ORGANISATION:
#   - Modularité: chaque routeur dans son propre fichier
#   - Maintenabilité: facile d'ajouter/supprimer/modifier des routes
#   - Réutilisabilité: les routeurs peuvent être testés indépendamment
#   - Lisibilité: le code est bien organisé par domaine fonctionnel
#
# ============================================================================

# ============================================================================
# 📥 IMPORTS DES ROUTEURS INDIVIDUELS
# ============================================================================
# Chaque fichier router expose une variable 'router' (APIRouter)
# Ces imports chargent tous les endpoints définis dans les fichiers respectifs

from .admin         import router as admin_router
from .alerts        import router as alerts_router
from .analyze       import router as analyze_router
from .cache         import router as cache_router
from .data          import router as data_router
from .devices       import router as devices_router
from .export        import router as export_router
from .heartbeat     import router as heartbeat_router
from .ingest        import router as ingest_router
from .interventions import router as interventions_router
from .maintenance   import router as maintenance_router
from .performance   import router as performance_router
from .reports       import router as reports_router
from .soiling       import router as soiling_router
from .storage       import router as storage_router
from .user          import router as user_router


# ============================================================================
# 📦 LISTE DE TOUS LES ROUTEURS (EXPORTÉE VERS main.py)
# ============================================================================
# Cette liste est utilisée par main.py pour enregistrer tous les routeurs
# auprès de l'application FastAPI en une seule boucle.
# L'ordre n'a pas d'importance car chaque routeur a son propre préfixe unique.

routers = [
    devices_router,          # Gestion des ESP32
    alerts_router,           # Alertes système
    soiling_router,          # Analyse d'ensablement
    maintenance_router,      # Maintenance (logs, planning)
    interventions_router,    # Interventions détaillées
    admin_router,            # Administration (config, users)
    ingest_router,           # Ingestion des données ESP32 (CRITIQUE)
    performance_router,      # KPIs de performance
    reports_router,          # Génération de rapports
    cache_router,            # Cache IA
    storage_router,          # Stockage des images
    data_router,             # Données (history, stats, latest)
    analyze_router,          # Analyse manuelle d'images
    heartbeat_router,        # Signaux de vie ESP32
    user_router,             # Préférences utilisateur
    export_router,           # Export des données
]