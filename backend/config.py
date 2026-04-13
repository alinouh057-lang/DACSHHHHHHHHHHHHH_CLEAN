# ============================================================================
# FICHIER: config.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient la configuration statique de l'application PV Monitor.
#   Il lit les variables d'environnement depuis le fichier .env et fournit
#   des valeurs par défaut sécurisées pour tous les paramètres.
#
# 🏗️ ARCHITECTURE:
#   - Classe Config avec attributs de classe (tous statiques)
#   - Valeurs lues depuis os.getenv() avec fallbacks
#   - Pas d'instance nécessaire (Config.MONGO_URI directement)
#
# 📋 TYPES DE CONFIGURATION:
#   1. MONGODB     - URI et nom de base de données
#   2. IA          - Chemins des modèles et classes d'ensablement
#   3. ALERTES     - Seuils Warning/Critical
#   4. EMAIL       - SMTP, expéditeur, destinataire
#   5. COOLDOWNS   - Fréquence des alertes (minutes)
#   6. STOCKAGE    - Dossier et nettoyage automatique
#
# 🔧 VARIABLES D'ENVIRONNEMENT UTILISÉES (.env):
#   - MONGO_URI              : mongodb+srv://user:pass@cluster...
#   - DB_NAME                : pv_monitor
#   - SEUIL_WARNING          : 30.0
#   - SEUIL_CRITICAL         : 60.0
#   - SMTP_HOST              : smtp.gmail.com
#   - SMTP_PORT              : 587
#   - ALERT_EMAIL_FROM       : alertes@example.com
#   - ALERT_EMAIL_PASS       : mot_de_passe
#   - ALERT_EMAIL_TO         : admin@example.com
#   - COOLDOWN_WARNING       : 30
#   - COOLDOWN_CRITICAL      : 15
#   - CHECK_INTERVAL         : 60
#   - IMAGE_RETENTION_DAYS   : 7
#   - CLEANUP_INTERVAL_HOURS : 24
#
# 📦 UTILISATION TYPIQUE:
#   from config import Config
#   mongo_uri = Config.MONGO_URI
#   seuil = Config.SEUIL_WARNING
#
# ⚠️ NOTE IMPORTANTE:
#   Ce fichier contient la configuration STATIQUE (lue une fois au démarrage).
#   Pour la configuration DYNAMIQUE (modifiable sans redémarrage), voir
#   config_manager.py et config_dynamic.json.
#
# ============================================================================

"""
CONFIGURATION STATIQUE - PV MONITOR
====================================
Ce fichier centralise toutes les configurations de l'application
en lisant les variables d'environnement avec des valeurs par défaut.

RÔLE :
- Fournir une interface unique pour toutes les configurations
- Charger les variables depuis .env
- Définir des valeurs par défaut sécurisées
- Centraliser les constantes de l'application

TYPES DE CONFIGURATION :
- MongoDB : URI et nom de base
- IA : Chemins des modèles et classes
- Alertes : Seuils Warning/Critical
- Email : SMTP et destinataires
- Cooldowns : Fréquence des alertes
- Stockage : Dossier et nettoyage

UTILISATION :
from config import Config
mongo_uri = Config.MONGO_URI
seuil = Config.SEUIL_WARNING
"""

import os
from dotenv import load_dotenv

# Dossier de base du projet (backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Chargement des variables d'environnement depuis .env
load_dotenv()


# ============================================================================
# 📦 CLASSE DE CONFIGURATION STATIQUE
# ============================================================================

