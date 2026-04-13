# ============================================================================
# FICHIER: validators.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier centralise TOUTES les fonctions de validation du projet.
#   Il évite la duplication de code de validation et garantit une
#   cohérence dans les vérifications des données entrantes.
#
# 🛡️ VALIDATIONS DISPONIBLES:
#   1. EMAIL          - Format, présence @, domaine valide
#   2. MOT DE PASSE   - Longueur, majuscule, chiffre
#   3. DEVICE ID      - Caractères autorisés, longueur
#   4. COORDONNÉES    - Plages latitude/longitude
#   5. TENSION/COURANT- Valeurs positives, plages réalistes
#   6. TEMPÉRATURE    - Plage réaliste (-40°C à 100°C)
#   7. ENSABLEMENT    - Pourcentage 0-100%
#   8. IRRADIANCE     - W/m², positif, max 1500
#   9. TIMESTAMP      - Format ISO valide
#   10. PÉRIODE       - day/week/month/year
#   11. LIMITE        - Pagination, valeurs positives
#   12. RÔLE          - admin/user/viewer
#   13. STATUT        - active/maintenance/offline/error
#
# 🧹 FONCTIONS DE NETTOYAGE (SANITIZE):
#   - sanitize_device_id() : Nettoie les device IDs
#   - normalize_email()    : Normalise les emails (minuscules, sans espaces)
#
# 🔄 UTILISATION DANS LE PROJET:
#   - routers/auth_routes.py   (validation email, password)
#   - routers/devices.py       (validation device_id)
#   - routers/ingest.py        (validation des données entrantes)
#   - routers/admin.py         (validation rôle, status)
#
# 💡 FORMAT DE RETOUR (la plupart des fonctions):
#   Tuple[bool, Optional[str]]
#   - (True, None)        → Validation réussie
#   - (False, "message")  → Validation échouée avec message d'erreur
#
# ============================================================================

"""
Fonctions de validation réutilisables
Centralise les validations pour éviter la duplication de code
"""

import re
from typing import Optional, Tuple, Any
from datetime import datetime, timezone


# ============================================================================
# 📧 VALIDATION EMAIL
# ============================================================================

def validate_email(email: str) -> bool:
    """
    Valide le format d'une adresse email.
    
    📥 ENTRÉE:
        email: Adresse email à valider (string)
    
    📤 SORTIE:
        bool: True si l'email est valide, False sinon
    
    🔍 CRITÈRES:
        - Format local@domaine.extension
        - Caractères autorisés: lettres, chiffres, ., _, %, +, -, 
        - Domaine avec au moins un point
        - Extension d'au moins 2 caractères
    
    💡 EXEMPLE:
        validate_email("user@example.com") → True
        validate_email("invalid") → False
    """
    if not email or not isinstance(email, str):
        return False
    
    # Regex standard pour validation email (RFC 5322 simplifié)
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip().lower()))


# ============================================================================
# 🔐 VALIDATION MOT DE PASSE
# ============================================================================

def validate_password(password: str, min_length: int = 8) -> Tuple[bool, Optional[str]]:
    """
    Valide un mot de passe selon des critères de sécurité.
    
    📥 ENTRÉE:
        password: Mot de passe à valider
        min_length: Longueur minimale requise (défaut: 8)
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Non vide
        - Longueur minimale (8 caractères par défaut)
        - Au moins une majuscule
        - Au moins un chiffre
    
    💡 EXEMPLE:
        validate_password("Test1234") → (True, None)
        validate_password("weak") → (False, "Le mot de passe doit contenir...")
    """
    if not password:
        return False, "Le mot de passe est requis"
    
    if len(password) < min_length:
        return False, f"Le mot de passe doit contenir au moins {min_length} caractères"
    
    # Vérifier au moins une majuscule
    if not any(c.isupper() for c in password):
        return False, "Le mot de passe doit contenir au moins une majuscule"
    
    # Vérifier au moins un chiffre
    if not any(c.isdigit() for c in password):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    
    return True, None


