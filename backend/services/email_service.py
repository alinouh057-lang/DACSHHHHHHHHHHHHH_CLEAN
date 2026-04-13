# ============================================================================
# FICHIER: email_service.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient le service d'envoi d'emails pour le système PV Monitor.
#   Il centralise toutes les fonctionnalités liées à l'envoi d'emails :
#   alertes d'ensablement, notifications, tests de configuration.
#
# 📧 FONCTIONS PRINCIPALES:
#   - send_email()          : Envoi générique d'email HTML
#   - send_alert_email()    : Envoi d'alerte d'ensablement (warning/critical)
#   - test_email_config()   : Test de la configuration SMTP
#
# ⚙️ CONFIGURATION SMTP:
#   - SMTP_HOST     : Serveur SMTP (ex: smtp.gmail.com)
#   - SMTP_PORT     : Port SMTP (587 pour TLS)
#   - EMAIL_FROM    : Adresse email expéditrice
#   - EMAIL_PASS    : Mot de passe (ou mot de passe d'application Gmail)
#   - EMAIL_TO      : Destinataire des alertes
#
# 🔐 SÉCURITÉ:
#   - Utilise STARTTLS pour chiffrer la connexion
#   - Mot de passe non stocké en clair dans les logs
#   - Gestion des erreurs sans exposer les détails sensibles
#
# 📧 FORMAT DES EMAILS:
#   - HTML responsif (compatible mobiles et desktop)
#   - Design professionnel avec couleurs adaptées à la sévérité
#   - Rouge (#c0392b) pour les alertes critiques
#   - Orange (#c47d0e) pour les avertissements
#   - Vert (#1a7f4f) pour les confirmations
#
# 🔄 PERSISTANCE:
#   - La configuration est stockée dans email_config.json
#   - Modifiable via l'interface d'administration
#   - Persiste entre les redémarrages
#
# ============================================================================

"""
Service d'envoi d'emails - PV Monitor
Centralise l'envoi d'emails pour les alertes et notifications
"""

import smtplib
import ssl
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from config import Config
from config_manager import get_email_config, get_config

logger = logging.getLogger(__name__)


# ============================================================================
# 📧 ENVOI D'EMAIL GÉNÉRIQUE
# ============================================================================

def send_email(subject: str, html_body: str) -> bool:
    """
    Envoie un email HTML en utilisant la configuration dynamique.
    
    📥 ENTRÉE:
        subject: Sujet de l'email
        html_body: Corps HTML de l'email
    
    📤 SORTIE:
        bool: True si l'email a été envoyé avec succès, False sinon
    
    ⚙️ CONFIGURATION UTILISÉE (depuis email_config.json):
        - email_to      : Destinataire
        - email_from    : Expéditeur
        - smtp_host     : Serveur SMTP
        - smtp_port     : Port SMTP
        - smtp_password : Mot de passe
    
    🔧 PROTOCOLE:
        1. Récupère la configuration email
        2. Vérifie que tous les paramètres sont présents
        3. Construit le message MIME multipart
        4. Établit une connexion SMTP avec STARTTLS
        5. Envoie l'email
        6. Log le résultat
    
    📝 EXEMPLE D'UTILISATION:
        send_email(
            subject="Alerte ensablement",
            html_body="<h1>Nettoyage requis</h1><p>...</p>"
        )
    """
    try:
        # ====================================================================
        # 1. RÉCUPÉRATION DE LA CONFIGURATION
        # ====================================================================
        email_config = get_email_config()
        
        email_to = email_config.get("email_to")
        if not email_to:
            logger.error("❌ Aucun email destinataire configuré")
            return False
        
        # Valeurs par défaut depuis Config si non définies dans la config dynamique
        email_from = email_config.get("email_from", Config.EMAIL_FROM)
        smtp_host = email_config.get("smtp_host", Config.SMTP_HOST)
        smtp_port = email_config.get("smtp_port", Config.SMTP_PORT)
        smtp_password = email_config.get("smtp_password", Config.EMAIL_PASS)
        
        # ====================================================================
        # 2. VALIDATION DE LA CONFIGURATION
        # ====================================================================
        if not all([smtp_host, smtp_port, email_from, smtp_password]):
            logger.error("❌ Configuration SMTP incomplète")
            logger.debug(f"   SMTP_HOST: {smtp_host}")
            logger.debug(f"   SMTP_PORT: {smtp_port}")
            logger.debug(f"   EMAIL_FROM: {email_from}")
            logger.debug(f"   EMAIL_PASS: {'***' if smtp_password else 'None'}")
            return False
        
        # ====================================================================
        # 3. CONSTRUCTION DU MESSAGE
        # ====================================================================
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email_to
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        
        # ====================================================================
        # 4. ENVOI VIA SMTP AVEC STARTTLS
        # ====================================================================
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.ehlo()                     # Identification au serveur
            smtp.starttls(context=ctx)      # Activation du chiffrement TLS
            smtp.login(email_from, smtp_password)  # Authentification
            smtp.sendmail(email_from, email_to, msg.as_string())
        
        logger.info(f"✅ Email envoyé → {email_to} | Sujet: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur envoi email: {e}")
        return False


