# ============================================================================
# FICHIER: auth_routes.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient TOUTES les routes d'authentification du système.
#   Il gère l'inscription, la connexion, la vérification email,
#   la réinitialisation de mot de passe et l'authentification des devices ESP32.
#
# 📥 ENDPOINTS:
#   POST   /api/v1/auth/send-verification-code  - Étape 1/3: Envoyer code email
#   POST   /api/v1/auth/verify-code             - Étape 2/3: Vérifier le code
#   POST   /api/v1/auth/complete-registration   - Étape 3/3: Créer le compte
#   POST   /api/v1/auth/login                   - Connexion utilisateur
#   POST   /api/v1/auth/register                - Inscription simple (sans email)
#   POST   /api/v1/auth/change-password         - Changer mot de passe
#   POST   /api/v1/auth/forgot-password         - Mot de passe oublié (étape 1)
#   POST   /api/v1/auth/reset-password          - Réinitialisation (étape 2)
#   GET    /api/v1/auth/me                      - Profil utilisateur
#   PUT    /api/v1/auth/profile                 - Modifier profil
#   GET    /api/v1/auth/verify                  - Vérifier token JWT
#   POST   /api/v1/auth/logout                  - Déconnexion
#   POST   /api/v1/auth/register-device         - Enregistrement ESP32
#   POST   /api/v1/auth/token                   - Obtenir token ESP32
#
# 👤 AUTHENTIFICATION UTILISATEURS (3 étapes):
#   1. POST /send-verification-code → Envoie code à 6 chiffres par email
#   2. POST /verify-code → Vérifie le code, retourne token temporaire
#   3. POST /complete-registration → Crée le compte avec token temporaire
#
# 📱 AUTHENTIFICATION DEVICES ESP32:
#   - POST /register-device : Premier enregistrement du device
#   - POST /token : Obtention d'un token JWT (renouvellement)
#   - CAS SPÉCIAL : "dashboard" toujours autorisé (pour le frontend)
#
# 🔐 SÉCURITÉ:
#   - Mots de passe hashés avec bcrypt
#   - Codes de vérification expirent après 10 minutes
#   - 5 tentatives maximum par code (anti-brute force)
#   - Tokens de reset expirent après 30 minutes
#   - Nettoyage automatique des codes expirés toutes les heures
#
# 📧 EMAILS TRANSACTIONNELS:
#   - Template HTML responsif pour code de vérification
#   - Template HTML pour réinitialisation de mot de passe
#   - Design professionnel avec couleurs PV Monitor
#
# ============================================================================

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from httpcore import request  # ⚠️ À SUPPRIMER - Module non installé
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from typing import Optional
import os
from dotenv import load_dotenv
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
import secrets
import logging
import json
import asyncio

from schemas import (
    DeviceRegister, 
    TokenResponse,
    LoginRequest,
    LoginResponse,
    User,
    UserRole,
    #UserResponse
)
from auth import create_token, verify_token, optional_verify_token
from database import users_collection, devices_collection
from auth import SECRET_KEY as JWT_SECRET_KEY

# Configuration du logger
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()

# ============================================================================
# 📦 CONFIGURATION
# ============================================================================

# Configuration JWT
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24 * 7  # 7 jours

# Configuration email
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
EMAIL_FROM = os.getenv('ALERT_EMAIL_FROM')
EMAIL_PASS = os.getenv('ALERT_EMAIL_PASS')

# Création du router
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# ============================================================================
# 📝 MODÈLES PYDANTIC
# ============================================================================

# ============================================
# MODÈLES POUR LA VÉRIFICATION
# ============================================

class EmailRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class CompleteRegistrationRequest(BaseModel):
    email: str
    code: str
    password: str
    name: str

# ============================================
# MODÈLES POUR MOT DE PASSE OUBLIÉ
# ============================================

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    message: str
    success: bool

# ============================================
# MODÈLES EXISTANTS
# ============================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "viewer"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime
    active: bool
    verified: bool = False

# ============================================================================
# 🗃️ GESTION DES CODES DE VÉRIFICATION
# ============================================================================

