# ============================================================================
# FICHIER: constants.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier centralise TOUTES les constantes du projet PV Monitor.
#   Il évite la duplication de valeurs magiques dans le code et facilite
#   la maintenance (une seule modification pour changer une constante).
#
# 🏗️ ORGANISATION DES CONSTANTES:
#   1. PANNEAUX SOLAIRES   - Dimensions, rendement, puissance
#   2. ÉCONOMIQUES         - Coûts, prix de l'électricité
#   3. TEMPORELLES         - Secondes, minutes, heures, jours
#   4. AUTHENTIFICATION    - JWT, codes de vérification
#   5. NETTOYAGE           - Rétention images, intervalle
#   6. ALERTES             - Cooldowns, seuils température
#   7. API & RÉSEAU        - Ports, timeouts
#   8. BASE DE DONNÉES     - Noms des collections
#   9. IA                  - Modèle, cache, classes
#   10. AFFICHAGE          - Codes couleurs
#
# 💡 COMMENT UTILISER:
#   from utils.constants import DEFAULT_PANEL_AREA_M2, SECONDS_PER_HOUR
#   surface = DEFAULT_PANEL_AREA_M2  # 1.6
#
# 🔧 FONCTIONS UTILITAIRES:
#   - get_constant(name, default)  : Récupère une constante par son nom
#   - get_all_constants()          : Retourne toutes les constantes en dict
#
# 🧪 TEST:
#   Exécuter directement: python constants.py
#   Affiche toutes les constantes pour vérification
#
# ============================================================================

"""
Fichier centralisé des constantes du projet
Centralise toutes les valeurs constantes pour faciliter la maintenance
"""


# ============================================================================
# 📊 CONSTANTES DES PANNEAUX SOLAIRES
# ============================================================================
# Ces valeurs sont utilisées pour les calculs de puissance théorique,
# de performance ratio et d'analyse d'ensablement.

DEFAULT_PANEL_AREA_M2 = 1.6          # Surface standard d'un panneau (m²)
DEFAULT_PANEL_EFFICIENCY = 0.20      # Rendement standard (20%)
DEFAULT_PANEL_CAPACITY_KW = 3.0      # Puissance crête standard (kWc)
DEFAULT_PANEL_TYPE = "monocristallin"  # Type de panneau par défaut

# Paramètres d'installation (inclinaison, orientation, dégradation)
DEFAULT_TILT_ANGLE = 30              # Inclinaison standard (degrés)
DEFAULT_AZIMUTH = 180                # Orientation standard (Sud)
DEFAULT_DEGRADATION_RATE = 0.5       # Dégradation annuelle (%/an)


# ============================================================================
# 💰 CONSTANTES ÉCONOMIQUES
# ============================================================================
# Utilisées pour calculer le ROI du nettoyage et les pertes financières.
# Toutes les valeurs sont en Dinars Tunisiens (DT).

DEFAULT_CLEANING_COST = 50           # Coût standard d'un nettoyage (DT)
ENERGY_PRICE_DT_PER_KWH = 0.15       # Prix du kWh (DT)


# ============================================================================
# ⏱️ CONSTANTES TEMPORELLES
# ============================================================================
# Conversions de temps pour les calculs de périodes,
# les timeouts et les intervalles.

# Secondes
SECONDS_PER_MINUTE = 60
SECONDS_PER_HOUR = 3600
SECONDS_PER_DAY = 86400

# Minutes
MINUTES_PER_HOUR = 60
MINUTES_PER_DAY = 1440

# Heures
HOURS_PER_DAY = 24
SUN_HOURS_PER_DAY = 8                # Heures d'ensoleillement effectives par jour

# Jours
DAYS_PER_WEEK = 7
DAYS_PER_MONTH = 30                  # Approximation (30 jours)
DAYS_PER_YEAR = 365


# ============================================================================
# 🔐 CONSTANTES D'AUTHENTIFICATION
# ============================================================================
# Configuration des tokens JWT pour les devices ESP32 et les utilisateurs,
# ainsi que pour les codes de vérification email.

# Tokens JWT
JWT_ALGORITHM = "HS256"              # Algorithme de signature
JWT_DEVICE_TOKEN_DAYS = 30           # Durée token device (jours)
JWT_USER_TOKEN_HOURS = 168           # Durée token user (heures = 7 jours)
JWT_USER_TOKEN_SECONDS = 604800      # Durée token user (secondes = 7 jours)

# Codes de vérification email
VERIFICATION_CODE_LENGTH = 6         # Longueur du code (chiffres)
VERIFICATION_CODE_EXPIRY_MINUTES = 10
RESET_TOKEN_EXPIRY_MINUTES = 30
MAX_VERIFICATION_ATTEMPTS = 5        # Anti-brute force


# ============================================================================
# 🧹 CONSTANTES DE NETTOYAGE AUTOMATIQUE
# ============================================================================
# Gestion du nettoyage des anciennes images et des seuils d'alerte.

# Nettoyage automatique
DEFAULT_RETENTION_DAYS = 7           # Jours de conservation des images
DEFAULT_CLEANUP_INTERVAL_HOURS = 24  # Intervalle de nettoyage (heures)

# Seuils d'alerte (valeurs par défaut)
DEFAULT_WARNING_THRESHOLD = 30       # Seuil warning (%)
DEFAULT_CRITICAL_THRESHOLD = 60      # Seuil critical (%)


# ============================================================================
# 🚨 CONSTANTES D'ALERTES
# ============================================================================
# Configuration des alertes: cooldowns pour éviter les spam,
# seuils de température, délai de heartbeat.

