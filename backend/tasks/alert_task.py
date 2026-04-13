# ============================================================================
# FICHIER: alert_task.py (dans backend/tasks/)
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient la tâche de fond qui surveille en continu les niveaux
#   d'ensablement des panneaux solaires et déclenche des alertes (email + base
#   de données) lorsque les seuils configurés sont dépassés.
#
# 🚨 FONCTIONNEMENT:
#   1. S'exécute en arrière-plan toutes les X secondes (défaut: 60s)
#   2. Récupère la dernière mesure de chaque device
#   3. Compare le niveau d'ensablement avec les seuils (warning/critical)
#   4. Si seuil dépassé et cooldown écoulé → crée une alerte + envoie email
#
# 📊 SEUILS D'ALERTE (configurables):
#   - Warning  : défaut 30% (ensablement modéré)
#   - Critical : défaut 60% (ensablement critique)
#
# ⏱️ COOLDOWNS (anti-spam):
#   - Warning  : 30 minutes minimum entre deux alertes du même type
#   - Critical : 15 minutes minimum entre deux alertes du même type
#
# 📧 EMAILS:
#   - Templates HTML responsifs
#   - Design adapté à la sévérité (rouge pour critical, orange pour warning)
#   - Envoyés uniquement si une adresse email est configurée
#
# 🔄 INTÉGRATION:
#   - Démarrage automatique dans main.py (lifespan)
#   - Utilise AlertService pour la persistance en base
#   - Utilise email_service pour l'envoi d'emails
#
# ============================================================================