# ============================================================================
# 🚨 ENVOI D'ALERTE D'ENSABLEMENT
# ============================================================================

def send_alert_email(soiling: float, device_id: str, power: float, is_critical: bool) -> bool:
    """
    Envoie un email d'alerte d'ensablement (warning ou critical).
    
    📥 ENTRÉE:
        soiling: Niveau d'ensablement (%)
        device_id: Identifiant du device ESP32
        power: Puissance actuelle mesurée (Watts)
        is_critical: True pour alerte critique, False pour warning
    
    📤 SORTIE:
        bool: True si l'email a été envoyé avec succès
    
    🎨 DESIGN DES EMAILS:
        - Critique : fond rouge (#c0392b), bannière "URGENT"
        - Warning   : fond orange (#c47d0e), bannière "Warning"
    
    📊 CONTENU:
        - Niveau d'ensablement avec jauge visuelle
        - Puissance actuelle
        - Estimation de la perte de rendement
        - Action recommandée
        - Timestamp de l'alerte
    
    💡 EXEMPLE D'ALERTE CRITIQUE:
        Sujet: 🚨 CRITIQUE — Ensablement 78% sur esp2
        Corps: Alerte visuelle avec données en 3 colonnes
    """
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
    # Estimation de la perte de rendement (approximation)
    loss_percent = min(soiling * 0.8, 80) if is_critical else min(soiling * 0.6, 35)
    
    # ========================================================================
    # TEMPLATE POUR ALERTE CRITIQUE (ROUGE)
    # ========================================================================
    if is_critical:
        subject = f"🚨 CRITIQUE — Ensablement {soiling:.0f}% sur {device_id}"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
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
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    # ========================================================================
    # TEMPLATE POUR ALERTE WARNING (ORANGE)
    # ========================================================================
    else:
        subject = f"⚠️ Warning — Ensablement {soiling:.0f}% sur {device_id}"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f8f5;">
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
                    PFE Surveillance PV · Alerte automatique · Ne pas répondre à cet email
                </div>
            </div>
        </body>
        </html>
        """
    
    return send_email(subject, html_body)


# ============================================================================
# 🧪 TEST DE LA CONFIGURATION EMAIL
# ============================================================================

def test_email_config() -> dict:
    """
    Teste la configuration email actuelle en tentant une connexion SMTP.
    
    📤 SORTIE:
        dict: {
            "status": "success" ou "error",
            "message": "Description du résultat",
            "details": {  # seulement en cas de succès
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "email_from": "alertes@example.com",
                "email_to": "admin@example.com"
            }
        }
    
    🧪 CE QUE LE TEST VÉRIFIE:
        1. Présence d'un email destinataire
        2. Configuration SMTP complète (host, port, from, password)
        3. Connexion au serveur SMTP
        4. Authentification avec les identifiants
    
    💡 UTILISATION:
        Utilisé dans l'interface d'administration pour valider
        la configuration avant de sauvegarder.
    
    ⚠️ NOTE: N'envoie PAS d'email, seulement une connexion test.
    """
    try:
        # ====================================================================
        # 1. RÉCUPÉRATION DE LA CONFIGURATION
        # ====================================================================
        email_config = get_email_config()
        email_to = email_config.get("email_to")
        
        if not email_to:
            return {"status": "error", "message": "Aucun email destinataire configuré"}
        
        email_from = email_config.get("email_from", Config.EMAIL_FROM)
        smtp_host = email_config.get("smtp_host", Config.SMTP_HOST)
        smtp_port = email_config.get("smtp_port", Config.SMTP_PORT)
        smtp_password = email_config.get("smtp_password", Config.EMAIL_PASS)
        
        # ====================================================================
        # 2. VALIDATION DE LA CONFIGURATION
        # ====================================================================
        if not all([smtp_host, smtp_port, email_from, smtp_password]):
            return {"status": "error", "message": "Configuration SMTP incomplète"}
        
        # ====================================================================
        # 3. TEST DE CONNEXION SMTP
        # ====================================================================
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ctx)
            smtp.login(email_from, smtp_password)
        
        # ====================================================================
        # 4. SUCCÈS
        # ====================================================================
        return {
            "status": "success",
            "message": "Configuration email valide",
            "details": {
                "smtp_host": smtp_host,
                "smtp_port": smtp_port,
                "email_from": email_from,
                "email_to": email_to
            }
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Erreur: {str(e)}"}