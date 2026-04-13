# ============================================================================
# FICHIER: data.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier contient les endpoints principaux pour l'accès aux données
#   de surveillance des panneaux solaires. C'est le cœur de l'API pour
#   la consultation des mesures historiques et en temps réel.
#
# 📥 ENDPOINTS:
#   GET /api/v1/history        - Historique paginé des mesures
#   GET /api/v1/latest         - Dernière mesure pour chaque device
#   GET /api/v1/stats          - Statistiques globales (moyennes, distribution)
#   GET /api/v1/recommendation - Recommandation de nettoyage basée sur IA
#
# 📊 TYPES DE DONNÉES:
#   - Mesures: timestamp, device_id, données électriques (V, A, W, irradiance)
#   - Analyses IA: soiling_level (0-100%), status, confidence
#   - Médias: URLs des images, base64 pour affichage
#
# 🔐 AUTHENTIFICATION:
#   - /history, /latest, /stats: optionnelle (optional_verify_token)
#   - /recommendation: obligatoire (verify_token)
#
# ⚡ OPTIMISATIONS:
#   - Pagination (skip/limit) pour l'historique
#   - Exclusion du champ image_b64 (trop lourd) dans /history
#   - Agrégations MongoDB pour les stats (performant)
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone
from bson import json_util
import json
from database import surveillance_collection
from auth import optional_verify_token, verify_token
from config_manager import get_config
from config import Config

# Création du routeur pour les endpoints de données
# Toutes les routes commenceront par /api/v1
router = APIRouter(prefix="/api/v1", tags=["data"])


# ============================================================================
# 📜 HISTORIQUE PAGINÉ DES MESURES
# ============================================================================

