# ============================================================================
# FICHIER: config_manager.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier gère la configuration DYNAMIQUE de l'application PV Monitor.
#   Contrairement à config.py (statique, lu une fois au démarrage), ce module
#   permet de modifier la configuration à chaud via l'interface d'administration,
#   avec persistance dans des fichiers JSON.
#
# 🏗️ ARCHITECTURE:
#   - Deux fichiers de configuration distincts:
#     * config_dynamic.json  : Configuration générale (seuils, nettoyage, GPS)
#     * email_config.json    : Configuration email (SMTP, destinataires)
#   - Variables globales en mémoire (_dynamic_config, _email_config)
#   - Fonctions de chargement/sauvegarde automatiques
#
# 📋 FONCTIONNALITÉS:
#   - Chargement/sauvegarde automatique des configurations
#   - Persistance dans des fichiers JSON
#   - Valeurs par défaut depuis Config.py
#   - API pour lire/mettre à jour les configurations
#
# ⚙️ CONFIGURATION GÉNÉRALE (config_dynamic.json):
#   - seuil_warning     : Seuil d'alerte Warning (%)
#   - seuil_critical    : Seuil d'alerte Critical (%)
#   - retention_days    : Jours de conservation des images
#   - cleanup_interval  : Fréquence de nettoyage (heures)
#   - latitude          : Latitude GPS pour l'irradiance
#   - longitude         : Longitude GPS pour l'irradiance
#   - panel_area_m2     : Surface du panneau (m²)
#   - panel_efficiency  : Rendement du panneau (%)
#   - timezone          : Fuseau horaire pour l'affichage
#
# 📧 CONFIGURATION EMAIL (email_config.json):
#   - email_to          : Destinataire des alertes
#   - email_from        : Expéditeur
#   - smtp_host         : Serveur SMTP
#   - smtp_port         : Port SMTP
#   - smtp_password     : Mot de passe (caché dans les réponses API)
#
# 🔄 PERSISTANCE:
#   - Les modifications sont immédiatement sauvegardées sur disque
#   - Les configurations persistent entre les redémarrages
#   - Format JSON lisible et éditable manuellement
#
# 📦 UTILISATION TYPIQUE:
#   from config_manager import get_config, update_config
#   config = get_config()
#   seuil = config.get("seuil_warning", 30)
#   update_config({"seuil_warning": 25})
#
# ============================================================================

"""
Gestionnaire de configuration dynamique avec persistance fichier
"""

import json
import os
from pathlib import Path
from config import Config

# ============================================================================
# 📁 CHEMINS DES FICHIERS DE CONFIGURATION
# ============================================================================
# Ces fichiers sont créés automatiquement au premier démarrage
CONFIG_FILE = Path("config_dynamic.json")      # Configuration générale
EMAIL_CONFIG_FILE = Path("email_config.json")  # Configuration email


# ============================================================================
# 📦 CONFIGURATIONS PAR DÉFAUT
# ============================================================================

# Configuration générale par défaut (valeurs depuis Config.py)
DEFAULT_CONFIG = {
    "seuil_warning": Config.SEUIL_WARNING,           # 30% (alerte warning)
    "seuil_critical": Config.SEUIL_CRITICAL,         # 60% (alerte critique)
    "retention_days": Config.IMAGE_RETENTION_DAYS,   # 7 jours
    "cleanup_interval": Config.CLEANUP_INTERVAL_HOURS,  # 24 heures
    "latitude": None,                                 # Non configurée par défaut
    "longitude": None,                                # Non configurée par défaut
    "panel_area_m2": 1.6,                            # Surface standard (m²)
    "panel_efficiency": 0.20,                        # Rendement standard (20%)
}

# Configuration email par défaut (valeurs depuis Config.py)
DEFAULT_EMAIL_CONFIG = {
    "email_to": Config.EMAIL_TO,          # Destinataire des alertes
    "email_from": Config.EMAIL_FROM,      # Expéditeur
    "smtp_host": Config.SMTP_HOST,        # smtp.gmail.com
    "smtp_port": Config.SMTP_PORT,        # 587
    "smtp_password": Config.EMAIL_PASS,   # Mot de passe
}


# ============================================================================
# 🔧 FONCTIONS INTERNES DE CHARGEMENT/SAUVEGARDE
# ============================================================================

def _load_config():
    """
    Charge la configuration générale depuis le fichier JSON.
    
    📤 SORTIE: Dictionnaire de configuration
    🔄 COMPORTEMENT:
        - Si le fichier existe → le charge
        - Si erreur de lecture → retourne DEFAULT_CONFIG
        - Si fichier inexistant → retourne DEFAULT_CONFIG
    """
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return DEFAULT_CONFIG.copy()
    return DEFAULT_CONFIG.copy()


