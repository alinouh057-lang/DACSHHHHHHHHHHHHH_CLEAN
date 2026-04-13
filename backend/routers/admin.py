# ============================================================================
# FICHIER: admin.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier contient toutes les routes API pour l'administration du système
#   PV Monitor. Il permet aux administrateurs de gérer la configuration,
#   les utilisateurs, les panneaux solaires et les données du système.
#
# 📥 ENDPOINTS PRINCIPAUX:
#   GET    /api/v1/admin/config          - Récupère la configuration générale
#   POST   /api/v1/admin/config          - Met à jour la configuration générale
#   GET    /api/v1/admin/email-config    - Récupère la configuration email
#   POST   /api/v1/admin/email-config    - Met à jour la configuration email
#   POST   /api/v1/admin/test-email      - Envoie un email de test
#   GET    /api/v1/admin/users           - Liste tous les utilisateurs
#   POST   /api/v1/admin/users           - Crée un nouvel utilisateur
#   PUT    /api/v1/admin/users/{user_id} - Modifie un utilisateur
#   DELETE /api/v1/admin/users/{user_id} - Supprime un utilisateur
#   GET    /api/v1/admin/panel-config    - Récupère la config des panneaux
#   POST   /api/v1/admin/panel-config    - Met à jour la config des panneaux
#   DELETE /api/v1/admin/delete-all-data - Supprime toutes les données d'une collection
#   DELETE /api/v1/admin/delete-old-data - Supprime les données plus vieilles que N jours
#
# 🔐 AUTHENTIFICATION:
#   - La plupart des endpoints sont protégés par JWT (Bearer token)
#   - Les endpoints sensibles (suppression, email) nécessitent un rôle admin
#   - optional_verify_token permet l'accès sans token (ex: pour la config de base)
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
from database import (
    users_collection, devices_collection, surveillance_collection,
    alerts_collection, interventions_collection, panel_config_collection
)
from auth import optional_verify_token, verify_token
from config_manager import get_config, update_config, get_email_config, update_email_config
from services.email_service import send_email
from schemas import AdminConfig, EmailConfig, EmailConfigResponse

# Création du routeur pour regrouper toutes les routes admin
# Toutes les routes commenceront par /api/v1/admin
router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# ============================================================================
# 📊 CONFIGURATION GÉNÉRALE
# ============================================================================

@router.get("/config")
async def get_admin_config(token_payload: dict | None = Depends(optional_verify_token)):
    """
    Récupère la configuration générale du système.
    📥 Entrée: token JWT optionnel
    📤 Sortie: Dictionnaire contenant les paramètres de configuration
               (seuils, rétention, coordonnées GPS, paramètres panneaux)
    🔓 Authentification: Optionnelle (même sans token, retourne la config)
    """
    return get_config()


