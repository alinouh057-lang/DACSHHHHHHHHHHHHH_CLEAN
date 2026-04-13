# ============================================================================
# FICHIER: offline_check.py (dans backend/tasks/)
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient la tâche de fond qui surveille les devices ESP32
#   et détecte ceux qui sont hors ligne. Elle vérifie périodiquement les
#   heartbeats et crée des alertes lorsqu'un device ne répond plus.
#
# 🫀 FONCTIONNEMENT:
#   1. S'exécute en arrière-plan toutes les X secondes (défaut: 60s)
#   2. Parcourt tous les devices actifs
#   3. Vérifie la date du dernier heartbeat reçu
#   4. Si heartbeat > seuil (défaut: 65s) → alerte offline
#   5. Si device revient en ligne → résout l'alerte et envoie notification
#
# 📊 SEUILS:
#   - offline_threshold : 65 secondes sans heartbeat = offline
#   - check_interval    : 60 secondes entre les vérifications
#
# 📧 EMAILS:
#   - Alerte offline : notification quand un device est hors ligne
#   - Back online    : notification quand le device revient en ligne
#
# 🔄 INTÉGRATION:
#   - heartbeat.py appelle update_heartbeat() à chaque réception
#   - Démarrage automatique dans main.py (lifespan)
#   - Statuts disponibles via get_heartbeat_status()
#
# ============================================================================