# ============================================================================
# 📱 VALIDATION DEVICE ID
# ============================================================================

def validate_device_id(device_id: str) -> Tuple[bool, Optional[str]]:
    """
    Valide un identifiant de device ESP32.
    
    📥 ENTRÉE:
        device_id: ID du device à valider
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Non vide
        - Longueur entre 1 et 50 caractères
        - Caractères autorisés: lettres, chiffres, underscore (_), tiret (-)
    
    💡 EXEMPLE:
        validate_device_id("esp32_test-01") → (True, None)
        validate_device_id("esp@32") → (False, "L'identifiant ne peut contenir...")
    """
    if not device_id or not isinstance(device_id, str):
        return False, "L'identifiant du device est requis"
    
    device_id = device_id.strip()
    
    if len(device_id) < 1 or len(device_id) > 50:
        return False, "L'identifiant doit contenir entre 1 et 50 caractères"
    
    # Caractères autorisés: lettres, chiffres, underscore, tiret
    if not re.match(r'^[a-zA-Z0-9_-]+$', device_id):
        return False, "L'identifiant ne peut contenir que des lettres, chiffres, _ et -"
    
    return True, None


# ============================================================================
# 📍 VALIDATION COORDONNÉES GPS
# ============================================================================

def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> Tuple[bool, Optional[str]]:
    """
    Valide des coordonnées GPS.
    
    📥 ENTRÉE:
        latitude: Latitude (degrés, -90 à 90)
        longitude: Longitude (degrés, -180 à 180)
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    📊 PLAGES VALIDES:
        - Latitude: -90° à +90° (S à N)
        - Longitude: -180° à +180° (O à E)
    
    💡 EXEMPLE:
        validate_coordinates(36.8065, 10.1815) → (True, None)  # Tunis
        validate_coordinates(100, 200) → (False, "Latitude doit être entre -90 et 90")
    """
    if latitude is None or longitude is None:
        return True, None  # Optionnel, pas d'erreur
    
    if not isinstance(latitude, (int, float)):
        return False, "La latitude doit être un nombre"
    
    if not isinstance(longitude, (int, float)):
        return False, "La longitude doit être un nombre"
    
    if latitude < -90 or latitude > 90:
        return False, "La latitude doit être comprise entre -90 et 90"
    
    if longitude < -180 or longitude > 180:
        return False, "La longitude doit être comprise entre -180 et 180"
    
    return True, None


# ============================================================================
# ⚡ VALIDATION TENSION / COURANT
# ============================================================================

def validate_power_values(voltage: float, current: float) -> Tuple[bool, Optional[str]]:
    """
    Valide les valeurs de tension et courant.
    
    📥 ENTRÉE:
        voltage: Tension en Volts
        current: Courant en Ampères
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Valeurs non négatives
        - Tension < 100V (panneau solaire typique: 12-48V)
        - Courant < 50A (panneau solaire typique: 5-15A)
    
    💡 EXEMPLE:
        validate_power_values(24.5, 8.2) → (True, None)
        validate_power_values(120, 10) → (False, "Tension anormalement élevée")
    """
    if voltage is None or current is None:
        return True, None  # Optionnel
    
    if voltage < 0:
        return False, "La tension ne peut pas être négative"
    
    if current < 0:
        return False, "Le courant ne peut pas être négatif"
    
    if voltage > 100:
        return False, "La tension semble anormalement élevée (> 100V)"
    
    if current > 50:
        return False, "Le courant semble anormalement élevé (> 50A)"
    
    return True, None


# ============================================================================
# 🌡️ VALIDATION TEMPÉRATURE
# ============================================================================

