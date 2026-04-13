# ============================================================================
# FICHIER: alert_service.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient le service central de gestion des alertes.
#   Il est responsable de la création, de l'envoi par email et du suivi
#   des alertes système (ensablement, baisse de production, température,
#   device hors ligne, etc.).
#
# 🏗️ ARCHITECTURE:
#   - Classe AlertService avec méthodes statiques (design pattern Service)
#   - Fonctions simplifiées pour un appel direct depuis d'autres modules
#
# 🚨 TYPES D'ALERTES GÉRÉES:
#   - Soiling (ensablement)         : Warning ou Critical
#   - Power Drop (baisse production) : Warning
#   - High Temperature               : Warning ou Critical
#   - Device Offline                 : Critical
#
# 📧 EMAILS HTML:
#   - Templates HTML responsives intégrés
#   - Design professionnel avec couleurs adaptées à la sévérité
#   - Compatibles avec tous les clients email
#
# 🔐 SÉCURITÉ:
#   - Évite les doublons: vérifie si une alerte non résolue existe déjà
#   - Cooldown géré par l'appelant (alert_task)
#   - Configuration email depuis config_manager
#
# 📊 STRUCTURE D'UNE ALERTE:
#   {
#     "id": "67f8a1b2...",           # ID unique (ObjectId)
#     "device_id": "esp2",            # Device concerné
#     "type": "soiling",              # Type d'alerte
#     "severity": "warning",          # info/warning/critical
#     "title": "Ensablement modéré",  # Titre court
#     "message": "...",               # Description détaillée
#     "value": 45.2,                  # Valeur mesurée
#     "threshold": 30.0,              # Seuil déclencheur
#     "timestamp": "2026-04-11T...",  # Date de création
#     "acknowledged": false,          # Prise en compte
#     "resolved": false               # Résolution
#   }
#
# ============================================================================

