# ============================================================================
# FICHIER: cleanup_task.py (dans backend/tasks/)
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient la tâche de fond qui nettoie automatiquement les
#   anciennes images stockées par le système PV Monitor. Elle supprime
#   périodiquement les images plus anciennes que la durée de rétention
#   configurée pour éviter la saturation de l'espace disque.
#
# 🧹 FONCTIONNEMENT:
#   1. S'exécute en arrière-plan à intervalle régulier (défaut: 24h)
#   2. Parcourt le dossier de stockage (Config.UPLOAD_DIR)
#   3. Supprime les fichiers .jpg plus anciens que retention_days
#   4. Log le résultat (nombre de fichiers, espace libéré)
#
# ⏱️ PARAMÈTRES CONFIGURABLES:
#   - retention_days    : Âge maximum des images (défaut: 7 jours)
#   - cleanup_interval  : Fréquence du nettoyage (heures, défaut: 24h)
#
# 🔄 INTÉGRATION:
#   - Démarrage automatique dans main.py (lifespan)
#   - Peut être déclenché manuellement via trigger_manual_cleanup()
#   - Statistiques disponibles via get_storage_stats()
#
# 📊 UTILITÉS:
#   - get_storage_stats() : Retourne les stats du stockage (nombre d'images,
#                           taille totale, dates extrêmes)
#   - trigger_manual_cleanup() : Nettoyage immédiat (API /cleanup)
#
# ============================================================================