def validate_temperature(temperature: Optional[float]) -> Tuple[bool, Optional[str]]:
    """
    Valide une température en degrés Celsius.
    
    📥 ENTRÉE:
        temperature: Température en °C
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Entre -40°C et +100°C (plage réaliste pour panneaux solaires)
        - Les valeurs None sont acceptées (optionnel)
    
    💡 EXEMPLE:
        validate_temperature(45.5) → (True, None)
        validate_temperature(150) → (False, "Température anormale")
    """
    if temperature is None:
        return True, None
    
    if not isinstance(temperature, (int, float)):
        return False, "La température doit être un nombre"
    
    if temperature < -40 or temperature > 100:
        return False, "La température semble anormale (doit être entre -40°C et 100°C)"
    
    return True, None


# ============================================================================
# 🧹 VALIDATION ENSABLEMENT
# ============================================================================

def validate_soiling_level(soiling: float) -> Tuple[bool, Optional[str]]:
    """
    Valide un niveau d'ensablement.
    
    📥 ENTRÉE:
        soiling: Niveau d'ensablement (%)
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Entre 0% et 100%
        - Valeur numérique
    
    💡 EXEMPLE:
        validate_soiling_level(45.2) → (True, None)
        validate_soiling_level(120) → (False, "Doit être entre 0 et 100%")
    """
    if soiling is None:
        return False, "Le niveau d'ensablement est requis"
    
    if not isinstance(soiling, (int, float)):
        return False, "Le niveau d'ensablement doit être un nombre"
    
    if soiling < 0 or soiling > 100:
        return False, "Le niveau d'ensablement doit être compris entre 0 et 100%"
    
    return True, None


# ============================================================================
# 🌞 VALIDATION IRRADIANCE
# ============================================================================

def validate_irradiance(irradiance: float) -> Tuple[bool, Optional[str]]:
    """
    Valide une valeur d'irradiance solaire.
    
    📥 ENTRÉE:
        irradiance: Irradiance en W/m²
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Valeur non négative
        - Inférieure à 1500 W/m² (constante solaire maximale)
    
    💡 EXEMPLE:
        validate_irradiance(850.5) → (True, None)
        validate_irradiance(-10) → (False, "Ne peut pas être négative")
    """
    if irradiance is None:
        return True, None
    
    if not isinstance(irradiance, (int, float)):
        return False, "L'irradiance doit être un nombre"
    
    if irradiance < 0:
        return False, "L'irradiance ne peut pas être négative"
    
    if irradiance > 1500:
        return False, "L'irradiance semble anormalement élevée (> 1500 W/m²)"
    
    return True, None


# ============================================================================
# 🕐 VALIDATION TIMESTAMP
# ============================================================================

def validate_timestamp(timestamp: Any) -> Tuple[bool, Optional[str]]:
    """
    Valide un timestamp (datetime ou chaîne ISO).
    
    📥 ENTRÉE:
        timestamp: Timestamp à valider (datetime, string ISO, ou None)
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - None est accepté (optionnel)
        - Objet datetime valide
        - Chaîne ISO 8601 valide (ex: "2026-04-11T15:30:00Z")
    
    💡 EXEMPLE:
        validate_timestamp(datetime.now()) → (True, None)
        validate_timestamp("2026-04-11T15:30:00Z") → (True, None)
        validate_timestamp("invalid") → (False, "Format invalide")
    """
    if timestamp is None:
        return True, None
    
    if isinstance(timestamp, datetime):
        return True, None
    
    if isinstance(timestamp, str):
        try:
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return True, None
        except ValueError:
            return False, "Format de timestamp invalide"
    
    return False, "Le timestamp doit être une date ou une chaîne ISO"


# ============================================================================
# 📅 VALIDATION PÉRIODE
# ============================================================================

def validate_period(period: str) -> Tuple[bool, Optional[str]]:
    """
    Valide une période (day, week, month, year).
    
    📥 ENTRÉE:
        period: Période à valider
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    ✅ VALEURS ACCEPTÉES:
        - "day"   (jour)
        - "week"  (semaine)
        - "month" (mois)
        - "year"  (année)
    
    💡 EXEMPLE:
        validate_period("month") → (True, None)
        validate_period("decade") → (False, "La période doit être parmi: day, week...")
    """
    valid_periods = ["day", "week", "month", "year"]
    
    if not period:
        return False, "La période est requise"
    
    if period not in valid_periods:
        return False, f"La période doit être parmi: {', '.join(valid_periods)}"
    
    return True, None