"""
Service de gestion des alertes
Centralise la création et la gestion des alertes système
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from database import alerts_collection
from schemas import Alert, AlertType, AlertSeverity
from services.email_service import send_email, get_email_config

logger = logging.getLogger(__name__)


# ============================================================================
# 🚨 SERVICE D'ALERTES
# ============================================================================

class AlertService:
    """
    Service pour la gestion des alertes
    
    Méthodes principales:
        - create_alert()           : Crée une alerte (générique)
        - create_soiling_alert()   : Alerte d'ensablement
        - create_power_drop_alert(): Alerte de baisse de production
        - create_temperature_alert(): Alerte de température élevée
        - create_offline_alert()   : Alerte device hors ligne
        - resolve_alert()          : Marque comme résolue
        - acknowledge_alert()      : Marque comme prise en compte
        - get_unresolved_alerts()  : Liste des alertes actives
    """
    
    @classmethod
    async def _get_next_id(cls) -> str:
        """
        Génère un ID unique pour une nouvelle alerte.
        
        📤 SORTIE: ID unique (string) basé sur ObjectId MongoDB
        """
        return str(ObjectId())
    
    @classmethod
    async def _send_email_alert(cls, subject: str, html_body: str) -> bool:
        """
        Envoie un email d'alerte via le service email.
        
        📥 ENTRÉE:
            - subject   : Sujet de l'email
            - html_body : Corps HTML de l'email
        
        📤 SORTIE: True si l'email a été envoyé, False sinon
        """
        try:
            email_config = get_email_config()
            email_to = email_config.get("email_to")
            
            if not email_to:
                logger.warning("⚠️ Aucun email destinataire configuré")
                return False
            
            return send_email(subject, html_body)
        except Exception as e:
            logger.error(f"❌ Erreur envoi email: {e}")
            return False
    
    @classmethod
    def _get_power_drop_email_html(cls, device_id: str, current_power: float, expected_power: float, loss_percent: float) -> str:
        """
        Génère le template HTML pour une alerte de baisse de production.
        
        📥 ENTRÉE:
            - device_id      : Identifiant du device
            - current_power  : Puissance actuelle (W)
            - expected_power : Puissance attendue (W)
            - loss_percent   : Pourcentage de perte
        
        📤 SORTIE: Chaîne HTML formatée pour email
        """
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(196,125,14,.15);">
                <div style="background: linear-gradient(135deg, #c47d0e, #a06508); padding: 28px 32px; color: #fff;">
                    <h1 style="font-size: 22px; margin: 0;">⚠️ ALERTE — Baisse de production</h1>
                    <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                </div>
                <div style="padding: 28px 32px;">
                    <p style="color: #375e45;">Le panneau solaire <strong>{device_id}</strong> présente une baisse anormale de production.</p>
                    <div style="display: flex; gap: 12px; margin: 18px 0;">
                        <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                            <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">{current_power:.0f}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Puissance actuelle (W)</div>
                        </div>
                        <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                            <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">{expected_power:.0f}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Puissance attendue (W)</div>
                        </div>
                        <div style="flex: 1; background: #fef3dc; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #c47d0e;">
                            <div style="font-size: 26px; font-weight: 800; color: #c47d0e;">{loss_percent:.0f}%</div>
                            <div style="font-size: 11px; color: #7aaa88;">Perte de production</div>
                        </div>
                    </div>
                    <div style="background: #edf4ed; border-left: 4px solid #1a7f4f; border-radius: 0 10px 10px 0; padding: 14px 16px;">
                        💡 <strong>Recommandation :</strong> Vérifier l'ensablement, les connexions électriques et l'ombrage.
                    </div>
                </div>
                <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    @classmethod
    def _get_temperature_email_html(cls, device_id: str, temperature: float, threshold: float, is_critical: bool) -> str:
        """
        Génère le template HTML pour une alerte de température élevée.
        
        📥 ENTRÉE:
            - device_id   : Identifiant du device
            - temperature : Température mesurée (°C)
            - threshold   : Seuil déclencheur (°C)
            - is_critical : True si critique (>80°C), False si warning
        
        📤 SORTIE: Chaîne HTML formatée pour email
        """
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        color = "#c0392b" if is_critical else "#c47d0e"
        bg_gradient = "linear-gradient(135deg, #c0392b, #922b21)" if is_critical else "linear-gradient(135deg, #c47d0e, #a06508)"
        level = "CRITIQUE" if is_critical else "Warning"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(192,57,43,.15);">
                <div style="background: {bg_gradient}; padding: 28px 32px; color: #fff;">
                    <h1 style="font-size: 22px; margin: 0;">🌡️ ALERTE {level} — Température élevée</h1>
                    <p style="margin: 6px 0 0; opacity: .85;">Système de surveillance PV · {timestamp}</p>
                </div>
                <div style="padding: 28px 32px;">
                    <div style="background: #fdecea; border: 1.5px solid {color}; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
                        ⚠️ Le module <strong>{device_id}</strong> présente une température anormalement élevée !
                    </div>
                    <div style="display: flex; gap: 12px; margin: 18px 0;">
                        <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid {color};">
                            <div style="font-size: 26px; font-weight: 800; color: {color};">{temperature:.1f}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Température (°C)</div>
                        </div>
                        <div style="flex: 1; background: #fdecea; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid {color};">
                            <div style="font-size: 26px; font-weight: 800; color: {color};">{threshold:.0f}</div>
                            <div style="font-size: 11px; color: #7aaa88;">Seuil (°C)</div>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, #1a7f4f, #0d5234); border-radius: 10px; padding: 16px 20px; color: #fff;">
                        <strong style="font-size: 16px; display: block; margin-bottom: 6px;">✅ Actions recommandées</strong>
                        • Vérifier la ventilation autour du panneau<br>
                        • Vérifier l'ensoleillement excessif<br>
                        • Surveiller l'évolution de la température
                    </div>
                </div>
                <div style="background: #f5f8f5; padding: 16px 32px; font-size: 11px; color: #7aaa88; text-align: center;">
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    @classmethod
    async def create_alert(
        cls,
        device_id: str,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        value: Optional[float] = None,
        threshold: Optional[float] = None,
        send_email_notification: bool = True
    ) -> Optional[Alert]:
        """
        Crée une nouvelle alerte et l'enregistre dans MongoDB.
        
        📥 ENTRÉE:
            - device_id               : Identifiant du device
            - alert_type              : Type d'alerte (soiling, power_drop, etc.)
            - severity                : Niveau de sévérité (info/warning/critical)
            - title                   : Titre court de l'alerte
            - message                 : Description détaillée
            - value                   : Valeur mesurée (optionnel)
            - threshold               : Seuil déclencheur (optionnel)
            - send_email_notification : Envoyer un email immédiatement
        
        📤 SORTIE: Objet Alert créé, ou None si alerte déjà existante
        
        🔒 SÉCURITÉ:
            - Évite les doublons: vérifie si une alerte non résolue du même
              type existe déjà pour ce device
            
        📧 EMAIL:
            - Envoi automatique selon le type d'alerte (email HTML)
            - Désactivable via send_email_notification=False
        """
        try:
            # Vérifier si une alerte non résolue existe déjà pour éviter les doublons
            existing = await alerts_collection.find_one({
                "device_id": device_id,
                "type": alert_type,
                "severity": severity,
                "resolved": False
            })
            
            if existing:
                logger.debug(f"ℹ️ Alerte {alert_type} déjà existante pour {device_id}")
                return None
            
            now = datetime.now(timezone.utc)
            
            # Créer l'objet alerte
            alert = Alert(
                id=await cls._get_next_id(),
                device_id=device_id,
                type=alert_type,
                severity=severity,
                title=title,
                message=message,
                value=value,
                threshold=threshold,
                timestamp=now,
                resolved=False,
                acknowledged=False
            )
            
            # Convertir en dictionnaire pour MongoDB
            alert_dict = alert.model_dump()
            alert_dict["created_at"] = now
            alert_dict["updated_at"] = now
            
            # Insérer dans la base de données
            await alerts_collection.insert_one(alert_dict)
            logger.info(f"✅ Alerte créée: {alert.id} - {title}")
            
            # Envoyer l'email si demandé
            if send_email_notification:
                await cls._send_email_for_alert(alert, alert_type, value, threshold)
            
            return alert
            
        except Exception as e:
            logger.error(f"❌ Erreur création alerte: {e}")
            return None
    
    @classmethod
    async def _send_email_for_alert(cls, alert: Alert, alert_type: AlertType, value: Optional[float], threshold: Optional[float]) -> None:
        """
        Envoie un email adapté au type d'alerte.
        
        📥 ENTRÉE:
            - alert       : Objet alerte
            - alert_type  : Type d'alerte
            - value       : Valeur mesurée
            - threshold   : Seuil déclencheur
        """
        try:
            email_config = get_email_config()
            email_to = email_config.get("email_to")
            
            if not email_to:
                logger.warning("⚠️ Aucun email destinataire configuré")
                return
            
            subject = f"{alert.severity.value.upper()} — {alert.title}"
            html_body = ""
            
            # ================================================================
            # EMAIL POUR BAISSE DE PRODUCTION
            # ================================================================
            if alert_type == AlertType.POWER_DROP and value and threshold:
                expected_power = threshold * 2  # Seuil = 50% de la puissance attendue
                loss_percent = ((expected_power - value) / expected_power) * 100 if expected_power > 0 else 0
                html_body = cls._get_power_drop_email_html(alert.device_id, value, expected_power, loss_percent)
            
            # ================================================================
            # EMAIL POUR TEMPÉRATURE ÉLEVÉE
            # ================================================================
            elif alert_type == AlertType.HIGH_TEMPERATURE and value and threshold:
                is_critical = alert.severity == AlertSeverity.CRITICAL
                html_body = cls._get_temperature_email_html(alert.device_id, value, threshold, is_critical)
            
            # ================================================================
            # EMAIL GÉNÉRIQUE (AUTRES TYPES)
            # ================================================================
            else:
                timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
                html_body = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
                    <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #1a7f4f;">
                        <div style="background: #1a7f4f; padding: 20px; color: #fff;">
                            <h1 style="margin: 0;">📢 {alert.title}</h1>
                            <p style="margin: 5px 0 0;">{timestamp}</p>
                        </div>
                        <div style="padding: 20px;">
                            <p><strong>Device:</strong> {alert.device_id}</p>
                            <p><strong>Message:</strong> {alert.message}</p>
                            {f'<p><strong>Valeur:</strong> {value} / Seuil: {threshold}</p>' if value and threshold else ''}
                            <hr>
                            <p><small>PFE Surveillance PV · Alerte automatique</small></p>
                        </div>
                    </div>
                </body>
                </html>
                """
            
            if html_body:
                send_email(subject, html_body)
                logger.info(f"📧 Email envoyé pour {alert.id}")
                
        except Exception as e:
            logger.error(f"❌ Erreur envoi email pour alerte {alert.id}: {e}")
    
    @classmethod
    async def create_soiling_alert(
        cls,
        device_id: str,
        soiling_level: float,
        threshold: float,
        is_critical: bool = False
    ) -> Optional[Alert]:
        """
        Crée une alerte d'ensablement.
        
        📥 ENTRÉE:
            - device_id     : Identifiant du device
            - soiling_level : Niveau d'ensablement (%)
            - threshold     : Seuil déclencheur (%)
            - is_critical   : True pour critique, False pour warning
        
        📤 SORTIE: Objet Alert créé, ou None si déjà existante
        
        📧 EMAIL: Non envoyé (géré par alert_task pour éviter doublons)
        """
        if is_critical:
            return await cls.create_alert(
                device_id=device_id,
                alert_type=AlertType.SOILING,
                severity=AlertSeverity.CRITICAL,
                title="Ensablement critique",
                message=f"Ensablement à {soiling_level:.1f}% - Nettoyage urgent requis",
                value=soiling_level,
                threshold=threshold,
                send_email_notification=False  # Email géré par alert_task
            )
        else:
            return await cls.create_alert(
                device_id=device_id,
                alert_type=AlertType.SOILING,
                severity=AlertSeverity.WARNING,
                title="Ensablement modéré",
                message=f"Ensablement à {soiling_level:.1f}% - Nettoyage recommandé",
                value=soiling_level,
                threshold=threshold,
                send_email_notification=False  # Email géré par alert_task
            )
    
    @classmethod
    async def create_power_drop_alert(
        cls,
        device_id: str,
        current_power: float,
        expected_power: float,
        loss_percent: float
    ) -> Optional[Alert]:
        """
        Crée une alerte de baisse de production.
        
        📥 ENTRÉE:
            - device_id     : Identifiant du device
            - current_power : Puissance actuelle (W)
            - expected_power: Puissance attendue (W)
            - loss_percent  : Pourcentage de perte
        
        📤 SORTIE: Objet Alert créé, ou None si déjà existante
        
        📧 EMAIL: Envoyé automatiquement
        """
        return await cls.create_alert(
            device_id=device_id,
            alert_type=AlertType.POWER_DROP,
            severity=AlertSeverity.WARNING,
            title="Baisse de production",
            message=f"Puissance anormalement basse: {current_power:.0f}W vs {expected_power:.0f}W attendus (perte {loss_percent:.0f}%)",
            value=current_power,
            threshold=expected_power * 0.5,
            send_email_notification=True  # ✅ Envoi email
        )
    
    @classmethod
    async def create_temperature_alert(
        cls,
        device_id: str,
        temperature: float,
        threshold: float = 65.0
    ) -> Optional[Alert]:
        """
        Crée une alerte de température élevée.
        
        📥 ENTRÉE:
            - device_id   : Identifiant du device
            - temperature : Température mesurée (°C)
            - threshold   : Seuil déclencheur (défaut 65°C)
        
        📤 SORTIE: Objet Alert créé, ou None si déjà existante
        
        📧 EMAIL: Envoyé automatiquement
        
        📊 SEUILS:
            - >65°C  : Warning
            - >80°C  : Critical
        """
        severity = AlertSeverity.CRITICAL if temperature > 80 else AlertSeverity.WARNING
        
        return await cls.create_alert(
            device_id=device_id,
            alert_type=AlertType.HIGH_TEMPERATURE,
            severity=severity,
            title="Température anormalement élevée",
            message=f"Température du module: {temperature:.1f}°C (seuil: {threshold}°C)",
            value=temperature,
            threshold=threshold,
            send_email_notification=True  # ✅ Envoi email
        )
    
    @classmethod
    async def create_offline_alert(
        cls,
        device_id: str,
        seconds_offline: float
    ) -> Optional[Alert]:
        """
        Crée une alerte de device hors ligne.
        
        📥 ENTRÉE:
            - device_id      : Identifiant du device
            - seconds_offline : Temps écoulé depuis dernier heartbeat (s)
        
        📤 SORTIE: Objet Alert créé, ou None si déjà existante
        
        📧 EMAIL: Envoyé automatiquement
        
        📊 SEUIL: Offline si >65 secondes sans heartbeat
        """
        return await cls.create_alert(
            device_id=device_id,
            alert_type=AlertType.DEVICE_OFFLINE,
            severity=AlertSeverity.CRITICAL,
            title="ESP32 hors ligne",
            message=f"Le device {device_id} n'a pas envoyé de heartbeat depuis {seconds_offline:.0f} secondes",
            value=seconds_offline,
            threshold=65,
            send_email_notification=True  # ✅ Envoi email
        )
    
    @classmethod
    async def resolve_alert(cls, alert_id: str, notes: Optional[str] = None) -> bool:
        """
        Marque une alerte comme résolue (problème traité).
        
        📥 ENTRÉE:
            - alert_id : Identifiant de l'alerte
            - notes    : Notes optionnelles sur la résolution
        
        📤 SORTIE: True si modifiée, False sinon
        """
        try:
            result = await alerts_collection.update_one(
                {"id": alert_id},
                {
                    "$set": {
                        "resolved": True,
                        "resolved_at": datetime.now(timezone.utc),
                        "resolution_notes": notes
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"❌ Erreur résolution alerte {alert_id}: {e}")
            return False
    
    @classmethod
    async def acknowledge_alert(cls, alert_id: str, acknowledged_by: str = "system") -> bool:
        """
        Marque une alerte comme prise en compte (lue par l'utilisateur).
        
        📥 ENTRÉE:
            - alert_id        : Identifiant de l'alerte
            - acknowledged_by : Nom ou ID de la personne
        
        📤 SORTIE: True si modifiée, False sinon
        """
        try:
            result = await alerts_collection.update_one(
                {"id": alert_id},
                {
                    "$set": {
                        "acknowledged": True,
                        "acknowledged_by": acknowledged_by,
                        "acknowledged_at": datetime.now(timezone.utc)
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"❌ Erreur acknowledgement alerte {alert_id}: {e}")
            return False
    
    @classmethod
    async def get_unresolved_alerts(cls, device_id: Optional[str] = None) -> list:
        """
        Récupère toutes les alertes non résolues.
        
        📥 ENTRÉE:
            - device_id : Filtrer par device (optionnel)
        
        📤 SORTIE: Liste des alertes non résolues (triées par date décroissante)
        """
        query = {"resolved": False}
        if device_id:
            query["device_id"] = device_id
        
        cursor = alerts_collection.find(query).sort("created_at", -1)
        return await cursor.to_list(length=100)


# ============================================================================
# 🚀 FONCTIONS SIMPLIFIÉES POUR APPEL DIRECT
# ============================================================================
# Ces fonctions permettent d'appeler le service d'alertes sans instanciation
# Elles sont utilisées par d'autres modules (alert_task, etc.)

async def create_soiling_alert(device_id: str, soiling_level: float, threshold: float, is_critical: bool = False):
    """Version simplifiée pour créer une alerte d'ensablement"""
    return await AlertService.create_soiling_alert(device_id, soiling_level, threshold, is_critical)


async def create_offline_alert(device_id: str, seconds_offline: float):
    """Version simplifiée pour créer une alerte de device hors ligne"""
    return await AlertService.create_offline_alert(device_id, seconds_offline)


async def create_power_drop_alert(device_id: str, current_power: float, expected_power: float, loss_percent: float):
    """Version simplifiée pour créer une alerte de baisse de production"""
    return await AlertService.create_power_drop_alert(device_id, current_power, expected_power, loss_percent)


async def create_temperature_alert(device_id: str, temperature: float, threshold: float = 65.0):
    """Version simplifiée pour créer une alerte de température élevée"""
    return await AlertService.create_temperature_alert(device_id, temperature, threshold)