@router.post("/config")
async def update_admin_config(
    config: AdminConfig,
    request: Request,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Met à jour la configuration générale du système.
    📥 Entrée:
        - config: Objet AdminConfig avec les nouveaux paramètres
        - request: Requête HTTP contenant le body JSON
    📤 Sortie: {"status": "ok", "message": "Configuration mise à jour"}
    🔒 Authentification: Optionnelle
    """
    # Convertir l'objet Pydantic en dictionnaire
    config_dict = config.model_dump()
    body = await request.json()
    
    # Mettre à jour les champs spécifiques depuis le body
    for key in ['latitude', 'longitude', 'panel_area_m2', 'panel_efficiency']:
        if key in body:
            config_dict[key] = body[key]
    
    # Sauvegarder la configuration
    update_config(config_dict)
    return {"status": "ok", "message": "Configuration mise à jour"}


# ============================================================================
# 📧 CONFIGURATION EMAIL
# ============================================================================

@router.get("/email-config", response_model=EmailConfigResponse)
async def get_email_config_endpoint(token_payload: dict | None = Depends(optional_verify_token)):
    """
    Récupère la configuration des emails (alertes).
    📥 Entrée: token JWT optionnel
    📤 Sortie: EmailConfigResponse (sans le mot de passe pour sécurité)
    🔓 Authentification: Optionnelle
    """
    return get_email_config()


@router.post("/email-config")
async def update_email_config_endpoint(
    config: EmailConfig,
    token_payload: dict = Depends(verify_token)
):
    """
    Met à jour la configuration des emails.
    📥 Entrée: Objet EmailConfig (serveur SMTP, emails, mot de passe)
    📤 Sortie: {"status": "ok", "message": "Configuration email mise à jour"}
    🔒 Authentification: Requise (token JWT valide)
    """
    try:
        update_email_config(config.dict(exclude_unset=True))
        user_id = token_payload.get("device_id") or token_payload.get("sub") or "unknown"
        return {"status": "ok", "message": "Configuration email mise à jour"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-email")
async def test_email(token_payload: dict = Depends(verify_token)):
    """
    Envoie un email de test pour vérifier la configuration SMTP.
    📥 Entrée: token JWT valide
    📤 Sortie: {"status": "ok", "message": "Email de test envoyé"}
    🔒 Authentification: Requise
    """
    success = send_email(
        subject="📧 Test de configuration email",
        html_body="<h2>✅ Test réussi !</h2><p>Votre configuration email est correcte.</p>"
    )
    if success:
        return {"status": "ok", "message": "Email de test envoyé"}
    raise HTTPException(status_code=500, detail="Échec de l'envoi de l'email de test")


# ============================================================================
# 👥 GESTION DES UTILISATEURS
# ============================================================================

@router.get("/users")
async def get_admin_users(token_payload: dict | None = Depends(optional_verify_token)):
    """
    Récupère la liste de tous les utilisateurs.
    📥 Entrée: token JWT optionnel
    📤 Sortie: Liste d'utilisateurs (sans les mots de passe)
    🔓 Authentification: Optionnelle
    """
    # Exclure le champ password des résultats
    cursor = users_collection.find({}, {"password": 0})
    users = await cursor.to_list(length=100)
    result = []
    for user in users:
        result.append({
            "id": str(user["_id"]),
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "name": user.get("name", user.get("username", "")),
            "role": user.get("role", "viewer"),
            "created_at": user.get("created_at").isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
            "last_login": user.get("last_login", ""),
            "active": user.get("active", True),
            "verified": user.get("verified", False)
        })
    return result


@router.post("/users")
async def add_admin_user(user: dict, token_payload: dict | None = Depends(optional_verify_token)):
    """
    Crée un nouvel utilisateur (admin ou simple utilisateur).
    📥 Entrée: Dictionnaire avec username, email, password (optionnel), role
    📤 Sortie: Informations de l'utilisateur créé
    🔓 Authentification: Optionnelle
    """
    # Validation des champs requis
    if not user.get("username") or not user.get("email"):
        raise HTTPException(status_code=400, detail="Username et email requis")
    
    # Normaliser l'email (minuscules, sans espaces)
    email = user["email"].strip().lower()
    
    # Vérifier si l'email existe déjà
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Hasher le mot de passe (ou utiliser mot de passe par défaut)
    password = user.get("password", "Default123!")
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Créer le document utilisateur
    new_user = {
        "username": user["username"].strip(),
        "email": email,
        "password": hashed,
        "name": user.get("name") or user["username"],
        "role": user.get("role", "viewer"),
        "created_at": datetime.now(timezone.utc),
        "active": user.get("active", True),
        "verified": False
    }
    
    # Insérer dans MongoDB
    result = await users_collection.insert_one(new_user)
    
    return {
        "id": str(result.inserted_id),
        "username": new_user["username"],
        "email": new_user["email"],
        "name": new_user["name"],
        "role": new_user["role"],
        "created_at": new_user["created_at"].isoformat(),
        "active": new_user["active"]
    }


@router.put("/users/{user_id}")
async def update_admin_user(user_id: str, updates: dict, token_payload: dict | None = Depends(optional_verify_token)):
    """
    Met à jour les informations d'un utilisateur.
    📥 Entrée: 
        - user_id: ID MongoDB de l'utilisateur
        - updates: Dictionnaire des champs à modifier
    📤 Sortie: Informations de l'utilisateur après mise à jour
    🔓 Authentification: Optionnelle
    """
    # Seuls ces champs peuvent être modifiés
    allowed_fields = ["username", "email", "name", "role", "active"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun champ valide")
    
    # Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if "email" in update_data:
        existing = await users_collection.find_one({
            "email": update_data["email"],
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Mettre à jour l'utilisateur
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Récupérer l'utilisateur mis à jour
    updated = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    return {
        "id": str(updated["_id"]),
        "username": updated["username"],
        "email": updated["email"],
        "name": updated.get("name", updated["username"]),
        "role": updated["role"],
        "created_at": updated["created_at"].isoformat() if isinstance(updated["created_at"], datetime) else updated["created_at"],
        "active": updated.get("active", True)
    }


@router.delete("/users/{user_id}")
async def delete_admin_user(user_id: str, token_payload: dict | None = Depends(optional_verify_token)):
    """
    Supprime définitivement un utilisateur.
    📥 Entrée: user_id (ID MongoDB de l'utilisateur)
    📤 Sortie: {"status": "ok", "message": "Utilisateur supprimé"}
    🔓 Authentification: Optionnelle
    """
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"status": "ok", "message": "Utilisateur supprimé"}


# ============================================================================
# 🔧 CONFIGURATION DES PANNEAUX SOLAIRES
# ============================================================================

@router.get("/panel-config")
async def get_panel_config_endpoint(token_payload: dict | None = Depends(optional_verify_token)):
    """
    Récupère la configuration des panneaux solaires.
    📥 Entrée: token JWT optionnel
    📤 Sortie: Paramètres des panneaux (type, puissance, surface, rendement, etc.)
    🔓 Authentification: Optionnelle
    """
    config = await panel_config_collection.find_one({})
    if not config:
        # Valeurs par défaut si aucune configuration n'existe
        return {
            "panel_type": "monocristallin",
            "panel_capacity_kw": 3.0,
            "panel_area_m2": 1.6,
            "panel_efficiency": 0.20,
            "tilt_angle": 30,
            "azimuth": 180,
            "degradation_rate": 0.5
        }
    config.pop("_id", None)  # Supprimer l'ID MongoDB de la réponse
    return config


@router.post("/panel-config")
async def update_panel_config_endpoint(config: dict, token_payload: dict | None = Depends(optional_verify_token)):
    """
    Met à jour la configuration des panneaux solaires.
    📥 Entrée: Dictionnaire avec les nouveaux paramètres des panneaux
    📤 Sortie: {"status": "ok", "message": "Configuration mise à jour"}
    🔒 Authentification: Requise + rôle admin
    """
    # Vérifier que l'utilisateur est authentifié
    if not token_payload:
        raise HTTPException(status_code=401, detail="Authentification requise")
    
    # Vérifier que l'utilisateur a le rôle admin
    user_id = token_payload.get("sub")
    if user_id:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    # Mettre à jour la configuration (upsert = créer si n'existe pas)
    await panel_config_collection.update_one({}, {"$set": config}, upsert=True)
    return {"status": "ok", "message": "Configuration mise à jour"}


# ============================================================================
# 🗑️ SUPPRESSION DE DONNÉES (ADMIN UNIQUEMENT)
# ============================================================================

@router.delete("/delete-all-data")
async def delete_all_data(
    token_payload: dict = Depends(verify_token),
    collection: str = Query(...)
):
    """
    Supprime TOUTES les données d'une collection spécifique.
    ⚠️ ACTION IRREVERSIBLE - ADMIN UNIQUEMENT ⚠️
    📥 Entrée: 
        - collection: Nom de la collection à vider
          (surveillance, devices, interventions, alerts)
    📤 Sortie: Nombre d'éléments supprimés
    🔒 Authentification: Requise + rôle admin
    """
    # Vérifier que l'utilisateur est admin
    user_id = token_payload.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    # Supprimer selon la collection demandée
    if collection == "surveillance":
        result = await surveillance_collection.delete_many({})
        return {"status": "ok", "message": f"{result.deleted_count} mesures supprimées", "deleted_count": result.deleted_count}
    elif collection == "devices":
        result = await devices_collection.delete_many({})
        return {"status": "ok", "message": f"{result.deleted_count} devices supprimés", "deleted_count": result.deleted_count}
    elif collection == "interventions":
        result = await interventions_collection.delete_many({})
        return {"status": "ok", "message": f"{result.deleted_count} interventions supprimées", "deleted_count": result.deleted_count}
    elif collection == "alerts":
        result = await alerts_collection.delete_many({})
        return {"status": "ok", "message": f"{result.deleted_count} alertes supprimées", "deleted_count": result.deleted_count}
    else:
        raise HTTPException(status_code=400, detail="Collection non reconnue")


@router.delete("/delete-old-data")
async def delete_old_data(
    token_payload: dict = Depends(verify_token),
    days: int = Query(30, ge=1, le=365)
):
    """
    Supprime les données plus anciennes que N jours.
    ⚠️ ACTION IRREVERSIBLE - ADMIN UNIQUEMENT ⚠️
    📥 Entrée: days (nombre de jours de rétention, défaut=30, max=365)
    📤 Sortie: Nombre de mesures et interventions supprimées
    🔒 Authentification: Requise + rôle admin
    """
    # Vérifier que l'utilisateur est admin
    user_id = token_payload.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    # Date limite (toutes les données avant cette date seront supprimées)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Supprimer les anciennes mesures
    result = await surveillance_collection.delete_many({"timestamp": {"$lt": cutoff}})
    # Supprimer les anciennes interventions
    result_int = await interventions_collection.delete_many({"date": {"$lt": cutoff.isoformat()}})
    
    return {
        "status": "ok",
        "message": f"Données antérieures à {days} jours supprimées",
        "deleted_measurements": result.deleted_count,
        "deleted_interventions": result_int.deleted_count
    }