def _save_config(config):
    """
    Sauvegarde la configuration générale dans le fichier JSON.
    
    📥 ENTRÉE: Dictionnaire de configuration à sauvegarder
    🔄 EFFET: Écriture dans config_dynamic.json (format JSON indenté)
    """
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"❌ Erreur sauvegarde config: {e}")


def _load_email_config():
    """
    Charge la configuration email depuis le fichier JSON.
    
    📤 SORTIE: Dictionnaire de configuration email
    🔄 COMPORTEMENT:
        - Si le fichier existe → le charge
        - Si erreur de lecture → retourne DEFAULT_EMAIL_CONFIG
        - Si fichier inexistant → retourne DEFAULT_EMAIL_CONFIG
    """
    if EMAIL_CONFIG_FILE.exists():
        try:
            with open(EMAIL_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return DEFAULT_EMAIL_CONFIG.copy()
    return DEFAULT_EMAIL_CONFIG.copy()


def _save_email_config(config):
    """
    Sauvegarde la configuration email dans le fichier JSON.
    
    📥 ENTRÉE: Dictionnaire de configuration email à sauvegarder
    🔄 EFFET: Écriture dans email_config.json (format JSON indenté)
    """
    try:
        with open(EMAIL_CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"❌ Erreur sauvegarde email config: {e}")


# ============================================================================
# 🚀 CHARGEMENT INITIAL DES CONFIGURATIONS
# ============================================================================
# Les configurations sont chargées une fois au démarrage du module
# et stockées dans des variables globales en mémoire.
_dynamic_config = _load_config()
_email_config = _load_email_config()


# ============================================================================
# 📤 FONCTIONS D'ACCÈS À LA CONFIGURATION GÉNÉRALE
# ============================================================================

def get_config():
    """
    Retourne la configuration dynamique générale.
    
    📤 SORTIE: Dictionnaire contenant la configuration actuelle
               (seuils, rétention, coordonnées GPS, paramètres panneaux)
    
    💡 UTILISATION:
        config = get_config()
        warning = config.get("seuil_warning", 30)
        lat = config.get("latitude")
    """
    return _dynamic_config


def update_config(new_config):
    """
    Met à jour la configuration dynamique et la sauvegarde immédiatement.
    
    📥 ENTRÉE: new_config - Dictionnaire des champs à mettre à jour
    📤 SORTIE: Configuration après mise à jour
    
    🔄 EFFET:
        - Fusionne new_config avec la configuration existante
        - Sauvegarde immédiate dans config_dynamic.json
        - La modification est persistante
    
    💡 UTILISATION:
        update_config({"seuil_warning": 25, "retention_days": 5})
    """
    global _dynamic_config
    _dynamic_config.update(new_config)
    _save_config(_dynamic_config)  # ← Persistance immédiate !
    return _dynamic_config


# ============================================================================
# 📧 FONCTIONS D'ACCÈS À LA CONFIGURATION EMAIL
# ============================================================================

def get_email_config():
    """
    Retourne la configuration email (SANS le mot de passe pour la réponse API).
    
    📤 SORTIE: Dictionnaire contenant:
        - email_to      : Destinataire
        - email_from    : Expéditeur
        - smtp_host     : Serveur SMTP
        - smtp_port     : Port SMTP
        - has_password  : Booléen (true si mot de passe configuré)
    
    🔒 SÉCURITÉ: Le mot de passe est EXCLU de la réponse pour
                  ne pas l'exposer via l'API.
    """
    return {
        "email_to": _email_config.get("email_to", Config.EMAIL_TO),
        "email_from": _email_config.get("email_from", Config.EMAIL_FROM),
        "smtp_host": _email_config.get("smtp_host", Config.SMTP_HOST),
        "smtp_port": _email_config.get("smtp_port", Config.SMTP_PORT),
        "has_password": bool(_email_config.get("smtp_password")),
    }


def update_email_config(new_config):
    """
    Met à jour la configuration email et la sauvegarde immédiatement.
    
    📥 ENTRÉE: new_config - Dictionnaire des champs à mettre à jour
               (email_to, email_from, smtp_host, smtp_port, smtp_password)
    
    📤 SORTIE: Configuration email mise à jour (sans mot de passe)
    
    🔄 EFFET:
        - Met à jour les champs spécifiés
        - Sauvegarde immédiate dans email_config.json
        - La modification est persistante
    
    🔒 SÉCURITÉ: Le mot de passe est stocké mais caché dans les réponses API
    
    💡 UTILISATION:
        update_email_config({
            "email_to": "admin@example.com",
            "smtp_password": "nouveau_mot_de_passe"
        })
    """
    global _email_config
    # Mettre à jour uniquement les champs fournis
    for key in ["email_to", "email_from", "smtp_host", "smtp_port", "smtp_password"]:
        if key in new_config:
            _email_config[key] = new_config[key]
    _save_email_config(_email_config)  # ← Persistance immédiate !
    return get_email_config()