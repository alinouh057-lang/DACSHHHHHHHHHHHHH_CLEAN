# ============================================================================
# FICHIER: storage.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère le stockage des images capturées par les ESP32-CAM
#   et les analyses manuelles. Il permet de consulter l'état du stockage
#   et de déclencher manuellement le nettoyage des anciennes images.
#
# 📥 ENDPOINTS:
#   GET  /api/v1/storage/info  - Informations sur le stockage
#   POST /api/v1/cleanup       - Nettoyage manuel des anciennes images
#
# 📊 INFORMATIONS DE STOCKAGE:
#   - total_images    : Nombre total d'images stockées
#   - total_size_mb   : Espace total occupé (Mo)
#   - oldest_image    : Date de l'image la plus ancienne
#   - newest_image    : Date de l'image la plus récente
#   - retention_days  : Jours de conservation configurés
#
# 🧹 NETTOYAGE AUTOMATIQUE:
#   - Les images sont automatiquement supprimées après retention_days
#   - Retention par défaut: 7 jours (configurable dans admin)
#   - Nettoyage automatique toutes les 24h (cleanup_task)
#   - Ce endpoint permet un nettoyage manuel immédiat
#
# 📁 DOSSIER DE STOCKAGE:
#   - Chemin: "storage/" (depuis la racine du backend)
#   - Format des noms: "{device_id}_{YYYYMMDD_HHMMSS}.jpg"
#   - Exemple: "esp2_20260411_143022.jpg"
#
# 🔐 AUTHENTIFICATION:
#   - Les deux endpoints nécessitent un token JWT valide (verify_token)
#
# 💡 UTILISATION TYPIQUE:
#   - Page d'administration (afficher l'état du stockage)
#   - Bouton "Nettoyer maintenant" pour libérer de l'espace
#   - Monitoring de l'espace disque
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from pathlib import Path
from datetime import datetime
from config import Config
from auth import verify_token
from cleanup import ImageCleaner
from config_manager import get_config
import asyncio

# Création du routeur pour les endpoints de stockage
# Toutes les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["storage"])


# ============================================================================
# 📊 INFORMATIONS SUR LE STOCKAGE
# ============================================================================

@router.get("/storage/info")
async def get_storage_info(token_payload: dict = Depends(verify_token)):
    """
    Récupère les statistiques du stockage des images.
    
    📤 SORTIE:
        {
            "total_images": 245,           # Nombre total d'images
            "total_size_mb": 156.78,       # Espace occupé (Mo)
            "oldest_image": "2026-04-01T08:30:00",  # Plus ancienne
            "newest_image": "2026-04-11T15:22:00",  # Plus récente
            "retention_days": 7             # Jours de conservation
        }
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    📁 DOSSIER:
        - Les images sont stockées dans le dossier "storage/"
        - Seules les extensions .jpg sont comptées
    
    💡 INTERPRÉTATION:
        - total_size_mb > 1000 → Penser à nettoyer
        - oldest_image très ancienne → Retention peut être trop élevée
        - retention_days configurable dans l'interface admin
    
    ⚠️ NOTE: Si le dossier n'existe pas, retourne des valeurs par défaut (0)
    """
    # Chemin du dossier de stockage (depuis Config)
    storage_dir = Path(Config.UPLOAD_DIR)
    
    # ========================================================================
    # CAS 1: DOSSIER INEXISTANT
    # ========================================================================
    if not storage_dir.exists():
        return {
            "total_images": 0,
            "total_size_mb": 0,
            "oldest_image": None,
            "newest_image": None,
            "retention_days": Config.IMAGE_RETENTION_DAYS
        }
    
    # ========================================================================
    # CAS 2: DOSSIER EXISTANT - ANALYSE DES FICHIERS
    # ========================================================================
    # Lister tous les fichiers JPG dans le dossier
    images = list(storage_dir.glob("*.jpg"))
    
    # Calculer l'espace total occupé
    total_size = sum(f.stat().st_size for f in images)
    total_size_mb = total_size / (1024 * 1024)
    
    # Trouver les dates extrêmes (min et max)
    oldest = min(images, key=lambda f: f.stat().st_mtime) if images else None
    newest = max(images, key=lambda f: f.stat().st_mtime) if images else None
    
    # ========================================================================
    # CONSTRUCTION DE LA RÉPONSE
    # ========================================================================
    return {
        "total_images": len(images),
        "total_size_mb": round(total_size_mb, 2),
        "oldest_image": datetime.fromtimestamp(oldest.stat().st_mtime).isoformat() if oldest else None,
        "newest_image": datetime.fromtimestamp(newest.stat().st_mtime).isoformat() if newest else None,
        # Récupérer la rétention depuis la config dynamique (ou défaut)
        "retention_days": get_config().get("retention_days", Config.IMAGE_RETENTION_DAYS)
    }


# ============================================================================
# 🧹 NETTOYAGE MANUEL DES IMAGES
# ============================================================================

@router.post("/cleanup")
async def trigger_cleanup(token_payload: dict = Depends(verify_token)):
    """
    Déclenche manuellement le nettoyage des images anciennes.
    
    📤 SORTIE:
        {"status": "ok", "message": "Nettoyage effectué"}
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🧹 FONCTIONNEMENT:
        - Supprime les images plus anciennes que retention_days
        - Retention configurable dans l'interface admin
        - Utilise la même logique que la tâche automatique
    
    💡 QUAND UTILISER:
        - Avant une sauvegarde (réduire la taille)
        - Pour libérer de l'espace disque immédiatement
        - Après avoir réduit la rétention (nettoyage forcé)
        - En cas de saturation du disque
    
    ⚠️ ATTENTION:
        - Cette action est IRRÉVERSIBLE
        - Les images supprimées ne peuvent pas être récupérées
        - Les références dans MongoDB restent (mais l'image n'existe plus)
    
    🔄 COMPARAISON AVEC NETTOYAGE AUTO:
        - Auto: toutes les 24h (ou intervalle configuré)
        - Manuel: immédiat, à la demande
    
    🚨 ERREURS:
        - 500: Erreur lors du nettoyage (problème de permissions, etc.)
    """
    try:
        # Créer une instance du nettoyeur d'images
        cleaner = ImageCleaner()
        
        # Exécuter le nettoyage dans un thread séparé (non bloquant)
        # car l'opération peut prendre du temps (parcours de fichiers)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, cleaner.clean_old_images)
        
        return {"status": "ok", "message": "Nettoyage effectué"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))