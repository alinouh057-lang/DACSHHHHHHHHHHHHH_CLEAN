# ============================================================================
# FICHIER: auth.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier gère l'authentification JWT (JSON Web Tokens) pour le système
#   PV Monitor. Il permet de créer et vérifier des tokens pour:
#   - Les devices ESP32 (envoi de données)
#   - Les utilisateurs humains (connexion via interface web)
#
# 🔐 FONCTIONNALITÉS PRINCIPALES:
#   1. create_token()          : Crée un token JWT pour un device ESP32
#   2. verify_token()          : Vérifie un token (OBLIGATOIRE - 401 si absent)
#   3. optional_verify_token() : Vérifie un token (OPTIONNEL - None si absent)
#   4. hash_password()         : Hash un mot de passe avec bcrypt
#   5. verify_password()       : Vérifie un mot de passe contre son hash
#
# 📦 STRUCTURE D'UN TOKEN DEVICE:
#   {
#     "device_id": "esp2",           # Identifiant unique du device
#     "exp": 1745823600,             # Expiration (30 jours)
#     "iat": 1743231600              # Date de création
#   }
#
# 🛡️ SÉCURITÉ:
#   - Clé secrète via variable d'environnement JWT_SECRET_KEY
#   - Algorithme HS256 (HMAC-SHA256)
#   - Tokens devices expirent après 30 jours
#   - Gestion des erreurs: token expiré, token invalide
#
# 🔄 TYPES DE VÉRIFICATION:
#   - verify_token()         : Endpoints protégés (ex: /ingest, /delete-device)
#   - optional_verify_token(): Endpoints publics mais avec options (ex: /history)
#
# ============================================================================

import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement depuis .env
load_dotenv()

# ============================================================================
# 📦 CONFIGURATION JWT
# ============================================================================
# Clé secrète pour signer les tokens (à changer en production !)
# Utilise JWT_SECRET_KEY du .env, ou une valeur par défaut (non sécurisée)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "votre-cle-secrete-tres-longue-et-securisee-a-changer-en-production")

# Algorithme de signature (HS256 = HMAC-SHA256)
ALGORITHM = "HS256"

# Durée de validité des tokens devices (30 jours)
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Schéma d'authentification Bearer pour FastAPI
# Force l'utilisation du header "Authorization: Bearer <token>"
security = HTTPBearer()


# ============================================================================
# 🔑 CRÉATION D'UN TOKEN JWT
# ============================================================================

def create_token(device_id: str) -> str:
    """
    Crée un token JWT pour un device ESP32.
    
    📥 ENTRÉE:
        device_id: Identifiant unique du device (ex: "esp2", "dashboard")
    
    📤 SORTIE:
        str: Token JWT encodé (ex: "eyJhbGciOiJIUzI1NiIs...")
    
    🧮 STRUCTURE DU PAYLOAD:
        - device_id: Identifiant du device
        - exp: Date d'expiration (30 jours)
        - iat: Date de création (issued at)
    
    💡 CAS SPÉCIAL:
        Le device "dashboard" est utilisé par le frontend pour les requêtes
        authentifiées (récupération historique, stats, etc.)
    
    🔐 SÉCURITÉ:
        Le token contient des informations d'expiration pour limiter sa validité.
        Après 30 jours, le device doit demander un nouveau token.
    """
    payload = {
        "device_id": device_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================================
# ✅ VÉRIFICATION OBLIGATOIRE (ENDPOINTS PROTÉGÉS)
# ============================================================================

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Vérifie et décode un token JWT (authentification OBLIGATOIRE).
    
    📥 ENTRÉE:
        credentials: Injecté automatiquement par FastAPI à partir du header
                     "Authorization: Bearer <token>"
    
    📤 SORTIE:
        dict: Payload décodé du token (ex: {"device_id": "esp2", "exp": ...})
    
    🚨 EXCEPTIONS:
        - 401: Token expiré (ExpiredSignatureError)
        - 401: Token invalide (InvalidTokenError)
    
    🔒 UTILISATION:
        Utilisé pour les endpoints qui REQUIÈRENT une authentification:
        - POST /api/v1/ingest (ingestion des données ESP32)
        - DELETE /api/v1/devices/{id} (suppression device)
        - POST /api/v1/admin/email-config (configuration email)
    
    💡 NOTE:
        Déclenche une erreur HTTP 401 si le token est absent, expiré ou invalide.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )


# ============================================================================
# 🔐 FONCTIONS DE HASH POUR MOTS DE PASSE
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash un mot de passe avec bcrypt (sel automatique).
    
    📥 ENTRÉE:
        password: Mot de passe en clair (ex: "MonSuperPassword123")
    
    📤 SORTIE:
        str: Hash bcrypt encodé en UTF-8 (ex: "$2b$12$...")
    
    🔐 SÉCURITÉ:
        - Génération automatique d'un sel aléatoire
        - Algorithme bcrypt résistant aux attaques par force brute
        - Le sel est inclus dans le hash (pas besoin de stockage séparé)
    
    💡 UTILISATION:
        hash = hash_password("Test1234")
        # $2b$12$KxVkXqZqYxQvXqZqYxQvXqZqYxQvXq
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """
    Vérifie un mot de passe contre son hash bcrypt.
    
    📥 ENTRÉE:
        password: Mot de passe en clair saisi par l'utilisateur
        hashed: Hash bcrypt stocké en base de données
    
    📤 SORTIE:
        bool: True si le mot de passe correspond, False sinon
    
    💡 UTILISATION:
        if verify_password(login_password, user["password"]):
            # Mot de passe correct
            login_user()
        else:
            # Mot de passe incorrect
            return error
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


# ============================================================================
# 🔍 VÉRIFICATION OPTIONNELLE (ENDPOINTS PUBLICS)
# ============================================================================

async def optional_verify_token(request: Request) -> dict | None:
    """
    Vérifie le token s'il est présent, sinon retourne None (authentification OPTIONNELLE).
    
    📥 ENTRÉE:
        request: Requête HTTP FastAPI (pour lire le header Authorization)
    
    📤 SORTIE:
        dict | None: Payload décodé si token valide, None sinon
    
    🔓 UTILISATION:
        Utilisé pour les endpoints qui ACCEPTENT à la fois:
        - Des requêtes authentifiées (avec token) → retourne le payload
        - Des requêtes anonymes (sans token) → retourne None
    
    📝 EXEMPLES D'ENDPOINTS:
        - GET /api/v1/history  (peut être consulté sans login)
        - GET /api/v1/latest   (données publiques)
        - GET /api/v1/stats     (statistiques publiques)
    
    🔄 COMPORTEMENT:
        - Si pas de header Authorization → retourne None
        - Si token invalide (expiré, mal formé) → retourne None
        - Si token valide → retourne le payload décodé
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        # En cas d'erreur (token invalide, expiré, etc.), on retourne None
        # plutôt que de bloquer la requête
        return None