"""
Tâche de surveillance des alertes
Vérifie périodiquement les seuils d'ensablement et envoie des alertes email
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from collections import defaultdict

from database import surveillance_collection
from config import Config
from config_manager import get_config
from services.email_service import send_email
from schemas import AlertType, AlertSeverity
from services.alert_service import AlertService

from services.email_service import get_email_config

logger = logging.getLogger(__name__)


# ============================================================================
# 🚨 TÂCHE DE SURVEILLANCE DES ALERTES
# ============================================================================

class AlertTask:
    """
    Gère la surveillance des alertes et l'envoi d'emails.
    
    🔄 FONCTIONNEMENT:
        - Boucle infinie asynchrone
        - Vérifie la dernière mesure à intervalle régulier
        - Gère les cooldowns pour éviter les spams
        - Persiste les alertes dans MongoDB
    
    📊 MÉTHODES PRINCIPALES:
        - start()      : Démarre la tâche de fond
        - stop()       : Arrête proprement la tâche
        - is_running() : Vérifie si la tâche est active
    """
    
    def __init__(self, check_interval_seconds: int = 60):
        """
        Initialise la tâche d'alertes.
        
        📥 ENTRÉE:
            check_interval_seconds: Intervalle entre les vérifications (secondes)
                                   Défaut: 60 secondes
        """
        self.check_interval = check_interval_seconds
        self._running = False
        self._task: asyncio.Task | None = None
        self._last_alert_time: Dict[str, datetime] = defaultdict(
            lambda: datetime.min.replace(tzinfo=timezone.utc)
        )
    
    def get_thresholds(self) -> tuple:
        """
        Récupère les seuils d'alerte depuis la configuration dynamique.
        
        📤 SORTIE:
            tuple: (seuil_warning, seuil_critical)
                   défaut: (30.0, 60.0)
        
        💡 SOURCE: config_dynamic.json
        """
        config = get_config()
        return (
            config.get("seuil_warning", Config.SEUIL_WARNING),
            config.get("seuil_critical", Config.SEUIL_CRITICAL)
        )
    
    def get_cooldown(self, is_critical: bool) -> int:
        """
        Récupère le cooldown (temps d'attente) pour un type d'alerte.
        
        📥 ENTRÉE:
            is_critical: True pour alerte critique, False pour warning
        
        📤 SORTIE:
            int: Cooldown en minutes
                 Critical: 15 min, Warning: 30 min (défaut)
        
        💡 SOURCE: config_dynamic.json
        """
        config = get_config()
        if is_critical:
            return config.get("cooldown_critical", Config.COOLDOWN_CRITICAL)
        return config.get("cooldown_warning", Config.COOLDOWN_WARNING)
    
    def is_cooldown_expired(self, device_id: str, is_critical: bool) -> bool:
        """
        Vérifie si le cooldown est écoulé pour un device et un type d'alerte.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
            is_critical: Type d'alerte
        
        📤 SORTIE:
            bool: True si on peut envoyer une nouvelle alerte, False sinon
        
        🔄 UTILISATION:
            Évite d'envoyer des alertes en rafale pour le même problème.
        """
        key = f"{device_id}_{'critical' if is_critical else 'warning'}"
        last_time = self._last_alert_time.get(key)
        
        if last_time is None:
            return True
        
        cooldown_minutes = self.get_cooldown(is_critical)
        elapsed_minutes = (datetime.now(timezone.utc) - last_time).total_seconds() / 60
        
        return elapsed_minutes >= cooldown_minutes
    
    def update_last_alert_time(self, device_id: str, is_critical: bool) -> None:
        """
        Met à jour le timestamp du dernier envoi d'alerte.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
            is_critical: Type d'alerte envoyée
        """
        key = f"{device_id}_{'critical' if is_critical else 'warning'}"
        self._last_alert_time[key] = datetime.now(timezone.utc)
    
    def get_email_html(self, soiling: float, device_id: str, power: float, is_critical: bool) -> str:
        """
        Génère le HTML de l'email d'alerte.
        
        📥 ENTRÉE:
            soiling: Niveau d'ensablement (%)
            device_id: Identifiant du device
            power: Puissance actuelle (W)
            is_critical: True pour alerte critique, False pour warning
        
        📤 SORTIE:
            str: Email HTML formaté
        
        🎨 DESIGN:
            - Critical: fond rouge, icône 🚨, message urgent
            - Warning: fond orange, icône ⚠️, message de recommandation
        """
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        loss_percent = min(soiling * 0.8, 80) if is_critical else min(soiling * 0.6, 35)
        
        if is_critical:
            return f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: sans-serif; padding: 20px;">
                <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(192,57,43,.15);">
                    <div style="background: linear-gradient(135deg, #c0392b, #922b21); padding: 28px 32px; color: #fff;">
                        <h1 style="font-size: 22px; margin: 0;">🚨 ALERTE CRITIQUE — Nettoyage Urgent</h1>
                        <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                    </div>
                    <div style="padding: 28px 32px;">
                        <div style="background: #fdecea; border: 1.5px solid #c0392b; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
                            ⛔ Le panneau <strong>{device_id}</strong> nécessite un nettoyage IMMÉDIAT.
                        </div>
                        <div style="display: flex; gap: 12px; margin: 18px 0;">
                            <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c0392b;">
                                <div style="font-size: 26px; font-weight: 800; color: #c0392b;">{soiling:.1f}%</div>
                                <div style="font-size: 11px; color: #7aaa88;">Ensablement</div>
                            </div>
                            <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c0392b;">
                                <div style="font-size: 26px; font-weight: 800; color: #c0392b;">{power:.0f} W</div>
                                <div style="font-size: 11px; color: #7aaa88;">Puissance actuelle</div>
                            </div>
                            <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c0392b;">
                                <div style="font-size: 26px; font-weight: 800; color: #c0392b;">~{loss_percent:.0f}%</div>
                                <div style="font-size: 11px; color: #7aaa88;">Perte rendement</div>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #1a7f4f, #0d5234); border-radius: 10px; padding: 16px 20px; color: #fff;">
                            <strong style="font-size: 16px; display: block; margin-bottom: 6px;">✅ Action requise immédiatement</strong>
                            Nettoyer le panneau {device_id} dès que possible.
                        </div>
                    </div>
                    <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                        PFE Surveillance PV · Alerte automatique
                    </div>
                </div>
            </body>
            </html>
            """
        else:
            return f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: sans-serif; padding: 20px;">
                <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(196,125,14,.15);">
                    <div style="background: linear-gradient(135deg, #c47d0e, #a06508); padding: 28px 32px; color: #fff;">
                        <h1 style="font-size: 22px; margin: 0;">⚠️ Alerte Warning — Ensablement détecté</h1>
                        <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                    </div>
                    <div style="padding: 28px 32px;">
                        <p style="color: #375e45;">Le panneau solaire <strong>{device_id}</strong> présente un niveau d'ensablement nécessitant votre attention.</p>
                        <div style="display: flex; gap: 12px; margin: 18px 0;">
                            <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                                <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">{soiling:.1f}%</div>
                                <div style="font-size: 11px; color: #7aaa88;">Ensablement</div>
                            </div>
                            <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                                <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">{power:.0f} W</div>
                                <div style="font-size: 11px; color: #7aaa88;">Puissance actuelle</div>
                            </div>
                            <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                                <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">Warning</div>
                                <div style="font-size: 11px; color: #7aaa88;">Niveau alerte</div>
                            </div>
                        </div>
                        <div style="background: #edf4ed; border-left: 4px solid #1a7f4f; border-radius: 0 10px 10px 0; padding: 14px 16px;">
                            💡 <strong>Recommandation :</strong> Planifier un nettoyage dans les prochains jours.
                        </div>
                    </div>
                    <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                        PFE Surveillance PV · Alerte automatique
                    </div>
                </div>
            </body>
            </html>
            """
    
    async def _check_and_alert(self) -> None:
        """
        Vérifie les dernières mesures et envoie des alertes si nécessaire.
        
        🔍 ALGORITHME:
            1. Récupère la dernière mesure (tous devices)
            2. Extrait soiling_level, status, power
            3. Compare avec seuils_warning et seuil_critical
            4. Si seuil dépassé et cooldown écoulé:
               - Crée l'alerte dans MongoDB
               - Envoie l'email
               - Met à jour le timestamp du dernier envoi
        
        📊 LOGS:
            - Debug: vérification en cours
            - Info: alerte créée ou email envoyé
            - Error: erreur lors de la vérification
        """
        try:
            # Récupérer la dernière mesure (tous devices confondus)
            doc = await surveillance_collection.find_one({}, sort=[("timestamp", -1)])
            
            if not doc:
                logger.debug("Aucune mesure en base")
                return
            
            device_id = doc.get("device_id", "inconnu")
            ai = doc.get("ai_analysis", {})
            ed = doc.get("electrical_data", {})
            
            soiling = float(ai.get("soiling_level", 0) or 0)
            status = str(ai.get("status", ""))
            power = float(ed.get("power_output", 0) or 0)
            
            seuil_warning, seuil_critical = self.get_thresholds()
            
            logger.debug(f"Vérification: device={device_id}, soiling={soiling:.1f}%, status={status}")
            
            # =================================================================
            # ALERTE CRITIQUE (ensablement >= seuil_critical)
            # =================================================================
            if soiling >= seuil_critical or status == "Critical":
                if self.is_cooldown_expired(device_id, is_critical=True):
                    # Créer l'alerte en base de données
                    alert = await AlertService.create_soiling_alert(
                        device_id=device_id,
                        soiling_level=soiling,
                        threshold=seuil_critical,
                        is_critical=True
                    )
                    if alert:
                        logger.info(f"✅ Alerte CRITICAL créée en base: {alert.id}")
                    
                    # Envoi email
                    email_config_email = get_email_config()
                    email_to = email_config_email.get("email_to")
                    
                    if email_to:
                        success = send_email(
                            subject=f"🚨 CRITIQUE — Ensablement {soiling:.0f}% sur {device_id}",
                            html_body=self.get_email_html(soiling, device_id, power, is_critical=True)
                        )
                        if success:
                            self.update_last_alert_time(device_id, is_critical=True)
                            self.update_last_alert_time(device_id, is_critical=False)
                            logger.info(f"📧 Alerte CRITICAL email envoyée pour {device_id}")
            
            # =================================================================
            # ALERTE WARNING (ensablement >= seuil_warning)
            # =================================================================
            elif soiling >= seuil_warning or status == "Warning":
                if self.is_cooldown_expired(device_id, is_critical=False):
                    # Créer l'alerte en base de données
                    alert = await AlertService.create_soiling_alert(
                        device_id=device_id,
                        soiling_level=soiling,
                        threshold=seuil_warning,
                        is_critical=False
                    )
                    if alert:
                        logger.info(f"✅ Alerte WARNING créée en base: {alert.id}")
                    
                    # Envoi email
                    email_config_email = get_email_config()
                    email_to = email_config_email.get("email_to")
                    
                    if email_to:
                        success = send_email(
                            subject=f"⚠️ Warning — Ensablement {soiling:.0f}% sur {device_id}",
                            html_body=self.get_email_html(soiling, device_id, power, is_critical=False)
                        )
                        if success:
                            self.update_last_alert_time(device_id, is_critical=False)
                            logger.info(f"📧 Alerte WARNING email envoyée pour {device_id}")
            
            else:
                logger.debug(f"Panneau propre ({soiling:.1f}%) — aucune alerte")
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de la vérification des alertes: {e}")
    
    async def _run_loop(self) -> None:
        """
        Boucle principale de vérification des alertes.
        
        🔄 FONCTIONNEMENT:
            - Tourne tant que self._running est True
            - À chaque itération: vérifie les alertes
            - Attend self.check_interval secondes
            - Continue indéfiniment
        """
        logger.info(f"🚨 Service d'alertes démarré (intervalle={self.check_interval}s)")
        
        while self._running:
            try:
                await self._check_and_alert()
            except Exception as e:
                logger.error(f"❌ Erreur dans la boucle d'alertes: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    def start(self) -> None:
        """
        Démarre la tâche d'alertes en arrière-plan.
        
        🔄 COMPORTEMENT:
            - Vérifie que la tâche n'est pas déjà en cours
            - Crée une tâche asyncio
            - Lance la boucle principale
        
        💡 NOTE: Appelé automatiquement dans main.py (lifespan)
        """
        if self._running:
            logger.warning("Le service d'alertes est déjà en cours")
            return
        
        self._running = True
        # Créer une nouvelle event loop si nécessaire
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        self._task = asyncio.create_task(self._run_loop())
        logger.info("✅ Service d'alertes démarré")
    
    async def stop(self) -> None:
        """
        Arrête proprement la tâche d'alertes.
        
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
        
        logger.info("🛑 Service d'alertes arrêté")
    
    def is_running(self) -> bool:
        """
        Vérifie si le service d'alertes est actif.
        
        📤 SORTIE:
            bool: True si actif, False sinon
        """
        return self._running


# ============================================================================
# 🌐 INSTANCE GLOBALE ET FONCTIONS D'ACCÈS
# ============================================================================

_alert_task: AlertTask | None = None


def get_alert_task() -> AlertTask:
    """
    Récupère l'instance globale unique de la tâche d'alertes (Singleton).
    
    📤 SORTIE:
        AlertTask: Instance globale
        
    💡 UTILISATION:
        task = get_alert_task()
        task.start()
    """
    global _alert_task
    if _alert_task is None:
        _alert_task = AlertTask()
    return _alert_task


async def start_alerts() -> None:
    """
    Démarre le service d'alertes (fonction de commodité).
    """
    task = get_alert_task()
    task.start()


async def stop_alerts() -> None:
    """
    Arrête le service d'alertes (fonction de commodité).
    """
    task = get_alert_task()
    await task.stop()


# ============================================================================
# 🧪 TEST DU MODULE (exécution directe)
# ============================================================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("="*50)
        print("🧪 TEST DU MODULE ALERT TASK")
        print("="*50)
        
        print("\n📋 Création de la tâche d'alertes...")
        task = AlertTask(check_interval_seconds=10)
        
        print("\n🚀 Démarrage du service d'alertes...")
        task.start()
        
        print("\n⏳ Le service tourne pendant 15 secondes...")
        await asyncio.sleep(15)
        
        print("\n🛑 Arrêt du service d'alertes...")
        await task.stop()
        
        print("\n✅ Test terminé")
    
    asyncio.run(test())