class Config:
    """
    Classe de configuration statique.
    Toutes les valeurs sont lues depuis les variables d'environnement
    avec des fallbacks sécurisés.
    
    💡 AVANTAGES:
        - Accès direct: Config.MONGO_URI (pas besoin d'instance)
        - Valeurs par défaut si .env non présent
        - Centralisation de toutes les constantes
    """
    
    # ==========================================================================
    # 🗄️ CONFIGURATION MONGODB
    # ==========================================================================
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    """URI de connexion MongoDB (défaut: localhost)"""
    
    DB_NAME = os.getenv("DB_NAME", "pv_monitor")
    """Nom de la base de données"""

    # ==========================================================================
    # 🤖 CONFIGURATION IA (INTELLIGENCE ARTIFICIELLE)
    # ==========================================================================
    MODEL_PATH = os.path.join(BASE_DIR, "models", "hybrid_model_3classes_best.pth")
    """Chemin absolu vers le modèle PyTorch (3 classes: Clean, Moderate, Critical)"""
    
    CLASSES = ['Clean', 'Moderate', 'Critical']
    """Noms des classes d'ensablement (3 classes)"""
    
    CLASS_VALUES = [0, 50, 100]
    """Valeurs numériques correspondant aux classes (0%, 50%, 100%)"""

    # ==========================================================================
    # ⚠️ SEUILS D'ALERTE (ENSABLEMENT)
    # ==========================================================================
    SEUIL_WARNING = float(os.getenv("SEUIL_WARNING", 30.0))
    """
    Seuil d'alerte Warning (%) - Recommandation de nettoyage.
    Si ensablement >= SEUIL_WARNING → alerte Warning.
    """
    
    SEUIL_CRITICAL = float(os.getenv("SEUIL_CRITICAL", 60.0))
    """
    Seuil d'alerte Critical (%) - Nettoyage urgent requis.
    Si ensablement >= SEUIL_CRITICAL → alerte Critical.
    """

    # ==========================================================================
    # 📧 CONFIGURATION EMAIL (ALERTES)
    # ==========================================================================
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    """Serveur SMTP (défaut: Gmail)"""
    
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    """Port SMTP (défaut: 587 pour STARTTLS)"""
    
    EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "")
    """Adresse email expéditrice (doit être Gmail pour le SMTP Gmail)"""
    
    EMAIL_PASS = os.getenv("ALERT_EMAIL_PASS", "")
    """Mot de passe d'application Gmail (ou mot de passe normal)"""
    
    EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "")
    """Destinataire des alertes (email où envoyer les notifications)"""

    # ==========================================================================
    # ⏱️ COOLDOWNS DES ALERTES (ANTI-SPAM)
    # ==========================================================================
    COOLDOWN_WARNING = int(os.getenv("COOLDOWN_WARNING", 30))
    """Temps minimum entre deux alertes Warning (minutes)"""
    
    COOLDOWN_CRITICAL = int(os.getenv("COOLDOWN_CRITICAL", 15))
    """Temps minimum entre deux alertes Critical (minutes)"""

    # ==========================================================================
    # 🔄 FRÉQUENCE DE VÉRIFICATION
    # ==========================================================================
    CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", 60))
    """Intervalle de vérification des alertes (secondes)"""

    # ==========================================================================
    # 📁 STOCKAGE DES IMAGES
    # ==========================================================================
    UPLOAD_DIR = "storage"
    """
    Dossier de stockage des images (relatif au projet backend/).
    Les images sont sauvegardées sous format: {device_id}_{timestamp}.jpg
    """

    # ==========================================================================
    # 🧹 NETTOYAGE AUTOMATIQUE
    # ==========================================================================
    IMAGE_RETENTION_DAYS = int(os.getenv("IMAGE_RETENTION_DAYS", 7))
    """
    Nombre de jours de conservation des images.
    Les images plus anciennes que cette valeur sont supprimées automatiquement.
    """
    
    CLEANUP_INTERVAL_HOURS = int(os.getenv("CLEANUP_INTERVAL_HOURS", 24))
    """
    Fréquence du nettoyage automatique (heures).
    Le nettoyeur s'exécute toutes les X heures pour supprimer les anciennes images.
    """


# ============================================================================
# 📝 NOTES SUR LES CHEMINS DE MODÈLE (COMMENTÉS)
# ============================================================================
# Les lignes suivantes sont des alternatives commentées pour d'autres versions
# du modèle IA. Elles sont conservées pour référence.

# Alternative 1: Modèle 5 classes (0%, 25%, 50%, 75%, 100%)
# MODEL_PATH = os.path.join(os.path.dirname(__file__), "hybrid_model.pth")
# CLASSES = ['0%', '25%', '50%', '75%', '100%']
# CLASS_VALUES = [0, 25, 50, 75, 100]