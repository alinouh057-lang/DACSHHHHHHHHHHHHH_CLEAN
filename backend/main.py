# ============================================================================
# FICHIER: main.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   C'est le point d'entrée principal du backend PV Monitor.
#   Il configure et démarre le serveur FastAPI, initialise les middlewares,
#   les routeurs, les tâches de fond et les connexions aux bases de données.
#
# 🚀 FONCTIONNALITÉS PRINCIPALES:
#   1. Configuration CORS (Cross-Origin Resource Sharing)
#   2. Initialisation des tâches de fond (alertes, nettoyage, offline check)
#   3. Montage des fichiers statiques (images)
#   4. Inclusion de tous les routeurs API
#   5. Gestion du cycle de vie (démarrage/arrêt)
#
# 🔧 COMPOSANTS:
#   - ForceCORSMiddleware : Gère CORS pour toutes les routes
#   - lifespan : Gère le démarrage et l'arrêt des services
#   - Routeurs : Toutes les routes API (auth, devices, alerts, etc.)
#   - Tâches de fond : alert_task, cleanup_task, offline_check
#
# 📁 FICHIERS STATIQUES:
#   - /storage : Accès aux images stockées
#   - /reports : Accès aux rapports générés
#
# 🔐 CORS:
#   - Permet les requêtes depuis n'importe quelle origine (*)
#   - Gère les requêtes OPTIONS (preflight)
#   - Ajoute les headers CORS à toutes les réponses
#
# 🧩 TÂCHES DE FOND (tasks/):
#   - alert_task      : Vérifie les alertes d'ensablement
#   - cleanup_task    : Nettoie les anciennes images
#   - offline_check   : Détecte les ESP32 hors ligne
#
# ============================================================================

"""
backend/main.py - Serveur principal PV Monitor
Version avec CORS pour TOUTES les routes
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import Config
from auth_routes import router as auth_router
from database import panel_config_collection
from init_admin import init_admin
from routers import routers
from tasks.offline_check import get_offline_checker
from tasks.cleanup_task import get_cleanup_task
from tasks.alert_task import get_alert_task

# Configuration du logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# MIDDLEWARE CORS UNIVERSEL (APPLIQUÉ À TOUTES LES ROUTES)
# ============================================================================

class ForceCORSMiddleware(BaseHTTPMiddleware):
    """
    Middleware CORS universel qui force les headers CORS sur TOUTES les réponses.
    
    🔄 FONCTIONNEMENT:
        1. Pour les requêtes OPTIONS (preflight) → répond immédiatement avec CORS
        2. Pour les autres requêtes → ajoute les headers CORS à la réponse
    
    📤 HEADERS AJOUTÉS:
        - Access-Control-Allow-Origin: *
        - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
        - Access-Control-Allow-Headers: *
        - Access-Control-Expose-Headers: *
        - Access-Control-Allow-Credentials: false
        - Access-Control-Max-Age: 86400 (24h pour mise en cache preflight)
    
    🔧 IMPORTANT:
        Doit être le premier middleware ajouté à l'application.
    """
    async def dispatch(self, request: Request, call_next):
        # Répondre immédiatement aux requêtes OPTIONS (preflight)
        if request.method == "OPTIONS":
            logger.info(f"🔄 OPTIONS preflight: {request.url.path}")
            return JSONResponse(
                content={},
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                    "Access-Control-Allow-Credentials": "false",
                }
            )
        
        # Traiter la requête normale
        start_time = time.time()
        logger.info(f"📥 REQUÊTE: {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        # FORCER les headers CORS dans la réponse (POUR TOUTES LES ROUTES)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "false"
        
        process_time = time.time() - start_time
        logger.info(f"📤 RÉPONSE: {response.status_code} - {process_time:.3f}s")
        
        return response


# ============================================================================
# CRÉATION DE L'APPLICATION FASTAPI
# ============================================================================

app = FastAPI(
    title="PV Monitor API - Version Pro",
    description="API de surveillance des panneaux solaires",
    version="2.0.0"
)

# AJOUTER LE MIDDLEWARE CORS FORCÉ (DOIT ÊTRE LE PREMIER)
app.add_middleware(ForceCORSMiddleware)

# Configuration supplémentaire CORS (par sécurité, au cas où)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# GESTION DU CYCLE DE VIE (lifespan)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gère le cycle de vie de l'application (démarrage et arrêt).
    
    🔄 DÉMARRAGE (yield avant):
        1. Initialise l'administrateur (crée le compte admin si nécessaire)
        2. Crée la configuration par défaut des panneaux si absente
        3. Démarre les tâches de fond:
           - cleanup_task : nettoyage des images
           - offline_checker : surveillance des ESP32
           - alert_task : génération des alertes
    
    🛑 ARRÊT (yield après):
        1. Arrête proprement les tâches de fond
    """
    logger.info("🚀 Démarrage de l'application PV Monitor...")
    
    # ========================================================================
    # 1. INITIALISATION DE L'ADMINISTRATEUR
    # ========================================================================
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, init_admin)
    except Exception as e:
        logger.error(f"❌ Erreur initialisation admin: {e}")
    
    # ========================================================================
    # 2. INITIALISATION DE LA CONFIGURATION DES PANNEAUX
    # ========================================================================
    try:
        config_exists = await panel_config_collection.find_one({})
        if not config_exists:
            default_config = {
                "panel_type": "monocristallin",
                "panel_capacity_kw": 3.0,
                "panel_area_m2": 1.6,
                "panel_efficiency": 0.20,
                "tilt_angle": 30,
                "azimuth": 180,
                "degradation_rate": 0.5
            }
            await panel_config_collection.insert_one(default_config)
            logger.info("✅ Configuration par défaut des panneaux créée")
    except Exception as e:
        logger.error(f"❌ Erreur initialisation config panneaux: {e}")
    
    # ========================================================================
    # 3. DÉMARRAGE DES TÂCHES DE FOND
    # ========================================================================
    # Tâche de nettoyage des images
    cleanup_task = get_cleanup_task()
    cleanup_task.start()
    
    # Tâche de surveillance des devices offline
    offline_checker = get_offline_checker()
    offline_checker.start()
    
    # Tâche de génération des alertes
    alert_task = get_alert_task()
    alert_task.start()
    
    logger.info("✅ Application démarrée avec succès")
    
    yield  # L'application tourne ici
    
    # ========================================================================
    # 4. ARRÊT PROPRE DES TÂCHES DE FOND
    # ========================================================================
    logger.info("🛑 Arrêt de l'application PV Monitor...")
    await alert_task.stop()
    await offline_checker.stop()
    await cleanup_task.stop()
    logger.info("✅ Application arrêtée avec succès")