"""
Tâche de nettoyage automatique des images
Supprime périodiquement les images plus anciennes que la durée de rétention configurée
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone

from config import Config
from config_manager import get_config
from cleanup import ImageCleaner

logger = logging.getLogger(__name__)


# ============================================================================
# 🧹 TÂCHE DE NETTOYAGE AUTOMATIQUE
# ============================================================================

class CleanupTask:
    """
    Gère le nettoyage automatique des images anciennes.
    
    🔄 FONCTIONNEMENT:
        - Boucle infinie asynchrone
        - Nettoie à intervalle régulier
        - Supprime les fichiers .jpg plus anciens que retention_days
        - Peut être déclenché manuellement
    
    📊 MÉTHODES PRINCIPALES:
        - start()                  : Démarre la tâche de fond
        - stop()                   : Arrête proprement la tâche
        - is_running()             : Vérifie si la tâche est active
        - trigger_manual_cleanup() : Nettoie immédiatement
        - clean_old_images()       : Nettoie une fois (asynchrone)
    """
    
    def __init__(self):
        self._running = False
        self._task: asyncio.Task | None = None
        self._cleaner = ImageCleaner()
    
    def get_retention_days(self) -> int:
        """
        Récupère la durée de rétention depuis la configuration dynamique.
        
        📤 SORTIE:
            int: Nombre de jours de rétention (défaut: Config.IMAGE_RETENTION_DAYS)
        
        💡 SOURCE: config_dynamic.json → "retention_days"
        """
        return get_config().get("retention_days", Config.IMAGE_RETENTION_DAYS)
    
    def get_cleanup_interval(self) -> int:
        """
        Récupère l'intervalle de nettoyage depuis la configuration dynamique.
        
        📤 SORTIE:
            int: Intervalle en heures (défaut: Config.CLEANUP_INTERVAL_HOURS)
        
        💡 SOURCE: config_dynamic.json → "cleanup_interval"
        """
        return get_config().get("cleanup_interval", Config.CLEANUP_INTERVAL_HOURS)
    
    def clean_old_images_sync(self) -> int:
        """
        Nettoie les images (version synchrone).
        
        📤 SORTIE:
            int: Nombre d'images supprimées
        
        🔄 ALGORITHME:
            1. Vérifie que le dossier existe
            2. Calcule la date limite (now - retention_days)
            3. Parcourt tous les fichiers .jpg
            4. Supprime ceux plus anciens que la limite
            5. Log le résultat
        
        💡 NOTE: Version synchrone pour exécution dans un thread séparé.
        """
        try:
            storage_dir = Path(Config.UPLOAD_DIR)
            
            if not storage_dir.exists():
                logger.warning(f"⚠️ Dossier {storage_dir} inexistant")
                return 0
            
            retention_days = self.get_retention_days()
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
            deleted_count = 0
            total_size = 0
            
            for file_path in storage_dir.glob("*.jpg"):
                try:
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
                    
                    if mtime < cutoff_date:
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        file_path.unlink()  # Suppression du fichier
                        deleted_count += 1
                        logger.debug(f"🗑️ Supprimé: {file_path.name} ({file_size / 1024:.1f} Ko)")
                        
                except Exception as e:
                    logger.error(f"❌ Erreur sur {file_path}: {e}")
            
            if deleted_count > 0:
                logger.info(f"✅ Nettoyage terminé: {deleted_count} fichiers supprimés, {total_size / (1024*1024):.2f} Mo libérés")
            else:
                logger.info("✅ Aucun fichier à supprimer")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ Erreur lors du nettoyage: {e}")
            return 0
    
    async def clean_old_images(self) -> int:
        """
        Nettoie les images (version asynchrone).
        
        📤 SORTIE:
            int: Nombre d'images supprimées
        
        💡 NOTE: Exécute clean_old_images_sync dans un thread séparé
                 pour ne pas bloquer la boucle asyncio.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.clean_old_images_sync)
    
    async def _run_loop(self) -> None:
        """
        Boucle principale de nettoyage.
        
        🔄 FONCTIONNEMENT:
            - Tourne tant que self._running est True
            - À chaque itération: nettoie les images
            - Attend l'intervalle configuré
            - Continue indéfiniment
        """
        interval_hours = self.get_cleanup_interval()
        logger.info(f"🧹 Nettoyage automatique activé (intervalle={interval_hours}h, rétention={self.get_retention_days()}j)")
        
        while self._running:
            try:
                await self.clean_old_images()
            except Exception as e:
                logger.error(f"❌ Erreur lors du nettoyage: {e}")
            
            # Attendre l'intervalle configuré (en secondes)
            interval_seconds = interval_hours * 3600
            await asyncio.sleep(interval_seconds)
    
    def start(self) -> None:
        """
        Démarre la tâche de nettoyage en arrière-plan.
        
        🔄 COMPORTEMENT:
            - Vérifie que la tâche n'est pas déjà en cours
            - Crée une tâche asyncio
            - Lance la boucle principale
        
        💡 NOTE: Appelé automatiquement dans main.py (lifespan)
        """
        if self._running:
            logger.warning("Le nettoyage est déjà en cours")
            return
        
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("✅ Tâche de nettoyage automatique démarrée")
    
    async def stop(self) -> None:
        """
        Arrête proprement la tâche de nettoyage.
        
        🔄 COMPORTEMENT:
            - Passe self._running à False (arrête la boucle)
            - Annule la tâche asyncio
            - Attend la fin de la tâche
        
        💡 NOTE: Appelé automatiquement dans main.py (lifespan)
        """
        if not self._running:
            return
        
        self._running = False
        
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        
        logger.info("🛑 Tâche de nettoyage automatique arrêtée")
    
    def is_running(self) -> bool:
        """
        Vérifie si le nettoyage est actif.
        
        📤 SORTIE:
            bool: True si actif, False sinon
        """
        return self._running
    
    async def trigger_manual_cleanup(self) -> int:
        """
        Déclenche un nettoyage manuel immédiat.
        
        📤 SORTIE:
            int: Nombre d'images supprimées
        
        💡 UTILISATION:
            - Appelé par l'API /cleanup
            - Utile pour libérer de l'espace immédiatement
        """
        logger.info("🧹 Nettoyage manuel déclenché")
        return await self.clean_old_images()


# ============================================================================
# 🌐 INSTANCE GLOBALE ET FONCTIONS D'ACCÈS
# ============================================================================

_cleanup_task: CleanupTask | None = None


def get_cleanup_task() -> CleanupTask:
    """
    Récupère l'instance globale unique de la tâche de nettoyage (Singleton).
    
    📤 SORTIE:
        CleanupTask: Instance globale
    
    💡 UTILISATION:
        task = get_cleanup_task()
        task.start()
    """
    global _cleanup_task
    if _cleanup_task is None:
        _cleanup_task = CleanupTask()
    return _cleanup_task