# ============================================================================
# 📄 VALIDATION LIMITE (PAGINATION)
# ============================================================================

def validate_limit(limit: int, max_limit: int = 1000) -> Tuple[bool, Optional[str]]:
    """
    Valide une limite de pagination.
    
    📥 ENTRÉE:
        limit: Nombre d'éléments maximum
        max_limit: Limite maximale autorisée (défaut: 1000)
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    🔍 CRITÈRES:
        - Entier positif ou nul
        - Ne dépasse pas max_limit
    
    💡 EXEMPLE:
        validate_limit(50) → (True, None)
        validate_limit(2000) → (False, "Ne peut pas dépasser 1000")
    """
    if limit is None:
        return True, None
    
    if not isinstance(limit, int):
        return False, "La limite doit être un nombre entier"
    
    if limit < 0:
        return False, "La limite ne peut pas être négative"
    
    if limit > max_limit:
        return False, f"La limite ne peut pas dépasser {max_limit}"
    
    return True, None


# ============================================================================
# 👤 VALIDATION RÔLE UTILISATEUR
# ============================================================================

def validate_role(role: str) -> Tuple[bool, Optional[str]]:
    """
    Valide un rôle utilisateur.
    
    📥 ENTRÉE:
        role: Rôle à valider
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    ✅ RÔLES VALIDES:
        - "admin"  : Administrateur (tous droits)
        - "user"   : Utilisateur standard
        - "viewer" : Lecture seule
    
    💡 EXEMPLE:
        validate_role("admin") → (True, None)
        validate_role("superuser") → (False, "Le rôle doit être parmi...")
    """
    valid_roles = ["admin", "user", "viewer"]
    
    if not role:
        return False, "Le rôle est requis"
    
    if role not in valid_roles:
        return False, f"Le rôle doit être parmi: {', '.join(valid_roles)}"
    
    return True, None


# ============================================================================
# 🔌 VALIDATION STATUT DE DEVICE
# ============================================================================

def validate_status(status: str) -> Tuple[bool, Optional[str]]:
    """
    Valide un statut de device ESP32.
    
    📥 ENTRÉE:
        status: Statut à valider
    
    📤 SORTIE:
        Tuple[bool, Optional[str]]: (est_valide, message_erreur)
    
    ✅ STATUTS VALIDES:
        - "active"      : Opérationnel
        - "maintenance" : En maintenance
        - "offline"     : Hors ligne
        - "error"       : En erreur
    
    💡 EXEMPLE:
        validate_status("active") → (True, None)
        validate_status("unknown") → (False, "Le statut doit être parmi...")
    """
    valid_statuses = ["active", "maintenance", "offline", "error"]
    
    if not status:
        return False, "Le statut est requis"
    
    if status not in valid_statuses:
        return False, f"Le statut doit être parmi: {', '.join(valid_statuses)}"
    
    return True, None


# ============================================================================
# 📥 VALIDATION COMPLÈTE POUR L'INGESTION
# ============================================================================