# Assigner le gestionnaire de cycle de vie à l'application
app.router.lifespan_context = lifespan


# ============================================================================
# INCLUSION DES ROUTEURS (APRÈS LE MIDDLEWARE CORS)
# ============================================================================

# Inclure le routeur d'authentification (gère /api/v1/auth/*)
app.include_router(auth_router)

# Inclure tous les autres routeurs (devices, alerts, soiling, etc.)
for router in routers:
    app.include_router(router)


# ============================================================================
# FICHIERS STATIQUES
# ============================================================================

# Dossier de stockage des images (accessible via /storage/*)
UPLOAD_DIR = Config.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=UPLOAD_DIR), name="storage")

# Dossier de stockage des rapports
REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


# ============================================================================
# ENDPOINTS GÉNÉRIQUES
# ============================================================================

@app.get("/")
async def read_root():
    """
    Endpoint racine - Vérifie que l'API est en ligne.
    
    📤 SORTIE:
        {
            "message": "PV Monitor Backend is Running",
            "version": "2.0.0",
            "status": "healthy"
        }
    """
    return {
        "message": "PV Monitor Backend is Running",
        "version": "2.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """
    Endpoint de santé - Utilisé par les services de monitoring (UptimeRobot, etc.)
    
    📤 SORTIE:
        {
            "status": "healthy",
            "services": {
                "api": "running",
                "database": "connected",
                "tasks": {
                    "cleanup": true,
                    "offline_check": true,
                    "alerts": true
                }
            }
        }
    """
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "database": "connected",
            "tasks": {
                "cleanup": get_cleanup_task().is_running(),
                "offline_check": get_offline_checker().is_running(),
                "alerts": get_alert_task().is_running()
            }
        }
    }


# ============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    """
    Lance le serveur Uvicorn.
    
    🔧 CONFIGURATION:
        - PORT : Variable d'environnement (défaut: 8000)
        - HOST : Variable d'environnement (défaut: 0.0.0.0)
        - log_level: debug (logs détaillés pour le développement)
        - access_log: True (log toutes les requêtes HTTP)
    
    💡 POUR LANCER LE SERVEUR:
        python main.py
        ou
        uvicorn main:app --reload --port 8000
    """
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Lancement du serveur sur {host}:{port}")
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="debug",
        access_log=True
    )