async def start_cleanup() -> None:
    """
    Démarre le nettoyage automatique (fonction de commodité).
    """
    task = get_cleanup_task()
    task.start()


async def stop_cleanup() -> None:
    """
    Arrête le nettoyage automatique (fonction de commodité).
    """
    task = get_cleanup_task()
    await task.stop()


async def trigger_cleanup() -> int:
    """
    Déclenche un nettoyage manuel (fonction de commodité).
    
    📤 SORTIE:
        int: Nombre d'images supprimées
    """
    task = get_cleanup_task()
    return await task.trigger_manual_cleanup()


def get_storage_stats() -> dict:
    """
    Récupère les statistiques de stockage.
    
    📤 SORTIE:
        dict: {
            "total_images": int,      # Nombre total d'images
            "total_size_mb": float,   # Taille totale en Mo
            "oldest_image": str,      # Date de l'image la plus ancienne (ISO)
            "newest_image": str       # Date de l'image la plus récente (ISO)
        }
    
    💡 UTILISATION:
        stats = get_storage_stats()
        print(f"{stats['total_images']} images, {stats['total_size_mb']} Mo")
    """
    storage_dir = Path(Config.UPLOAD_DIR)
    
    if not storage_dir.exists():
        return {
            "total_images": 0,
            "total_size_mb": 0,
            "oldest_image": None,
            "newest_image": None
        }
    
    images = list(storage_dir.glob("*.jpg"))
    total_size = sum(f.stat().st_size for f in images)
    total_size_mb = total_size / (1024 * 1024)
    
    oldest = min(images, key=lambda f: f.stat().st_mtime) if images else None
    newest = max(images, key=lambda f: f.stat().st_mtime) if images else None
    
    return {
        "total_images": len(images),
        "total_size_mb": round(total_size_mb, 2),
        "oldest_image": datetime.fromtimestamp(oldest.stat().st_mtime).isoformat() if oldest else None,
        "newest_image": datetime.fromtimestamp(newest.stat().st_mtime).isoformat() if newest else None
    }


# ============================================================================
# 🧪 TEST DU MODULE (exécution directe)
# ============================================================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("="*50)
        print("🧪 TEST DU MODULE CLEANUP TASK")
        print("="*50)
        
        # Créer un dossier de test
        test_dir = Path("test_storage")
        test_dir.mkdir(exist_ok=True)
        
        # Sauvegarder l'UPLOAD_DIR original
        original_upload_dir = Config.UPLOAD_DIR
        Config.UPLOAD_DIR = str(test_dir)
        
        try:
            # Créer des fichiers de test
            print("\n📁 Création de fichiers de test...")
            for i in range(3):
                test_file = test_dir / f"test_image_{i}.jpg"
                test_file.write_text(f"Test content {i}")
                print(f"   Créé: {test_file.name}")
            
            # Afficher les statistiques
            print("\n📊 Statistiques avant nettoyage:")
            stats = get_storage_stats()
            print(f"   Images: {stats['total_images']}")
            print(f"   Taille: {stats['total_size_mb']} Mo")
            
            # Créer la tâche
            task = CleanupTask()
            
            # Modifier temporairement la rétention pour le test
            original_retention = Config.IMAGE_RETENTION_DAYS
            Config.IMAGE_RETENTION_DAYS = 0  # Supprimer immédiatement
            
            # Nettoyage manuel
            print("\n🧹 Nettoyage manuel...")
            deleted = await task.trigger_manual_cleanup()
            print(f"   {deleted} fichiers supprimés")
            
            # Restaurer les valeurs
            Config.IMAGE_RETENTION_DAYS = original_retention
            
            # Afficher les statistiques après nettoyage
            print("\n📊 Statistiques après nettoyage:")
            stats = get_storage_stats()
            print(f"   Images: {stats['total_images']}")
            print(f"   Taille: {stats['total_size_mb']} Mo")
            
        finally:
            # Nettoyer les fichiers de test
            for f in test_dir.glob("*.jpg"):
                f.unlink()
            test_dir.rmdir()
            
            # Restaurer l'UPLOAD_DIR
            Config.UPLOAD_DIR = original_upload_dir
        
        print("\n✅ Test terminé")
    
    asyncio.run(test())