"""
Tâche de surveillance des devices hors ligne
Vérifie périodiquement les heartbeats et crée des alertes si nécessaire
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from database import devices_collection, alerts_collection
from schemas import Alert, AlertType, AlertSeverity
from services.email_service import send_email, get_email_config

logger = logging.getLogger(__name__)


# ============================================================================
# 📡 SURVEILLANCE DES DEVICES OFFLINE
# ============================================================================

class OfflineDeviceChecker:
    """
    Surveille les devices et détecte ceux qui sont hors ligne.
    
    🔄 FONCTIONNEMENT:
        - Boucle infinie asynchrone
        - Vérifie les heartbeats à intervalle régulier
        - Crée une alerte quand un device est hors ligne
        - Résout l'alerte quand le device revient en ligne
        - Envoie des emails pour les deux événements
    
    📊 MÉTHODES PRINCIPALES:
        - start()                 : Démarre la tâche de fond
        - stop()                  : Arrête proprement la tâche
        - update_heartbeat()      : Met à jour le dernier heartbeat d'un device
        - get_heartbeat_status()  : Statut d'un device (online/offline)
        - get_all_heartbeats()    : Statuts de tous les devices
    """
    
    def __init__(self, check_interval_seconds: int = 60, offline_threshold_seconds: int = 65):
        """
        Initialise le vérificateur.
        
        📥 ENTRÉE:
            check_interval_seconds: Intervalle entre les vérifications (secondes)
                                   Défaut: 60 secondes
            offline_threshold_seconds: Délai sans heartbeat pour considérer offline
                                      Défaut: 65 secondes
        """
        self.check_interval = check_interval_seconds
        self.offline_threshold = offline_threshold_seconds
        self._alert_counter = 0
        self._running = False
        self._task: asyncio.Task | None = None
        self._heartbeats: Dict[str, datetime] = {}  # device_id -> dernier heartbeat
    
    def _get_next_alert_id(self) -> str:
        """Génère un ID unique pour une alerte"""
        self._alert_counter += 1
        return f"alert_{self._alert_counter}"
    
    def _get_offline_email_html(self, device_id: str, seconds_offline: float) -> str:
        """
        Génère le HTML de l'email pour alerte hors ligne.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
            seconds_offline: Temps écoulé depuis dernier heartbeat (s)
        
        📤 SORTIE: Email HTML formaté (design rouge)
        """
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(192,57,43,.15);">
                <div style="background: linear-gradient(135deg, #c0392b, #922b21); padding: 28px 32px; color: #fff;">
                    <h1 style="font-size: 22px; margin: 0;">🚨 ALERTE CRITIQUE — Device hors ligne</h1>
                    <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                </div>
                <div style="padding: 28px 32px;">
                    <div style="background: #fdecea; border: 1.5px solid #c0392b; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
                        ⛔ Le device <strong>{device_id}</strong> est hors ligne !
                    </div>
                    <div style="display: flex; gap: 12px; margin: 18px 0;">
                        <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c0392b;">
                            <div style="font-size: 26px; font-weight: 800; color: #c0392b;">{seconds_offline:.0f}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Secondes hors ligne</div>
                        </div>
                        <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c0392b;">
                            <div style="font-size: 26px; font-weight: 800; color: #c0392b;">{self.offline_threshold}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Seuil (s)</div>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, #1a7f4f, #0d5234); border-radius: 10px; padding: 16px 20px; color: #fff;">
                        <strong style="font-size: 16px; display: block; margin-bottom: 6px;">✅ Actions recommandées</strong>
                        • Vérifier l'alimentation électrique<br>
                        • Vérifier la connexion WiFi/Ethernet<br>
                        • Redémarrer le device
                    </div>
                </div>
                <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_back_online_email_html(self, device_id: str) -> str:
        """
        Génère le HTML de l'email pour indiquer que le device est revenu en ligne.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
        
        📤 SORTIE: Email HTML formaté (design vert)
        """
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(26,127,79,.15);">
                <div style="background: linear-gradient(135deg, #1a7f4f, #0d5234); padding: 28px 32px; color: #fff;">
                    <h1 style="font-size: 22px; margin: 0;">✅ Device reconnecté — Fin d'alerte</h1>
                    <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                </div>
                <div style="padding: 28px 32px;">
                    <div style="background: #e8f5e9; border: 1.5px solid #1a7f4f; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
                        ✅ Le device <strong>{device_id}</strong> est de nouveau en ligne !
                    </div>
                    <div style="background: #edf4ed; border-left: 4px solid #1a7f4f; border-radius: 0 10px 10px 0; padding: 14px 16px;">
                        💡 <strong>L'alerte hors ligne a été automatiquement résolue.</strong>
                    </div>
                </div>
                <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    async def _send_offline_email(self, device_id: str, seconds_offline: float) -> bool:
        """Envoie un email pour alerte hors ligne"""
        try:
            email_config = get_email_config()
            email_to = email_config.get("email_to")
            
            if not email_to:
                logger.warning("⚠️ Aucun email destinataire configuré")
                return False
            
            subject = f"🚨 ALERTE OFFLINE — {device_id} hors ligne"
            html_body = self._get_offline_email_html(device_id, seconds_offline)
            
            return send_email(subject, html_body)
        except Exception as e:
            logger.error(f"❌ Erreur envoi email offline: {e}")
            return False
    
    async def _send_back_online_email(self, device_id: str) -> bool:
        """Envoie un email pour indiquer que le device est revenu en ligne"""
        try:
            email_config = get_email_config()
            email_to = email_config.get("email_to")
            
            if not email_to:
                logger.warning("⚠️ Aucun email destinataire configuré")
                return False
            
            subject = f"✅ Device reconnecté — {device_id} est en ligne"
            html_body = self._get_back_online_email_html(device_id)
            
            return send_email(subject, html_body)
        except Exception as e:
            logger.error(f"❌ Erreur envoi email back online: {e}")
            return False
    
    async def _resolve_offline_alerts(self, device_id: str) -> bool:
        """
        Résout toutes les alertes offline non résolues pour un device.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
        
        🔄 EFFET:
            - Marque toutes les alertes offline comme résolues
            - Envoie un email de notification de retour en ligne
        """
        try:
            result = await alerts_collection.update_many(
                {
                    "device_id": device_id,
                    "type": AlertType.DEVICE_OFFLINE,
                    "resolved": False
                },
                {
                    "$set": {
                        "resolved": True,
                        "resolved_at": datetime.now(timezone.utc),
                        "resolution_notes": "Device automatiquement reconnecté"
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ {result.modified_count} alertes offline résolues pour {device_id}")
                
                # Envoyer un email de notification de retour en ligne
                await self._send_back_online_email(device_id)
                return True
            
            return False
        except Exception as e:
            logger.error(f"❌ Erreur résolution alertes offline pour {device_id}: {e}")
            return False
    
    async def _create_offline_alert(self, device_id: str, seconds_offline: float) -> bool:
        """
        Crée une alerte pour un device hors ligne et envoie un email.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
            seconds_offline: Temps écoulé depuis dernier heartbeat (s)
        
        🔄 EFFET:
            - Met à jour le statut du device dans la base
            - Crée une alerte dans MongoDB
            - Envoie un email de notification
        """
        try:
            # Vérifier si une alerte non résolue existe déjà
            existing = await alerts_collection.find_one({
                "device_id": device_id,
                "type": AlertType.DEVICE_OFFLINE,
                "resolved": False
            })
            
            if existing:
                logger.debug(f"ℹ️ Alerte offline déjà existante pour {device_id}")
                return False
            
            # Mettre à jour le statut du device dans la base
            await devices_collection.update_one(
                {"device_id": device_id},
                {"$set": {"status": "offline"}}
            )
            
            # Créer l'alerte en base
            alert = Alert(
                id=self._get_next_alert_id(),
                device_id=device_id,
                type=AlertType.DEVICE_OFFLINE,
                severity=AlertSeverity.CRITICAL,
                title="ESP32 hors ligne",
                message=f"Le device {device_id} n'a pas envoyé de heartbeat depuis {seconds_offline:.0f} secondes",
                value=seconds_offline,
                threshold=self.offline_threshold,
                timestamp=datetime.now(timezone.utc),
                resolved=False,
                acknowledged=False
            )
            
            alert_dict = alert.model_dump()
            alert_dict["created_at"] = datetime.now(timezone.utc)
            alert_dict["updated_at"] = datetime.now(timezone.utc)
            
            await alerts_collection.insert_one(alert_dict)
            logger.warning(f"🚨 ALERTE CRÉÉE: Device {device_id} hors ligne")
            
            # Envoyer l'email
            email_sent = await self._send_offline_email(device_id, seconds_offline)
            if email_sent:
                logger.info(f"📧 Email offline envoyé pour {device_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur création alerte offline pour {device_id}: {e}")
            return False
    
    def update_heartbeat(self, device_id: str) -> None:
        """
        Met à jour le timestamp du dernier heartbeat pour un device.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
        
        🔄 EFFET:
            - Enregistre la date/heure du dernier heartbeat
            - Si le device était hors ligne et revient en ligne:
              - Résout les alertes offline
              - Met à jour le statut dans la base
              - Envoie un email de notification
        
        💡 NOTE: Appelé par le endpoint POST /api/v1/heartbeat
        """
        # Vérifier si le device était hors ligne avant ce heartbeat
        was_offline = False
        last_heartbeat = self._heartbeats.get(device_id)
        
        if last_heartbeat:
            age_seconds = (datetime.now(timezone.utc) - last_heartbeat).total_seconds()
            was_offline = age_seconds > self.offline_threshold
        
        # Mettre à jour le heartbeat
        self._heartbeats[device_id] = datetime.now(timezone.utc)
        logger.debug(f"💓 Heartbeat mis à jour pour {device_id}")
        
        # Si le device était hors ligne et revient en ligne, résoudre les alertes
        if was_offline:
            logger.info(f"🔄 Device {device_id} de retour en ligne, résolution des alertes...")
            asyncio.create_task(self._resolve_offline_alerts(device_id))
            
            # Mettre à jour le statut dans la base
            asyncio.create_task(
                devices_collection.update_one(
                    {"device_id": device_id},
                    {"$set": {"status": "active", "last_heartbeat": datetime.now(timezone.utc)}}
                )
            )
    
    def get_heartbeat_status(self, device_id: str) -> Dict[str, Any]:
        """
        Récupère le statut du heartbeat pour un device.
        
        📥 ENTRÉE:
            device_id: Identifiant du device
        
        📤 SORTIE:
            dict: {
                "online": bool,           # True si device en ligne
                "last_seen": str,         # Dernier heartbeat (ISO format)
                "age_seconds": float,     # Temps écoulé (secondes)
                "status": str             # "online", "offline", "never_seen"
            }
        """
        last_heartbeat = self._heartbeats.get(device_id)
        
        if not last_heartbeat:
            return {
                "online": False,
                "last_seen": None,
                "age_seconds": None,
                "status": "never_seen"
            }
        
        now = datetime.now(timezone.utc)
        age_seconds = (now - last_heartbeat).total_seconds()
        
        return {
            "online": age_seconds < self.offline_threshold,
            "last_seen": last_heartbeat.isoformat(),
            "age_seconds": round(age_seconds, 1),
            "status": "online" if age_seconds < self.offline_threshold else "offline"
        }
    
    def get_all_heartbeats(self) -> Dict[str, Dict[str, Any]]:
        """
        Récupère le statut de tous les heartbeats.
        
        📤 SORTIE:
            dict: {device_id: heartbeat_status, ...}
        """
        result = {}
        for device_id in self._heartbeats:
            result[device_id] = self.get_heartbeat_status(device_id)
        return result
    
    async def _check_once(self) -> None:
        """
        Effectue une vérification unique des devices hors ligne.
        
        🔍 ALGORITHME:
            1. Récupère tous les devices actifs depuis MongoDB
            2. Pour chaque device, vérifie la date du dernier heartbeat
            3. Si heartbeat trop vieux (> offline_threshold) → crée alerte
        """
        try:
            logger.debug("🔍 Vérification des devices hors ligne...")
            
            cursor = devices_collection.find({"status": "active"})
            active_devices = await cursor.to_list(length=100)
            
            for device in active_devices:
                device_id = device["device_id"]
                last_heartbeat = self._heartbeats.get(device_id)
                
                if last_heartbeat:
                    age_seconds = (datetime.now(timezone.utc) - last_heartbeat).total_seconds()
                    
                    if age_seconds > self.offline_threshold:
                        logger.info(f"⚠️ Device {device_id} hors ligne depuis {age_seconds:.0f}s")
                        await self._create_offline_alert(device_id, age_seconds)
                else:
                    # Device n'a jamais envoyé de heartbeat
                    logger.debug(f"⚠️ Device {device_id}: jamais de heartbeat reçu")
            
            logger.debug("✅ Vérification terminée")
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la vérification: {e}")
    
    async def _run_loop(self) -> None:
        """
        Boucle principale de vérification.
        
        🔄 FONCTIONNEMENT:
            - Tourne tant que self._running est True
            - À chaque itération: vérifie les devices hors ligne
            - Attend self.check_interval secondes
            - Continue indéfiniment
        """
        logger.info(f"🚀 Surveillance offline démarrée (intervalle={self.check_interval}s, seuil={self.offline_threshold}s)")
        
        while self._running:
            try:
                await self._check_once()
            except Exception as e:
                logger.error(f"❌ Erreur dans la boucle de vérification: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    def start(self) -> None:
        """
        Démarre la tâche de surveillance.
        
        💡 NOTE: Appelé automatiquement dans main.py (lifespan)
        """
        if self._running:
            logger.warning("La surveillance est déjà en cours")
            return
        
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("✅ Tâche de surveillance offline démarrée")
    
    async def stop(self) -> None:
        """
        Arrête proprement la tâche de surveillance.
        
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
        
        logger.info("🛑 Tâche de surveillance offline arrêtée")
    
    def is_running(self) -> bool:
        """Vérifie si la surveillance est active"""
        return self._running