# Cooldowns (en minutes) - évite les alertes en rafale
DEFAULT_COOLDOWN_WARNING = 30        # Cooldown alerte warning
DEFAULT_COOLDOWN_CRITICAL = 15       # Cooldown alerte critical
DEFAULT_CHECK_INTERVAL_SECONDS = 60  # Intervalle vérification alertes

# Seuils de température
HIGH_TEMPERATURE_WARNING = 65        # °C (alerte warning)
HIGH_TEMPERATURE_CRITICAL = 80       # °C (alerte critique)

# Heartbeat - détection des devices hors ligne
HEARTBEAT_TIMEOUT_SECONDS = 65       # Délai avant considérer device offline


# ============================================================================
# 📡 CONSTANTES API ET RÉSEAU
# ============================================================================
# Configuration réseau du backend et frontend.

# Backend
DEFAULT_BACKEND_PORT = 8000
DEFAULT_BACKEND_HOST = "0.0.0.0"

# Frontend
DEFAULT_FRONTEND_PORT = 3000
DEFAULT_FRONTEND_URL = "http://localhost:3000"

# Timeouts (secondes) - pour les requêtes HTTP
DEFAULT_REQUEST_TIMEOUT = 30
DEFAULT_HEARTBEAT_TIMEOUT = 10
DEFAULT_INGEST_TIMEOUT = 20


# ============================================================================
# 🗄️ CONSTANTES BASE DE DONNÉES
# ============================================================================
# Noms des collections MongoDB pour faciliter les accès.

# Collections
COLLECTION_SURVEILLANCE = "surveillance"   # Mesures et analyses IA
COLLECTION_DEVICES = "devices"             # ESP32 enregistrés
COLLECTION_USERS = "users"                 # Utilisateurs
COLLECTION_ALERTS = "alerts"               # Alertes système
COLLECTION_INTERVENTIONS = "interventions" # Maintenance effectuée
COLLECTION_PANEL_CONFIG = "panel_config"   # Configuration des panneaux

# Pagination - limites par défaut pour les requêtes API
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 1000


# ============================================================================
# 🤖 CONSTANTES IA (INTELLIGENCE ARTIFICIELLE)
# ============================================================================
# Configuration du modèle de détection d'ensablement.

# Modèle
DEFAULT_MODEL_VERSION = "Hybrid_v1"          # Version du modèle
DEFAULT_CACHE_SIZE = 100                     # Taille max du cache (images)
DEFAULT_CACHE_TTL_SECONDS = 3600             # 1 heure avant expiration

# Classes d'ensablement (5 classes - version originale)
SOILING_CLASSES_5 = ['0%', '25%', '50%', '75%', '100%']
SOILING_VALUES_5 = [0, 25, 50, 75, 100]

# Classes d'ensablement (3 classes - version actuelle)
SOILING_CLASSES_3 = ['Clean', 'Warning', 'Critical']
SOILING_VALUES_3 = [0, 50, 100]

# Seuils pour les statuts (utilisés pour convertir pourcentage → statut)
CLEAN_MAX_PERCENT = 30      # <30% → Clean
WARNING_MAX_PERCENT = 60    # 30-60% → Warning, >60% → Critical


# ============================================================================
# 🎨 CONSTANTES D'AFFICHAGE (COULEURS)
# ============================================================================
# Codes couleurs hexadécimaux pour l'interface frontend.
# Utilisés pour les statuts, alertes, graphiques.

COLOR_CLEAN = "#1a7f4f"      # Vert - Panneau propre
COLOR_WARNING = "#c47d0e"    # Orange - Alerte modérée
COLOR_CRITICAL = "#c0392b"   # Rouge - Alerte critique
COLOR_INFO = "#1565c0"       # Bleu - Information
COLOR_SUCCESS = "#22c55e"    # Vert clair - Succès
COLOR_ERROR = "#ef4444"      # Rouge clair - Erreur


# ============================================================================
# 🔧 FONCTIONS UTILITAIRES POUR LES CONSTANTES
# ============================================================================

def get_constant(name: str, default=None):
    """
    Récupère une constante par son nom (utile pour la configuration dynamique).
    
    📥 ENTRÉE:
        name: Nom de la constante (ex: "DEFAULT_PANEL_AREA_M2")
        default: Valeur par défaut si la constante n'existe pas
    
    📤 SORTIE:
        Valeur de la constante ou la valeur par défaut
    
    💡 EXEMPLE:
        surface = get_constant("DEFAULT_PANEL_AREA_M2", 1.6)
    """
    import sys
    module = sys.modules[__name__]
    return getattr(module, name, default)


def get_all_constants() -> dict:
    """
    Retourne toutes les constantes (sauf les fonctions et modules).
    
    📤 SORTIE:
        dict: Dictionnaire des constantes {nom: valeur}
    
    💡 UTILISATION:
        Toutes les constantes = get_all_constants()
        for name, value in constants.items():
            print(f"{name} = {value}")
    """
    import sys
    module = sys.modules[__name__]
    
    return {
        name: value
        for name, value in module.__dict__.items()
        if not name.startswith("_")          # Exclure les attributs privés
        and not callable(value)              # Exclure les fonctions
        and not isinstance(value, type(sys)) # Exclure les modules
    }


# ============================================================================
# 🧪 TEST DU MODULE (exécution directe)
# ============================================================================

if __name__ == "__main__":
    # Affiche toutes les constantes pour vérification
    print("="*60)
    print("📋 CONSTANTES DU PROJET")
    print("="*60)
    
    constants = get_all_constants()
    for name, value in sorted(constants.items()):
        if isinstance(value, (int, float, str)):
            print(f"   {name}: {value}")
    
    print("\n" + "="*60)
    print(f"✅ {len(constants)} constantes chargées")