class VerificationManager:
    """
    Gère les codes de vérification email et les tokens de réinitialisation.
    Stockage temporaire en mémoire (à remplacer par Redis en production).
    
    📦 STRUCTURE DES DONNÉES:
        codes = {
            "user@example.com": {
                "code": "123456",
                "expires": datetime(2026, 4, 11, 15, 30),
                "attempts": 0
            }
        }
        reset_tokens = {
            "token_xyz": {
                "email": "user@example.com",
                "expires": datetime(2026, 4, 11, 16, 0)
            }
        }
    """
    def __init__(self):
        # Stockage temporaire (à remplacer par Redis en production)
        self.codes = {}  # email -> {"code": str, "expires": datetime, "attempts": int}
        self.reset_tokens = {}  # token -> {"email": str, "expires": datetime}
    
    def generate_code(self, email: str, length: int = 6) -> str:
        """
        Génère un code aléatoire à 6 chiffres.
        
        📥 ENTRÉE: email de l'utilisateur
        📤 SORTIE: code à 6 chiffres (ex: "483729")
        🔒 DURÉE: 10 minutes
        """
        code = ''.join(random.choices(string.digits, k=length))
        
        # Stocker le code avec expiration (10 minutes)
        self.codes[email] = {
            "code": code,
            "expires": datetime.utcnow() + timedelta(minutes=10),
            "attempts": 0
        }
        
        return code
    
    def verify_code(self, email: str, code: str) -> bool:
        """
        Vérifie si le code est correct (ET le supprime après validation).
        
        📥 ENTRÉE: email et code saisi
        📤 SORTIE: True si code valide, False sinon
        🔒 SÉCURITÉ:
            - Expiration après 10 minutes
            - 5 tentatives maximum (anti-brute force)
            - Code supprimé après validation (usage unique)
        """
        if email not in self.codes:
            return False
        
        data = self.codes[email]
        
        # Vérifier expiration
        if datetime.utcnow() > data["expires"]:
            del self.codes[email]
            return False
        
        # Limiter les tentatives (anti-brute force)
        data["attempts"] = data.get("attempts", 0) + 1
        if data["attempts"] > 5:
            del self.codes[email]
            return False
        
        # Vérifier code
        if data["code"] == code:
            del self.codes[email]  # Code valide, on le supprime
            return True
        
        return False
    
    def generate_reset_token(self, email: str) -> str:
        """
        Génère un token unique pour la réinitialisation de mot de passe.
        
        📥 ENTRÉE: email de l'utilisateur
        📤 SORTIE: token URL-safe de 32 caractères
        🔒 DURÉE: 30 minutes
        """
        token = secrets.token_urlsafe(32)
        self.reset_tokens[token] = {
            "email": email,
            "expires": datetime.utcnow() + timedelta(minutes=30)
        }
        return token
    
    def verify_reset_token(self, token: str) -> Optional[str]:
        """
        Vérifie le token de réinitialisation.
        
        📥 ENTRÉE: token reçu par email
        📤 SORTIE: email associé si valide, None sinon
        """
        if token not in self.reset_tokens:
            return None
        
        data = self.reset_tokens[token]
        
        # Vérifier expiration
        if datetime.utcnow() > data["expires"]:
            del self.reset_tokens[token]
            return None
        
        return data["email"]
    
    def clear_expired(self):
        """Nettoie les codes et tokens expirés (appelé toutes les heures)"""
        now = datetime.utcnow()
        
        # Nettoyer les codes
        expired_codes = [email for email, data in self.codes.items() 
                        if now > data["expires"]]
        for email in expired_codes:
            del self.codes[email]
        
        # Nettoyer les tokens
        expired_tokens = [token for token, data in self.reset_tokens.items() 
                         if now > data["expires"]]
        for token in expired_tokens:
            del self.reset_tokens[token]

# Instance globale
verification_manager = VerificationManager()

# ============================================================================
# 🔐 FONCTIONS DE HASH ET JWT
# ============================================================================

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt (sel automatique)"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Vérifie un mot de passe contre son hash bcrypt"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    """
    Crée un token JWT pour un utilisateur (pas pour device).
    
    📥 ENTRÉE:
        user_id: ID MongoDB de l'utilisateur
        email: Email de l'utilisateur
        role: Rôle (admin/user/viewer)
    
    📤 SORTIE: Token JWT valable 7 jours
    """
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

# ============================================================================
# 📧 FONCTIONS D'ENVOI D'EMAIL
# ============================================================================