@router.get("/history")
async def get_history(
    skip: int = 0,
    limit: int = 20,
    device_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Récupère l'historique des mesures avec pagination et filtres.
    
    📥 PARAMÈTRES:
        - skip       : Nombre d'éléments à sauter (pagination)
        - limit      : Nombre maximum d'éléments à retourner
                       (0 = tous, max 1000, défaut 20)
        - device_id  : Filtrer par identifiant de device
        - start_date : Date de début (ISO format)
        - end_date   : Date de fin (ISO format)
    
    📤 SORTIE:
        {
            "total": 150,           # Nombre total de mesures
            "skip": 0,              # Position de départ
            "limit": 20,            # Limite demandée
            "has_more": true,       # S'il y a plus de données
            "data": [...]           # Liste des mesures
        }
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    💡 OPTIMISATION:
        - Le champ image_b64 est exclu (trop lourd pour l'historique)
        - Tri par date décroissante (plus récent d'abord)
        - Limite à 1000 éléments maximum
    """
    # Construction de la requête MongoDB
    query = {}
    if device_id:
        query["device_id"] = device_id
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date
    
    # Compter le nombre total de documents
    total = await surveillance_collection.count_documents(query)
    
    # Cas particulier: limit=0 retourne TOUS les documents
    if limit == 0:
        cursor = surveillance_collection.find(query, {"media.image_b64": 0}).sort("timestamp", -1).skip(skip)
        history = await cursor.to_list(length=None)
        return {
            "total": total,
            "skip": skip,
            "limit": len(history),
            "has_more": False,
            "data": json.loads(json_util.dumps(history))
        }
    
    # Limiter à 10000 éléments maximum pour performance
    if limit > 10000:
        limit = 10000
    
    # Exécuter la requête avec pagination
    cursor = surveillance_collection.find(query, {"media.image_b64": 0}).sort("timestamp", -1).skip(skip).limit(limit)
    history = await cursor.to_list(length=limit)
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
        "data": json.loads(json_util.dumps(history))
    }


# ============================================================================
# 🕒 DERNIÈRE MESURE (TEMPS RÉEL)
# ============================================================================

@router.get("/latest")
async def get_latest(
    device_id: Optional[str] = None,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Récupère la dernière mesure pour un device (ou tous).
    
    📥 PARAMÈTRES:
        - device_id : Filtrer par identifiant de device (optionnel)
    
    📤 SORTIE:
        {
            "status": "ok",
            "data": { ... }     # Dernière mesure complète (avec image_b64)
        }
        ou
        {"status": "no_data"}   # Aucune mesure trouvée
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    💡 UTILISATION:
        - Dashboard principal (affichage temps réel)
        - Widgets de monitoring
        - Alertes de dernière minute
    """
    query = {}
    if device_id:
        query["device_id"] = device_id
    
    # Trier par timestamp décroissant (plus récent d'abord)
    doc = await surveillance_collection.find_one(query, sort=[("timestamp", -1)])
    if not doc:
        return {"status": "no_data"}
    
    return {"status": "ok", "data": json.loads(json_util.dumps(doc))}


# ============================================================================
# 📊 STATISTIQUES GLOBALES (AGGRÉGATIONS)
# ============================================================================

@router.get("/stats")
async def get_stats(
    device_id: Optional[str] = None,
    token_payload: dict | None = Depends(optional_verify_token)
):
    """
    Calcule des statistiques globales sur toutes les mesures.
    
    📥 PARAMÈTRES:
        - device_id : Filtrer par device (optionnel)
    
    📤 SORTIE:
        {
            "status": "ok",
            "total": 150,                    # Nombre total de mesures
            "distribution": {                # Répartition par statut
                "Clean": 45,
                "Warning": 30,
                "Critical": 25
            },
            "averages": {                    # Moyennes calculées
                "avg_soiling": 35.2,         # % d'ensablement moyen
                "avg_power": 125.5,          # Puissance moyenne (W)
                "avg_voltage": 22.3,         # Tension moyenne (V)
                "avg_current": 5.6,          # Courant moyen (A)
                "avg_irradiance": 850.0,     # Irradiance moyenne (W/m²)
                "avg_temperature": 42.5      # Température moyenne (°C)
            },
            "daily": [                       # Données journalières (30 jours)
                {"day": "2026-04-01", "count": 48, "avg_soiling": 32.1, ...},
                ...
            ]
        }
    
    🔓 AUTHENTIFICATION: Optionnelle
    
    💡 DÉTAILS TECHNIQUES:
        - Utilise l'agrégation MongoDB pour les performances
        - Les moyennes ignorent les valeurs nulles
        - Les données journalières sont limitées à 30 jours
    """
    query = {}
    if device_id:
        query["device_id"] = device_id
    
    # Nombre total de mesures
    total = await surveillance_collection.count_documents(query)
    
    # ========================================================================
    # 1. DISTRIBUTION PAR STATUT (Clean/Warning/Critical)
    # ========================================================================
    dist_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$ai_analysis.status", "count": {"$sum": 1}}}
    ]
    dist_cursor = surveillance_collection.aggregate(dist_pipeline)
    distribution = {}
    async for d in dist_cursor:
        distribution[d["_id"]] = d["count"]
    
    # ========================================================================
    # 2. MOYENNES DES VALEURS ÉLECTRIQUES ET IA
    # ========================================================================
    avg_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "avg_soiling": {"$avg": "$ai_analysis.soiling_level"},
            "avg_power": {"$avg": "$electrical_data.power_output"},
            "avg_voltage": {"$avg": "$electrical_data.voltage"},
            "avg_current": {"$avg": "$electrical_data.current"},
            "avg_irradiance": {"$avg": "$electrical_data.irradiance"},
            "avg_temperature": {"$avg": "$electrical_data.temperature"},
        }}
    ]
    avg_cursor = surveillance_collection.aggregate(avg_pipeline)
    averages = {}
    async for a in avg_cursor:
        averages = {
            "avg_soiling": round(a.get("avg_soiling", 0) or 0, 1),
            "avg_power": round(a.get("avg_power", 0) or 0, 1),
            "avg_voltage": round(a.get("avg_voltage", 0) or 0, 1),
            "avg_current": round(a.get("avg_current", 0) or 0, 1),
            "avg_irradiance": round(a.get("avg_irradiance", 0) or 0, 1),
            "avg_temperature": round(a.get("avg_temperature", 0) or 0, 1),
        }
    
    # ========================================================================
    # 3. DONNÉES JOURNALIÈRES (30 DERNIERS JOURS)
    # ========================================================================
    daily_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1},
            "avg_soiling": {"$avg": "$ai_analysis.soiling_level"},
            "avg_power": {"$avg": "$electrical_data.power_output"},
            "avg_temperature": {"$avg": "$electrical_data.temperature"},
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 30}
    ]
    daily_cursor = surveillance_collection.aggregate(daily_pipeline)
    daily = []
    async for d in daily_cursor:
        daily.append({
            "day": d["_id"],
            "count": d["count"],
            "avg_soiling": round(d.get("avg_soiling", 0) or 0, 1),
            "avg_power": round(d.get("avg_power", 0) or 0, 1),
            "avg_temperature": round(d.get("avg_temperature", 0) or 0, 1),
        })
    
    return {
        "status": "ok",
        "total": total,
        "distribution": distribution,
        "averages": averages,
        "daily": daily
    }


# ============================================================================
# 💡 RECOMMANDATION DE NETTOYAGE
# ============================================================================

