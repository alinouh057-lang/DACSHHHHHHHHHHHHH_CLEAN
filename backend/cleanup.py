# ============================================================================
# FICHIER: cleanup.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier gère le nettoyage automatique des anciennes images stockées
#   par le système PV Monitor. Il évite la saturation de l'espace disque
#   en supprimant les images plus anciennes qu'une durée configurable.
#
# 🧹 FONCTIONNALITÉS:
#   - Suppression automatique des images plus anciennes que retention_days
#   - Configuration dynamique des durées de rétention
#   - Nettoyage périodique en arrière-plan (tâche asyncio)
#   - Statistiques de nettoyage (nombre de fichiers, espace libéré)
#   - Exécution manuelle possible en ligne de commande
#
# ⏱️ PARAMÈTRES CONFIGURABLES (dans config_dynamic.json):
#   - retention_days : Âge maximum des images (défaut: 7 jours)
#   - cleanup_interval : Fréquence des nettoyages (heures, défaut: 24h)
#
# 🔄 MODES DE FONCTIONNEMENT:
#   - Mode automatique : Boucle infinie dans une tâche asyncio (run_periodic_cleanup)
#   - Mode manuel : Exécution unique via python cleanup.py
#
# 📁 DOSSIER CIBLÉ:
#   - Config.UPLOAD_DIR (défaut: "storage/")
#   - Ne supprime que les fichiers .jpg
#
# 📊 LOGS PRODUITS:
#   - Avertissement si dossier inexistant
#   - Information pour chaque fichier supprimé (nom, taille)
#   - Résumé final (nombre de fichiers, espace libéré)
#
# 🔗 INTÉGRATION DANS LE PROJET:
#   - Appelé par main.py au démarrage (lifespan)
#   - Configurable via l'interface d'administration
#   - Peut être déclenché manuellement via API /cleanup
#
# ============================================================================

"""
NETTOYEUR AUTOMATIQUE D'IMAGES - PV MONITOR
============================================
Ce module gère le nettoyage automatique des anciennes images
pour éviter la saturation de l'espace disque.

FONCTIONNALITÉS :
- Suppression automatique des images plus anciennes que retention_days
- Configuration dynamique des durées de rétention
- Nettoyage périodique en arrière-plan
- Statistiques de nettoyage (nombre de fichiers, espace libéré)

PARAMÈTRES CONFIGURABLES :
- retention_days : Âge maximum des images (depuis config dynamique)
- cleanup_interval : Fréquence des nettoyages (heures)

MODES DE FONCTIONNEMENT :
- Mode automatique : Boucle infinie dans une tâche asyncio
- Mode manuel : Exécution unique via ligne de commande

LOGS :
- Nombre de fichiers supprimés
- Espace disque libéré
- Fichiers individuels supprimés (debug)
"""

import asyncio
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
import os

from config import Config
from config_manager import get_config

logger = logging.getLogger(__name__)


# ============================================================================
# 🧹 CLASSE DE NETTOYAGE D'IMAGES
# ============================================================================