# ============================================================================
# 🌐 INSTANCE GLOBALE ET FONCTIONS D'ACCÈS
# ============================================================================

_offline_checker: OfflineDeviceChecker | None = None


def get_offline_checker() -> OfflineDeviceChecker:
    """
    Récupère l'instance globale unique du vérificateur offline (Singleton).
    
    📤 SORTIE:
        OfflineDeviceChecker: Instance globale
    
    💡 UTILISATION:
        checker = get_offline_checker()
        checker.start()
    """
    global _offline_checker
    if _offline_checker is None:
        _offline_checker = OfflineDeviceChecker()
    return _offline_checker


async def start_offline_check() -> None:
    """Démarre la surveillance offline (fonction de commodité)"""
    checker = get_offline_checker()
    checker.start()


async def stop_offline_check() -> None:
    """Arrête la surveillance offline (fonction de commodité)"""
    checker = get_offline_checker()
    await checker.stop()


def update_heartbeat(device_id: str) -> None:
    """
    Met à jour le heartbeat d'un device (fonction de commodité).
    
    📥 ENTRÉE:
        device_id: Identifiant du device
    
    💡 UTILISATION:
        Appelé par heartbeat.py
    """
    checker = get_offline_checker()
    checker.update_heartbeat(device_id)


def get_heartbeat_status(device_id: str) -> Dict[str, Any]:
    """
    Récupère le statut du heartbeat (fonction de commodité).
    
    📥 ENTRÉE:
        device_id: Identifiant du device
    
    📤 SORTIE: Dictionnaire du statut
    """
    checker = get_offline_checker()
    return checker.get_heartbeat_status(device_id)


def get_all_heartbeats() -> Dict[str, Dict[str, Any]]:
    """
    Récupère tous les statuts de heartbeat (fonction de commodité).
    
    📤 SORTIE: Dictionnaire {device_id: status}
    """
    checker = get_offline_checker()
    return checker.get_all_heartbeats()