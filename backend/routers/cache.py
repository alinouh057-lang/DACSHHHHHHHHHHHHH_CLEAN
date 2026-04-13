# ============================================================================
# FICHIER: cache.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier gère le cache du modèle d'intelligence artificielle.
#   Le cache permet d'éviter de ré-analyser plusieurs fois la même image,
#   ce qui économise du temps de calcul et des ressources CPU/GPU.
#
# 📥 ENDPOINTS:
#   GET  /api/v1/ai/cache-stats  - Récupère les statistiques du cache IA
#   POST /api/v1/ai/clear-cache  - Vide complètement le cache IA
#
# 🧠 FONCTIONNEMENT DU CACHE IA:
#   - Chaque image analysée est stockée en cache avec son résultat
#   - Si la même image est soumise à nouveau, le résultat est retourné
#     instantanément sans ré-analyser
#   - Le cache a une taille maximale (100 images) et une durée de vie (1 heure)
#   - Politique LRU (Least Recently Used) : les images les moins récentes
#     sont supprimées en premier quand le cache est plein
#
# 📊 STATISTIQUES DU CACHE (cache-stats):
#   - size        : Nombre d'images actuellement en cache
#   - maxsize     : Capacité maximale du cache
#   - ttl         : Durée de vie des entrées (Time To Live en secondes)
#   - usage_percent : Pourcentage d'utilisation du cache
#   - oldest_age_sec : Âge de l'entrée la plus ancienne
#   - newest_age_sec : Âge de l'entrée la plus récente
#   - avg_age_sec    : Âge moyen des entrées
#
# 🔐 AUTHENTIFICATION:
#   - Les deux endpoints nécessitent un token JWT valide (verify_token)
#   - Seuls les utilisateurs authentifiés peuvent accéder au cache
#
# 💡 UTILISATION TYPIQUE:
#   - Surveiller les performances du cache via /cache-stats
#   - Vider le cache via /clear-cache après une mise à jour du modèle IA
#
# ============================================================================

from fastapi import APIRouter, Depends
from auth import verify_token
from inference_engine import get_cache_stats, clear_cache

# Création du routeur pour les endpoints de gestion du cache IA
# Toutes les routes commenceront par /api/v1/ai
router = APIRouter(prefix="/api/v1/ai", tags=["cache"])


# ============================================================================
# 📊 STATISTIQUES DU CACHE
# ============================================================================

@router.get("/cache-stats")
async def get_cache_stats_endpoint(token_payload: dict = Depends(verify_token)):
    """
    Récupère les statistiques détaillées du cache du modèle IA.
    
    📤 SORTIE:
        {
            "status": "ok",
            "cache_stats": {
                "size": 42,              # Nombre d'images en cache
                "maxsize": 100,          # Capacité maximale
                "ttl": 3600,             # Durée de vie (secondes)
                "usage_percent": 42.0,   # Taux d'utilisation
                "oldest_age_sec": 2450,  # Âge de l'entrée la plus ancienne
                "newest_age_sec": 12,    # Âge de l'entrée la plus récente
                "avg_age_sec": 180       # Âge moyen
            }
        }
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 INTERPRÉTATION DES STATISTIQUES:
        - usage_percent élevé (>80%) : le cache est bien utilisé
        - oldest_age_sec proche de ttl : les entrées expirent bientôt
        - size = 0 : le cache est vide, toutes les images sont ré-analysées
    """
    stats = get_cache_stats()
    return {"status": "ok", "cache_stats": stats}


# ============================================================================
# 🗑️ VIDAGE COMPLET DU CACHE
# ============================================================================

@router.post("/clear-cache")
async def clear_cache_endpoint(token_payload: dict = Depends(verify_token)):
    """
    Vide complètement le cache du modèle IA.
    
    📤 SORTIE:
        {"status": "ok", "message": "Cache vidé"}
    
    🔒 AUTHENTIFICATION: Token JWT requis (verify_token)
    
    💡 QUAND UTILISER:
        - Après avoir amélioré/recréé le modèle IA
        - Si le cache contient des résultats obsolètes
        - Pour libérer de la mémoire (RAM) si nécessaire
        - En cas de comportement anormal des prédictions
    
    ⚠️ NOTE: Après vidage, toutes les images devront être ré-analysées
             ce qui prendra plus de temps CPU pour les premières requêtes.
    """
    clear_cache()
    return {"status": "ok", "message": "Cache vidé"}