class ImageCleaner:
    """
    Classe responsable du nettoyage automatique des images anciennes.
    Peut être utilisée en mode continu (tâche de fond) ou en mode manuel.
    
    📋 MÉTHODES PRINCIPALES:
        - get_retention_days()     : Récupère la durée de rétention configurée
        - get_cleanup_interval()   : Récupère l'intervalle de nettoyage
        - clean_old_images()       : Nettoie les images une fois
        - run_periodic_cleanup()   : Boucle infinie de nettoyage périodique
    """
    
    def __init__(self):
        """Initialise le nettoyeur avec le dossier de stockage depuis Config"""
        self.storage_dir = Path(Config.UPLOAD_DIR)
    
    # ============================================================================
    # 📦 RÉCUPÉRATION DE LA CONFIGURATION DYNAMIQUE
    # ============================================================================
    
    def get_retention_days(self):
        """
        Récupère la valeur actuelle de rétention depuis la configuration dynamique.
        
        📤 SORTIE:
            int: Nombre de jours de conservation
                 (défaut: Config.IMAGE_RETENTION_DAYS = 7)
        
        💡 SOURCE: config_dynamic.json → "retention_days"
        """
        return get_config().get("retention_days", Config.IMAGE_RETENTION_DAYS)
    
    def get_cleanup_interval(self):
        """
        Récupère l'intervalle de nettoyage actuel depuis la configuration dynamique.
        
        📤 SORTIE:
            int: Intervalle en heures
                 (défaut: Config.CLEANUP_INTERVAL_HOURS = 24)
        
        💡 SOURCE: config_dynamic.json → "cleanup_interval"
        """
        return get_config().get("cleanup_interval", Config.CLEANUP_INTERVAL_HOURS)
    
    # ============================================================================
    # 🧹 NETTOYAGE UNIQUE
    # ============================================================================
    
    def clean_old_images(self):
        """
        Supprime les images plus anciennes que retention_days.
        
        📥 ENTRÉE: Aucune (utilise la config et le dossier de stockage)
        
        📤 SORTIE: Aucune (effet de bord: suppression de fichiers)
        
        🔍 ALGORITHME:
            1. Vérifie que le dossier de stockage existe
            2. Calcule la date limite (now - retention_days)
            3. Parcourt tous les fichiers .jpg
            4. Pour chaque fichier, compare sa date de modification
            5. Si plus ancien que la limite → suppression
            6. Log le résultat (nombre de fichiers, espace libéré)
        
        📊 EXEMPLE DE LOG:
            🗑️ Supprimé: esp2_20260401_143022.jpg (245.3 Ko)
            ✅ Nettoyage terminé: 42 fichiers supprimés, 12.45 Mo libérés
        """
        # Vérifier que le dossier de stockage existe
        if not self.storage_dir.exists():
            logger.warning(f"⚠️ Dossier {self.storage_dir} inexistant")
            return
        
        # Récupérer la durée de rétention et calculer la date limite
        retention_days = self.get_retention_days()
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        deleted_count = 0
        total_size = 0
        
        # Parcourir tous les fichiers JPG du dossier
        for file_path in self.storage_dir.glob("*.jpg"):
            try:
                # Lire la date de modification du fichier
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
                
                # Si le fichier est plus ancien que la limite → supprimer
                if mtime < cutoff_date:
                    file_size = file_path.stat().st_size
                    total_size += file_size
                    file_path.unlink()  # Suppression du fichier
                    deleted_count += 1
                    logger.info(f"🗑️ Supprimé: {file_path.name} ({file_size / 1024:.1f} Ko)")
                    
            except Exception as e:
                logger.error(f"❌ Erreur sur {file_path}: {e}")
        
        # Log du résultat
        if deleted_count > 0:
            logger.info(f"✅ Nettoyage terminé: {deleted_count} fichiers supprimés, {total_size / (1024*1024):.2f} Mo libérés")
        else:
            logger.info("✅ Aucun fichier à supprimer")
    
    # ============================================================================
    # 🔄 BOUCLE DE NETTOYAGE AUTOMATIQUE
    # ============================================================================
    
    async def run_periodic_cleanup(self):
        """
        Boucle infinie qui lance le nettoyage périodiquement.
        
        🔄 FONCTIONNEMENT:
            S'exécute en tâche de fond asyncio. À chaque itération :
            1. Lance un nettoyage (clean_old_images)
            2. Récupère l'intervalle actuel depuis la config dynamique
            3. Attend l'intervalle spécifié (en heures)
            
        ⚠️ NOTE: Cette méthode ne se termine jamais (while True).
                 Doit être exécutée comme tâche asyncio.create_task().
        
        📊 EXEMPLE D'EXÉCUTION:
            🔄 Nettoyage automatique activé (intervalle=24h)
            🗑️ Supprimé: esp2_20260401.jpg (245.3 Ko)
            ✅ Nettoyage terminé: 42 fichiers supprimés, 12.45 Mo libérés
            (attend 24 heures)
            🗑️ Supprimé: esp2_20260402.jpg (230.1 Ko)
            ...
        """
        logger.info(f"🔄 Nettoyage automatique activé")
        
        while True:
            try:
                # Exécuter le nettoyage
                self.clean_old_images()
            except Exception as e:
                logger.error(f"❌ Erreur lors du nettoyage: {e}")
            
            # Récupérer l'intervalle dynamiquement à chaque itération
            # (permet de modifier l'intervalle sans redémarrer)
            interval_hours = self.get_cleanup_interval()
            await asyncio.sleep(interval_hours * 3600)  # Conversion heures → secondes


# ============================================================================
# 🚀 POINT D'ENTRÉE POUR EXÉCUTION MANUELLE
# ============================================================================

if __name__ == "__main__":
    """
    Exécution manuelle du nettoyage (sans boucle automatique)
    
    UTILISATION:
        python cleanup.py
    
    💡 QUAND UTILISER:
        - Tester le nettoyage avant de l'activer en automatique
        - Libérer de l'espace immédiatement sans attendre le cycle
        - Debug ou maintenance manuelle
    
    ⚠️ NOTE: Cette exécution est unique, ne tourne pas en boucle.
    """
    cleaner = ImageCleaner()
    cleaner.clean_old_images()