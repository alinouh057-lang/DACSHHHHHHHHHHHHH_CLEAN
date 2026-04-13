# ============================================================================
# FICHIER: user.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère les préférences utilisateur, en particulier le fuseau
#   horaire. Il permet au frontend de synchroniser l'affichage des dates
#   et heures avec le fuseau local de l'utilisateur.
#
# 📥 ENDPOINT:
#   POST /api/v1/user/timezone - Enregistre le fuseau horaire de l'utilisateur
#
# 🌍 FUSEAU HORAIRE (timezone):
#   - Format: "Africa/Tunis", "Europe/Paris", "America/New_York", etc.
#   - Détecté automatiquement par le navigateur (JavaScript)
#   - Envoyé au backend pour personnaliser l'affichage
#
# 🔐 AUTHENTIFICATION:
#   - Optionnelle (optional_verify_token)
#   - Si token présent, on enregistre le device_id associé
#   - Si pas de token, device_id = "anonymous"
#
# 📤 SORTIE:
#   {
#     "status": "ok",
#     "timezone": "Africa/Tunis",
#     "device_id": "esp2"  # ou "anonymous" si pas de token
#   }
#
# 💡 UTILISATION TYPIQUE:
#   1. Le frontend détecte le fuseau via: Intl.DateTimeFormat().resolvedOptions().timeZone
#   2. Envoie une requête POST à ce endpoint
#   3. Le backend stocke le fuseau dans la configuration globale
#   4. Tous les affichages de dates utilisent ce fuseau
#
# 🔄 PERSISTANCE:
#   - Le fuseau est stocké dans config_dynamic.json
#   - Persiste entre les redémarrages du serveur
#   - Partagé entre tous les utilisateurs (configuration globale)
#
# ⚠️ NOTE:
#   - Actuellement, le fuseau est global (tous les utilisateurs partagent la même valeur)
#   - À terme, pourrait être stocké par utilisateur dans la collection users
#
# ============================================================================

from fastapi import APIRouter, Depends, Request
from auth import optional_verify_token
from config_manager import get_config, update_config

# Création du routeur pour les endpoints utilisateur
# Toutes les routes commenceront par /api/v1/user
router = APIRouter(prefix="/api/v1/user", tags=["user"])


# ============================================================================
# 🌍 ENREGISTREMENT DU FUSEAU HORAIRE
# ============================================================================

@router.post("/timezone")
async def set_user_timezone(
    data: dict,
    request: Request,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Enregistre le fuseau horaire de l'utilisateur dans la configuration.
    
    📥 ENTRÉE (JSON):
        {
            "timezone": "Africa/Tunis"   # Fuseau horaire IANA
        }
    
    📤 SORTIE:
        {
            "status": "ok",
            "timezone": "Africa/Tunis",
            "device_id": "esp2"          # ou "anonymous"
        }
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    🌍 FORMAT DU FUSEAU (IANA Time Zone Database):
        - Africa/Tunis
        - Europe/Paris
        - America/New_York
        - Asia/Tokyo
        - Pacific/Auckland
        - Etc...
    
    💡 DÉTECTION AUTOMATIQUE (JavaScript):
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Retourne par exemple: "Africa/Tunis"
    
    🔄 PERSISTANCE:
        - Stocké dans config_dynamic.json (fichier JSON)
        - Accessible via get_config()["timezone"]
        - Utilisé par tous les endpoints pour formater les dates
    
    📊 EXEMPLE D'UTILISATION DANS LE BACKEND:
        from config_manager import get_config
        tz = get_config().get("timezone", "UTC")
        date_utc = datetime.now(timezone.utc)
        date_locale = date_utc.astimezone(timezone(tz))
    
    ⚠️ NOTE D'IMPLÉMENTATION:
        - Actuellement, le fuseau est GLOBAL (partagé entre tous)
        - En production, il faudrait le stocker par utilisateur dans MongoDB
        - Pour l'instant, cette solution convient pour un usage mono-utilisateur
    """
    # Extraire le fuseau horaire du body JSON
    timezone = data.get("timezone")
    
    # Déterminer l'identifiant du device (si authentifié)
    device_id = token_payload.get("device_id") if token_payload else "anonymous"
    
    # Récupérer l'adresse IP du client (pour logs)
    client_ip = request.client.host
    
    # ========================================================================
    # STOCKAGE DANS LA CONFIGURATION GLOBALE
    # ========================================================================
    # Récupérer la configuration actuelle
    current_config = get_config()
    
    # Mettre à jour le fuseau horaire
    current_config["timezone"] = timezone
    
    # Sauvegarder la configuration (persistance dans config_dynamic.json)
    update_config(current_config)
    
    # ========================================================================
    # RÉPONSE AU CLIENT
    # ========================================================================
    return {"status": "ok", "timezone": timezone, "device_id": device_id}