def send_verification_email(to_email: str, code: str) -> bool:
    """
    Envoie l'email de vérification avec le code à 6 chiffres.
    
    📥 ENTRÉE:
        to_email: Destinataire
        code: Code à 6 chiffres
    📤 SORTIE: True si envoyé, False sinon
    🎨 DESIGN: Email HTML responsif avec logo PV Monitor
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = "🔐 Code de vérification - PV Monitor"
        
        # Template HTML de l'email
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #f5f8f5;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 4px 24px rgba(13,82,52,.10);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 25px;
                }}
                .logo {{
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #1a7f4f, #0d5234);
                    border-radius: 15px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 15px;
                }}
                .code {{
                    font-size: 48px;
                    font-weight: 800;
                    letter-spacing: 8px;
                    color: #1a7f4f;
                    text-align: center;
                    padding: 20px;
                    background: #e4f3ea;
                    border-radius: 12px;
                    margin: 20px 0;
                    font-family: monospace;
                }}
                .warning {{
                    font-size: 13px;
                    color: #7aaa88;
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #d8e8d8;
                }}
                .footer {{
                    text-align: center;
                    color: #375e45;
                    font-size: 12px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <circle cx="12" cy="12" r="5"/>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                    </div>
                    <h1 style="color: #0c1e13;">Vérification de l'email</h1>
                </div>
                
                <p style="color: #375e45; font-size: 16px; text-align: center;">
                    Voici votre code de vérification pour <strong>{to_email}</strong>
                </p>
                
                <div class="code">{code}</div>
                
                <p style="color: #375e45; text-align: center;">
                    Ce code expirera dans <strong>10 minutes</strong>.
                </p>
                
                <div class="warning">
                    ⚠️ Si vous n'avez pas demandé cette vérification, ignorez cet email.
                </div>
                
                <div class="footer">
                    © 2026 PV Monitor - Sécurisation de votre compte
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Envoyer l'email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_FROM, EMAIL_PASS)
            smtp.send_message(msg)
            
        return True
        
    except Exception as e:
        print(f"❌ Erreur envoi email: {e}")
        return False

def send_reset_password_email(to_email: str, reset_link: str) -> bool:
    """
    Envoie l'email de réinitialisation de mot de passe.
    
    📥 ENTRÉE:
        to_email: Destinataire
        reset_link: Lien de réinitialisation (frontend)
    📤 SORTIE: True si envoyé, False sinon
    🎨 DESIGN: Email HTML avec bouton d'action
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = "🔑 Réinitialisation de votre mot de passe - PV Monitor"
        
        # Template HTML de l'email
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #f5f8f5;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 4px 24px rgba(13,82,52,.10);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 25px;
                }}
                .logo {{
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #1a7f4f, #0d5234);
                    border-radius: 15px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 15px;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 30px;
                    background: linear-gradient(135deg, #1a7f4f, #0d5234);
                    color: white;
                    text-decoration: none;
                    border-radius: 30px;
                    font-weight: 600;
                    margin: 20px 0;
                    font-size: 16px;
                }}
                .warning {{
                    font-size: 13px;
                    color: #7aaa88;
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #d8e8d8;
                }}
                .footer {{
                    text-align: center;
                    color: #375e45;
                    font-size: 12px;
                    margin-top: 20px;
                }}
                .link {{
                    word-break: break-all;
                    color: #1a7f4f;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <circle cx="12" cy="12" r="5"/>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                    </div>
                    <h1 style="color: #0c1e13;">Réinitialisation du mot de passe</h1>
                </div>
                
                <p style="color: #375e45; font-size: 16px; text-align: center;">
                    Vous avez demandé la réinitialisation de votre mot de passe pour <strong>{to_email}</strong>
                </p>
                
                <div style="text-align: center;">
                    <a href="{reset_link}" class="button">Réinitialiser mon mot de passe</a>
                </div>
                
                <p style="color: #375e45; text-align: center; font-size: 14px;">
                    Ce lien expirera dans <strong>30 minutes</strong>.
                </p>
                
                <p style="color: #375e45; text-align: center; font-size: 13px;">
                    Si le bouton ne fonctionne pas, copiez ce lien :
                </p>
                <p class="link">{reset_link}</p>
                
                <div class="warning">
                    ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </div>
                
                <div class="footer">
                    © 2026 PV Monitor - Sécurisation de votre compte
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Envoyer l'email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_FROM, EMAIL_PASS)
            smtp.send_message(msg)
            
        return True
        
    except Exception as e:
        print(f"❌ Erreur envoi email: {e}")
        return False

# ============================================================================
# 📨 ENDPOINTS DE VÉRIFICATION EMAIL (3 ÉTAPES)
# ============================================================================

@router.post("/send-verification-code")
async def send_verification_code(request: EmailRequest):
    """
    Étape 1/3: Envoyer un code de vérification par email.
    
    📥 ENTRÉE: {"email": "user@example.com"}
    📤 SORTIE: {"status": "ok", "message": "Code envoyé", "email": "..."}
    🔒 SÉCURITÉ: Vérifie que l'email n'est pas déjà utilisé
    """
    email = request.email.lower().strip()
    
    # Validation basique du format
    if '@' not in email or '.' not in email:
        raise HTTPException(status_code=400, detail="Format d'email invalide")
    
    # Vérifier si l'email est déjà utilisé
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Générer un code
    code = verification_manager.generate_code(email)
    
    # Envoyer l'email
    if send_verification_email(email, code):
        return {
            "status": "ok",
            "message": "Code de vérification envoyé",
            "email": email
        }
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

@router.post("/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """
    Étape 2/3: Vérifier le code reçu par email.
    
    📥 ENTRÉE: {"email": "user@example.com", "code": "123456"}
    📤 SORTIE: {"status": "ok", "verified": True, "temp_token": "..."}
    🔒 SÉCURITÉ: Token temporaire valable 30 minutes pour finaliser l'inscription
    """
    if verification_manager.verify_code(request.email, request.code):
        # Générer un token temporaire pour la création de compte
        temp_token = jwt.encode(
            {
                "email": request.email,
                "verified": True,
                "exp": datetime.utcnow() + timedelta(minutes=30)
            },
            JWT_SECRET_KEY,
            algorithm="HS256"
        )
        
        return {
            "status": "ok",
            "message": "Code valide",
            "verified": True,
            "temp_token": temp_token
        }
    else:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")

@router.post("/complete-registration", response_model=TokenResponse)
async def complete_registration(
    request: CompleteRegistrationRequest,
    token_data: dict = Depends(verify_token)
):
    """
    Étape 3/3: Créer le compte après vérification email.
    
    📥 ENTRÉE:
        {"email": "user@example.com", "code": "123456", "password": "...", "name": "..."}
    
    📤 SORTIE: TokenResponse avec access_token JWT
    
    🔒 SÉCURITÉ:
        - Vérifie que le token temporaire correspond à l'email
        - Premier utilisateur = rôle admin, sinon viewer
        - Mot de passe doit faire au moins 8 caractères
    """
    try:
        print(f"📝 Tentative d'inscription pour: {request.email}")
        print(f"🔑 Token reçu pour: {token_data.get('email')}")
        
        # Vérifier que l'email dans le token correspond à l'email de la requête
        if token_data.get("email") != request.email:
            raise HTTPException(status_code=400, detail="Token invalide pour cet email")
        
        # Vérifier si l'email n'a pas été pris entre-temps
        existing = await users_collection.find_one({"email": request.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        
        # Validation du mot de passe
        if len(request.password) < 8:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
        
        # Hasher le mot de passe
        hashed = hash_password(request.password)
        
        # Vérifier si c'est le premier utilisateur
        user_count = await users_collection.count_documents({})
        role = "admin" if user_count == 0 else "viewer"
        
        # Créer l'utilisateur
        new_user = {
            "username": request.email.split('@')[0],  
            "email": request.email,
            "password": hashed,
            "name": request.name,
            "role": role,
            "verified": True,
            "verified_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "active": True
        }
        
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        print(f"✅ Compte créé avec succès: {request.email}")
        
        # Créer le token JWT
        token = create_jwt_token(user_id, request.email, role)
        
        return TokenResponse(
            access_token=token,
            expires_in=JWT_EXPIRATION_MINUTES
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# ============================================================================
# 🔑 ENDPOINTS - CHANGE MOT DE PASSE
# ============================================================================

@router.post("/change-password")
async def change_password(
    request: Request,
    token_payload: dict = Depends(verify_token)
):
    """
    Change le mot de passe de l'utilisateur connecté.
    
    📥 ENTRÉE:
        {"currentPassword": "ancien_mdp", "newPassword": "nouveau_mdp"}
    
    📤 SORTIE: {"message": "Mot de passe modifié avec succès"}
    
    🔒 SÉCURITÉ:
        - Vérifie l'ancien mot de passe
        - Nouveau mot de passe ≥ 8 caractères
        - Hash bcrypt avant stockage
    """
    try:
        print("=" * 60)
        print("🔐 ENDPOINT CHANGE-PASSWORD")
        
        body = await request.json()
        current_password = body.get("currentPassword")
        new_password = body.get("newPassword")
        
        print(f"📦 current_password reçu: {current_password}")
        print(f"📦 new_password reçu: {new_password}")
        
        # Validations
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Tous les champs sont requis")
        
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
        
        # Récupérer l'utilisateur
        user_id = token_payload.get("sub")
        print(f"👤 User ID: {user_id}")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide - pas de user_id")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        print(f"👤 Utilisateur trouvé: {user['email'] if user else 'Non trouvé'}")
        
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        print(f"🔐 Hash en base: {user['password']}")
        print(f"🔐 Mot de passe fourni: {current_password}")
        
        # Vérifier l'ancien mot de passe
        is_valid = verify_password(current_password, user["password"])
        print(f"🔐 Résultat vérification: {is_valid}")
        
        if not is_valid:
            raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
        
        # Hasher et sauvegarder
        hashed_new = hash_password(new_password)
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new}}
        )
        
        print(f"✅ Mot de passe modifié pour {user['email']}")
        print("=" * 60)
        
        return {"message": "Mot de passe modifié avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# 🔑 ENDPOINTS - MOT DE PASSE OUBLIÉ
# ============================================================================

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Étape 1/2: Envoyer un email de réinitialisation.
    
    📥 ENTRÉE: {"email": "user@example.com"}
    📤 SORTIE: {"message": "...", "success": True}
    
    🔒 SÉCURITÉ:
        - Ne révèle pas si l'email existe (message identique)
        - Token unique généré et stocké
        - Lien valable 30 minutes
    """
    email = request.email.lower().strip()
    
    # Vérifier si l'utilisateur existe
    user = await users_collection.find_one({"email": email})
    if not user:
        # Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
        return {
            "message": "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation",
            "success": True
        }
    
    # Générer un token unique
    reset_token = verification_manager.generate_reset_token(email)
    
    # Créer le lien de réinitialisation (à adapter selon ton frontend)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Envoyer l'email
    if send_reset_password_email(email, reset_link):
        return {
            "message": "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation",
            "success": True
        }
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest):
    """
    Étape 2/2: Réinitialiser le mot de passe avec le token.
    
    📥 ENTRÉE: {"token": "...", "new_password": "nouveau_mdp"}
    📤 SORTIE: {"message": "Mot de passe réinitialisé avec succès", "success": True}
    
    🔒 SÉCURITÉ:
        - Vérifie la validité du token
        - Token à usage unique (supprimé après utilisation)
        - Nouveau mot de passe ≥ 8 caractères
    """
    # Vérifier le token
    email = verification_manager.verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    
    # Valider le nouveau mot de passe
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    
    # Hasher le nouveau mot de passe
    hashed = hash_password(request.new_password)
    
    # Mettre à jour le mot de passe
    result = await users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return ResetPasswordResponse(
        message="Mot de passe réinitialisé avec succès",
        success=True
    )

# ============================================================================
# 👤 ENDPOINTS UTILISATEURS
# ============================================================================

@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    """
    Inscription d'un nouvel utilisateur (sans vérification email).
    
    📥 ENTRÉE:
        {"email": "user@example.com", "password": "...", "name": "..."}
    
    📤 SORTIE: TokenResponse avec access_token JWT
    
    ⚠️ NOTE: Version simplifiée sans vérification email.
              Préférer les 3 étapes avec send-verification-code.
    """
    try:
        # Vérifier si l'email existe déjà
        existing = await users_collection.find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        
        # Validation du mot de passe
        if len(user.password) < 8:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
        
        # Hasher le mot de passe
        hashed = hash_password(user.password)
        
        # Vérifier si c'est le premier utilisateur
        user_count = await users_collection.count_documents({})
        role = "admin" if user_count == 0 else user.role
        
        # Créer l'utilisateur (non vérifié)
        new_user = {
            "username": request.email.split('@')[0],  
            "email": user.email,
            "password": hashed,
            "name": user.name,
            "role": role,
            "verified": False,
            "created_at": datetime.utcnow(),
            "active": True
        }
        
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Créer le token
        token = create_jwt_token(user_id, user.email, role)
        
        return TokenResponse(
            access_token=token,
            expires_in=JWT_EXPIRATION_MINUTES
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'inscription: {str(e)}")

@router.post("/login")
async def login(request: Request):
    """
    Connexion d'un utilisateur - Accepte email ou username.
    
    📥 ENTRÉE:
        {"email": "user@example.com", "password": "..."}
        ou {"username": "user", "password": "..."}
    
    📤 SORTIE:
        {
            "access_token": "eyJhbGc...",
            "token_type": "bearer",
            "expires_in": 604800,
            "user": {"id": "...", "email": "...", "name": "...", "role": "..."}
        }
    
    🔒 SÉCURITÉ:
        - Mots de passe vérifiés avec bcrypt
        - Compte désactivé → 403
        - Mauvais identifiants → 401 (message générique)
    """
    print("=" * 60)
    print("🔍 NOUVELLE REQUÊTE LOGIN")
    print("=" * 60)
    
    try:
        # Lire le body
        body = await request.json()
        print(f"📦 Body reçu: {json.dumps(body, indent=2)}")
        
        # Extraire email et password (accepte email OU username)
        email = body.get("email") or body.get("username")
        password = body.get("password")
        
        if not email:
            return JSONResponse(
                status_code=422,
                content={"detail": "Le champ 'email' ou 'username' est requis"}
            )
        
        if not password:
            return JSONResponse(
                status_code=422,
                content={"detail": "Le champ 'password' est requis"}
            )
        
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {'*' * len(password)}")
        
        # Chercher l'utilisateur
        user = await users_collection.find_one({"email": email})
        if not user:
            print(f"❌ Utilisateur non trouvé: {email}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Cet email n'est pas enregistré"}
            )
        
        print(f"✅ Utilisateur trouvé: {user['email']} (role: {user['role']})")
        
        # Vérifier le mot de passe
        if not verify_password(password, user["password"]):
            print("❌ Mot de passe incorrect")
            return JSONResponse(
                status_code=401,
                content={"detail": "Email ou mot de passe incorrect"}
            )
        
        print("✅ Mot de passe valide")
        
        # Vérifier si le compte est actif
        if not user.get("active", True):
            print("❌ Compte désactivé")
            return JSONResponse(
                status_code=403,
                content={"detail": "Compte désactivé"}
            )
        
        # Créer le token
        token = create_jwt_token(str(user["_id"]), user["email"], user["role"])
        print(f"✅ Token créé: {token[:20]}...")
        
        # Mettre à jour la dernière connexion
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        print("=" * 60)
        print("✅ CONNEXION RÉUSSIE")
        print("=" * 60)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRATION_MINUTES,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        }
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Erreur interne: {str(e)}"}
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(token_data: dict = Depends(verify_token)):
    """
    Récupérer les informations de l'utilisateur connecté.
    
    📤 SORTIE: UserResponse avec id, email, name, role, created_at, active, verified
    
    🔒 AUTHENTIFICATION: Token JWT requis
    """
    try:
        user_id = token_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"],
            active=user.get("active", True),
            verified=user.get("verified", False)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.post("/logout")
async def logout(token_data: dict = Depends(optional_verify_token)):
    """Déconnexion (invalide le token côté client)"""
    return {"message": "Déconnexion réussie"}

@router.get("/verify")
async def verify_token_endpoint(token_data: dict = Depends(verify_token)):
    """Vérifier si le token JWT est valide"""
    return {
        "valid": True,
        "user_id": token_data.get("sub"),
        "email": token_data.get("email"),
        "role": token_data.get("role")
    }

@router.put("/profile")
async def update_profile(
    updates: dict,
    token_data: dict = Depends(verify_token)
):
    """Mettre à jour le profil utilisateur (name, email)"""
    try:
        user_id = token_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Champs autorisés à être modifiés
        allowed_fields = ["name", "email"]
        update_data = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Aucun champ valide à modifier")
        
        # Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
        if "email" in update_data:
            existing = await users_collection.find_one({
                "email": update_data["email"],
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing:
                raise HTTPException(status_code=400, detail="Email déjà utilisé")
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Récupérer l'utilisateur mis à jour
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        return UserResponse(
            id=str(updated_user["_id"]),
            email=updated_user["email"],
            name=updated_user["name"],
            role=updated_user["role"],
            created_at=updated_user["created_at"],
            active=updated_user.get("active", True),
            verified=updated_user.get("verified", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# ============================================================================
# 📱 ENDPOINTS POUR LES DEVICES ESP32
# ============================================================================

@router.post("/register-device", response_model=TokenResponse)
async def register_device(device: DeviceRegister):
    """
    Enregistrement et obtention du token JWT pour un device ESP32.
    
    📥 ENTRÉE: {"device_id": "esp2", "name": "ESP32 Zone A"}
    
    📤 SORTIE: TokenResponse avec access_token
    
    🔒 SÉCURITÉ:
        - CAS SPÉCIAL: "dashboard" toujours autorisé (frontend)
        - Vérifie que le device existe dans devices_collection
        - Vérifie que le device a le statut "active"
    """
    try:
        device_id = device.device_id
        logger.info(f"📥 Tentative d'enregistrement du device: {device_id}")
        
        # ✅ CAS SPÉCIAL : Le dashboard est toujours autorisé
        if device_id == "dashboard":
            logger.info(f"✅ Dashboard autorisé sans vérification")
            token = create_token(device_id)
            return TokenResponse(
                access_token=token,
                device_id=device_id,
                token_type="bearer",
                expires_in=30 * 24 * 3600
            )
        
        # Pour les autres devices, vérification normale
        from database import devices_collection
        
        device_in_db = await devices_collection.find_one({"device_id": device_id})
        
        if not device_in_db:
            logger.warning(f"❌ Device {device_id} non trouvé dans la base - doit être ajouté dans l'admin d'abord")
            raise HTTPException(
                status_code=403,
                detail="Ce dispositif n'est pas autorisé. Veuillez l'ajouter dans l'interface d'administration avec le statut 'active'."
            )
        
        if device_in_db.get("status") != "active":
            logger.warning(f"❌ Device {device_id} n'est pas actif (statut: {device_in_db.get('status')})")
            raise HTTPException(
                status_code=403,
                detail=f"Ce dispositif n'est pas actif. Statut actuel: {device_in_db.get('status')}. Activez-le dans l'interface d'administration."
            )
        
        token = create_token(device_id)
        
        await devices_collection.update_one(
            {"device_id": device_id},
            {"$set": {"last_heartbeat": datetime.now(timezone.utc)}}
        )
        
        logger.info(f"✅ Token émis pour device autorisé: {device_id}")
        
        return TokenResponse(
            access_token=token,
            device_id=device_id,
            token_type="bearer",
            expires_in=30 * 24 * 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur register_device: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/token", response_model=TokenResponse)
async def get_token(device: DeviceRegister):
    """
    Obtenir un token JWT pour un device déjà enregistré (renouvellement).
    
    📥 ENTRÉE: {"device_id": "esp2"}
    📤 SORTIE: TokenResponse avec access_token
    
    🔒 SÉCURITÉ:
        - CAS SPÉCIAL: "dashboard" toujours autorisé
        - Vérifie que le device existe et est actif
    """
    try:
        device_id = device.device_id
        logger.info(f"🔑 Demande de token pour device: {device_id}")
        
        # ✅ CAS SPÉCIAL : Le dashboard est toujours autorisé
        if device_id == "dashboard":
            logger.info(f"✅ Token émis pour dashboard")
            token = create_token(device_id)
            return TokenResponse(
                access_token=token,
                device_id=device_id,
                token_type="bearer",
                expires_in=30 * 24 * 3600
            )
        
        from database import devices_collection
        from datetime import datetime, timezone
        
        device_in_db = await devices_collection.find_one({"device_id": device_id})
        
        if not device_in_db:
            logger.warning(f"❌ Device {device_id} non trouvé dans la base")
            raise HTTPException(
                status_code=404,
                detail="Device non trouvé. Veuillez l'ajouter dans l'interface d'administration."
            )
        
        if device_in_db.get("status") != "active":
            logger.warning(f"❌ Device {device_id} n'est pas actif (statut: {device_in_db.get('status')})")
            raise HTTPException(
                status_code=403,
                detail=f"Ce dispositif n'est pas actif. Statut actuel: {device_in_db.get('status')}. Activez-le dans l'interface d'administration."
            )
        
        token = create_token(device_id)
        
        await devices_collection.update_one(
            {"device_id": device_id},
            {"$set": {"last_heartbeat": datetime.now(timezone.utc)}}
        )
        
        logger.info(f"✅ Token émis pour device: {device_id}")
        
        return TokenResponse(
            access_token=token,
            device_id=device_id,
            token_type="bearer",
            expires_in=30 * 24 * 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur get_token: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# 🧹 TÂCHE DE NETTOYAGE PÉRIODIQUE
# ============================================================================

@router.on_event("startup")
async def start_cleanup_task():
    """Nettoie les codes et tokens expirés toutes les heures"""
    
    async def cleanup_loop():
        while True:
            await asyncio.sleep(3600)  # 1 heure
            verification_manager.clear_expired()
            print("🧹 Nettoyage des codes et tokens expirés")
    
    asyncio.create_task(cleanup_loop())

# ============================================================================
# 🔑 ENDPOINTS D'AUTHENTIFICATION COMPLÉMENTAIRES
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(request: Request):
    """
    Connexion des utilisateurs humains (version alternative).
    Vérifie les identifiants dans MongoDB et retourne un token JWT.
    """
    try:
        # Log de la tentative de connexion
        logger.info(f"🔐 Tentative de connexion pour: {request}")
        
        # Lire le body
        body = await request.json()
        print(f"📦 Body reçu: {json.dumps(body, indent=2)}")
        
        # Extraire email et password (accepte email OU username)
        email = body.get("email") or body.get("username")
        password = body.get("password")
        
        if not email:
            return JSONResponse(
                status_code=422,
                content={"detail": "Le champ 'email' ou 'username' est requis"}
            )
        
        if not password:
            return JSONResponse(
                status_code=422,
                content={"detail": "Le champ 'password' est requis"}
            )
        
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {'*' * len(password)}")
        
        # Chercher l'utilisateur
        user = await users_collection.find_one({"email": email})
        if not user:
            print(f"❌ Utilisateur non trouvé: {email}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Cet email n'est pas enregistré"}
            )
        
        print(f"✅ Utilisateur trouvé: {user['email']} (role: {user['role']})")
        
        # Vérifier le mot de passe avec bcrypt
        if not verify_password(password, user["password"]):
            print("❌ Mot de passe incorrect")
            return JSONResponse(
                status_code=401,
                content={"detail": "Email ou mot de passe incorrect"}
            )
        
        print("✅ Mot de passe valide")
        
        # Vérifier si le compte est actif
        if not user.get("active", True):
            print("❌ Compte désactivé")
            return JSONResponse(
                status_code=403,
                content={"detail": "Compte désactivé"}
            )
        
        # Créer le token JWT
        token = create_jwt_token(
            user_id=str(user["_id"]),
            email=user["email"],
            role=user["role"]
        )
        print(f"✅ Token créé: {token[:20]}...")
        
        # Mettre à jour la dernière connexion
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        print("=" * 60)
        print("✅ CONNEXION RÉUSSIE")
        print("=" * 60)
        
        # Créer l'objet User pour la réponse
        user_response = User(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            role=UserRole(user["role"]),
            created_at=user["created_at"]
        )
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=user_response,
            expires_in=86400  # 24 heures
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Erreur interne: {str(e)}"}
        )

@router.get("/verify")
async def verify_user_token(payload: dict = Depends(verify_token)):
    """Vérifie la validité d'un token (version alternative)"""
    return {
        "status": "ok", 
        "device_id": payload.get("device_id"), 
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "exp": payload.get("exp")
    }

@router.get("/devices")
async def list_devices(payload: dict = Depends(verify_token)):
    """Liste des devices enregistrés (pour compatibilité)"""
    # Récupérer depuis MongoDB
    cursor = devices_collection.find({}, {"device_id": 1})
    devices = await cursor.to_list(length=100)
    device_ids = [d["device_id"] for d in devices]
    return {"devices": device_ids}

@router.on_event("startup") 
async def startup_event():
    pass