@router.get("/recommendation")
async def get_recommendation(
    device_id: Optional[str] = None,
    token_payload: dict = Depends(verify_token)
):
    """
    Génère une recommandation de nettoyage basée sur la dernière mesure.
    
    📥 PARAMÈTRES:
        - device_id : Filtrer par device (optionnel)
    
    📤 SORTIE (3 cas possibles):
    
    1. CRITICAL (ensablement >= seuil_critical):
        {
            "action": "NETTOYAGE URGENT 🚨",
            "priority": "critical",
            "reason": "Ensablement 65.2% — Perte majeure de puissance (150W)",
            "color": "#c0392b",
            "estimated_loss_kwh": 3.6,   # Perte estimée par jour
            "roi_cleaning": 85            # Retour sur investissement (%)
        }
    
    2. WARNING (ensablement >= seuil_warning):
        {
            "action": "NETTOYAGE RECOMMANDÉ ⚠️",
            "priority": "high",
            "reason": "Ensablement 45.3% — Rendement dégradé (80W de perte)",
            "color": "#ef6c00",
            "estimated_loss_kwh": 1.92,
            "roi_cleaning": 45
        }
    
    3. CLEAN (ensablement < seuil_warning):
        {
            "action": "PANNEAU PROPRE ✅",
            "priority": "low",
            "reason": "Ensablement 12.5% — Aucune action requise",
            "color": "#1a7f4f",
            "estimated_loss_kwh": 0,
            "roi_cleaning": 0
        }
    
    4. PAS DE DONNÉES:
        {
            "action": "Aucune donnée",
            "priority": "low",
            "reason": "Pas encore de mesures",
            "color": "#94a3b8"
        }
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    💡 FORMULES DE CALCUL:
        - Puissance théorique (pth) = irradiance × surface (1.6m²) × rendement (20%)
        - Perte (W) = max(0, pth - puissance_actuelle)
        - Perte journalière (kWh) = perte_W × 8h / 1000
        - ROI = (économie_mensuelle / coût_nettoyage) × 100
    """
    query = {}
    if device_id:
        query["device_id"] = device_id
    
    # Récupérer la dernière mesure
    doc = await surveillance_collection.find_one(query, sort=[("timestamp", -1)])
    if not doc:
        return {
            "action": "Aucune donnée",
            "priority": "low",
            "reason": "Pas encore de mesures",
            "color": "#94a3b8"
        }
    
    # Extraire les données pertinentes
    soiling = doc.get("ai_analysis", {}).get("soiling_level", 0)
    status = doc.get("ai_analysis", {}).get("status", "")
    power = doc.get("electrical_data", {}).get("power_output", 0)
    irradiance = doc.get("electrical_data", {}).get("irradiance", 0)
    
    # Calculer la puissance théorique et la perte
    # Formule: Pth = Irradiance × Surface (1.6m²) × Rendement (20%)
    pth = irradiance * 1.6 * 0.20
    loss = max(0, pth - power) if pth > 0 else 0
    
    # Récupérer les seuils depuis la configuration
    config = get_config()
    seuil_warning = config.get("seuil_warning", Config.SEUIL_WARNING)
    seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)
    
    # ========================================================================
    # DÉTERMINER LE STATUT ET LA RECOMMANDATION
    # ========================================================================
    
    # CAS 1: CRITICAL - Nettoyage urgent
    if soiling >= seuil_critical or status == "Critical":
        return {
            "action": "NETTOYAGE URGENT 🚨",
            "priority": "critical",
            "reason": f"Ensablement {soiling:.1f}% — Perte majeure de puissance ({loss:.0f}W)",
            "color": "#c0392b",
            "estimated_loss_kwh": loss * 24 / 1000,
            "roi_cleaning": 85
        }
    # CAS 2: WARNING - Nettoyage recommandé
    elif soiling >= seuil_warning or status == "Warning":
        return {
            "action": "NETTOYAGE RECOMMANDÉ ⚠️",
            "priority": "high",
            "reason": f"Ensablement {soiling:.1f}% — Rendement dégradé ({loss:.0f}W de perte)",
            "color": "#ef6c00",
            "estimated_loss_kwh": loss * 24 / 1000,
            "roi_cleaning": 45
        }
    # CAS 3: CLEAN - Panneau propre
    else:
        return {
            "action": "PANNEAU PROPRE ✅",
            "priority": "low",
            "reason": f"Ensablement {soiling:.1f}% — Aucune action requise",
            "color": "#1a7f4f",
            "estimated_loss_kwh": 0,
            "roi_cleaning": 0
        }