def validate_ingest_data(data: dict) -> Tuple[bool, list]:
    """
    Valide toutes les données d'ingestion en une seule fonction.
    
    📥 ENTRÉE:
        data: Dictionnaire contenant les données d'ingestion
              (device_id, voltage, current, temperature)
    
    📤 SORTIE:
        Tuple[bool, list]: (est_valide, liste_des_erreurs)
    
    💡 UTILISATION:
        est_valide, erreurs = validate_ingest_data(request_data)
        if not est_valide:
            raise HTTPException(400, detail=erreurs)
    
    📝 EXEMPLE:
        data = {"device_id": "esp2", "voltage": 24.5, "current": 8.2}
        valid, errors = validate_ingest_data(data) → (True, [])
    """
    errors = []
    
    # Device ID
    if "device_id" in data:
        valid, error = validate_device_id(data["device_id"])
        if not valid:
            errors.append(f"device_id: {error}")
    else:
        errors.append("device_id: requis")
    
    # Tension
    if "voltage" in data and data["voltage"] is not None:
        valid, error = validate_power_values(data["voltage"], 0)
        if not valid and "tension" in error:
            errors.append(f"voltage: {error}")
    
    # Courant
    if "current" in data and data["current"] is not None:
        valid, error = validate_power_values(0, data["current"])
        if not valid and "courant" in error:
            errors.append(f"current: {error}")
    
    # Température
    if "temperature" in data:
        valid, error = validate_temperature(data["temperature"])
        if not valid:
            errors.append(f"temperature: {error}")
    
    return len(errors) == 0, errors


# ============================================================================
# 🧹 FONCTIONS DE NETTOYAGE (SANITIZE)
# ============================================================================

def sanitize_device_id(device_id: str) -> str:
    """
    Nettoie et normalise un identifiant de device.
    
    📥 ENTRÉE:
        device_id: ID du device à nettoyer
    
    📤 SORTIE:
        str: ID nettoyé
    
    🔧 OPÉRATIONS:
        - Supprime les espaces au début et à la fin
        - Remplace les espaces par des underscores
        - Supprime les caractères non autorisés
        - Limite à 50 caractères
    
    💡 EXEMPLE:
        sanitize_device_id("  ESP 32 Test!  ") → "ESP_32_Test"
    """
    if not device_id:
        return ""
    
    # Supprimer les espaces au début et à la fin
    device_id = device_id.strip()
    
    # Remplacer les espaces par des underscores
    device_id = device_id.replace(" ", "_")
    
    # Supprimer les caractères non autorisés
    device_id = re.sub(r'[^a-zA-Z0-9_-]', '', device_id)
    
    # Limiter la longueur
    if len(device_id) > 50:
        device_id = device_id[:50]
    
    return device_id


def normalize_email(email: str) -> str:
    """
    Normalise une adresse email (minuscules, sans espaces).
    
    📥 ENTRÉE:
        email: Email à normaliser
    
    📤 SORTIE:
        str: Email normalisé
    
    🔧 OPÉRATIONS:
        - Supprime les espaces
        - Convertit en minuscules
    
    💡 EXEMPLE:
        normalize_email("  User@Example.COM  ") → "user@example.com"
    """
    if not email:
        return ""
    
    return email.strip().lower()


# ============================================================================
# 🧪 TEST DU MODULE (exécution directe)
# ============================================================================

if __name__ == "__main__":
    print("="*50)
    print("🧪 TEST DU MODULE VALIDATORS")
    print("="*50)
    
    # Test email
    print("\n📧 Test validation email:")
    print(f"   test@example.com: {validate_email('test@example.com')}")
    print(f"   invalid: {validate_email('invalid')}")
    
    # Test mot de passe
    print("\n🔐 Test validation mot de passe:")
    valid, error = validate_password("Test1234")
    print(f"   Test1234: valid={valid}, error={error}")
    valid, error = validate_password("weak")
    print(f"   weak: valid={valid}, error={error}")
    
    # Test device ID
    print("\n📱 Test validation device ID:")
    valid, error = validate_device_id("esp32_test-01")
    print(f"   esp32_test-01: valid={valid}, error={error}")
    valid, error = validate_device_id("esp@32")
    print(f"   esp@32: valid={valid}, error={error}")
    
    # Test coordonnées
    print("\n📍 Test validation coordonnées:")
    valid, error = validate_coordinates(36.8065, 10.1815)
    print(f"   36.8065, 10.1815: valid={valid}, error={error}")
    valid, error = validate_coordinates(100, 200)
    print(f"   100, 200: valid={valid}, error={error}")
    
    print("\n" + "="*50)
    print("✅ Tests terminés")