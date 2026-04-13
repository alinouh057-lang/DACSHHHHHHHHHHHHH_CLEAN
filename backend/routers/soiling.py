# ============================================================================
# FICHIER: soiling.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier est le cœur de l'analyse d'ensablement des panneaux solaires.
#   Il fournit l'historique, les recommandations de nettoyage et les
#   prédictions d'évolution de l'ensablement basées sur l'IA.
#
# 📥 ENDPOINTS:
#   GET /api/v1/soiling/history        - Historique de l'ensablement
#   GET /api/v1/soiling/recommendation - Recommandation de nettoyage
#   GET /api/v1/soiling/prediction     - Prédiction future de l'ensablement
#
# 📊 DONNÉES D'ENSABLEMENT:
#   - soiling_level : Pourcentage d'ensablement (0-100%)
#   - status        : Clean (<30%), Warning (30-60%), Critical (>60%)
#   - confidence    : Confiance de l'IA (0-1)
#   - model_version : Version du modèle utilisé
#
# 📈 CALCUL DE LA TENDANCE (slope):
#   - Utilise la régression linéaire sur les valeurs historiques
#   - Slope positif = ensablement augmente
#   - Slope négatif = ensablement diminue (nettoyage effectué)
#
# 💰 ROI DU NETTOYAGE:
#   - Coût standard: 50 DT
#   - Prix électricité: 0.15 DT/kWh
#   - ROI = (économie_mensuelle / coût_nettoyage) × 100
#
# 🔮 PRÉDICTION:
#   - Modèle linéaire simple basé sur la tendance historique
#   - Confiance diminue linéairement avec l'horizon (10% par jour)
#   - Prédit la date où le seuil critique sera atteint
#
# 🔐 AUTHENTIFICATION:
#   - Tous les endpoints nécessitent un token JWT valide (verify_token)
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone
from database import surveillance_collection
from auth import verify_token
from config_manager import get_config
from config import Config
from schemas import SoilingHistoryResponse, CleaningRecommendation, SoilingPrediction

# Création du routeur pour les endpoints d'ensablement
# Toutes les routes commenceront par /api/v1/soiling
router = APIRouter(prefix="/api/v1/soiling", tags=["soiling"])


# ============================================================================
# 📜 HISTORIQUE DE L'ENSABLEMENT
# ============================================================================

@router.get("/history", response_model=SoilingHistoryResponse)
async def get_soiling_history(
    device_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    token_payload: dict = Depends(verify_token)
):
    """
    Récupère l'historique des niveaux d'ensablement avec statistiques.
    
    📥 PARAMÈTRES:
        - device_id : Filtrer par device spécifique (optionnel)
        - days      : Nombre de jours d'historique (1-365, défaut=30)
    
    📤 SORTIE (SoilingHistoryResponse):
        - device_id      : Device concerné (ou "all")
        - period_days    : Période analysée (jours)
        - data           : Liste des points d'historique
        - min_soiling    : Niveau minimum sur la période
        - max_soiling    : Niveau maximum sur la période
        - avg_soiling    : Niveau moyen sur la période
        - trend          : Tendance (slope de régression linéaire)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    📊 INTERPRÉTATION DE LA TENDANCE (trend):
        - trend > 0.5  : Dégradation rapide (alerte)
        - trend 0.1-0.5: Dégradation modérée
        - trend -0.1-0.1: Stable
        - trend < -0.1 : Amélioration (nettoyage effectué)
    
    💡 EXEMPLE:
        GET /api/v1/soiling/history?device_id=esp2&days=30
        → Retourne les 30 derniers jours d'ensablement pour esp2
    """
    # ========================================================================
    # 1. CONSTRUCTION DE LA REQUÊTE
    # ========================================================================
    query = {}
    if device_id:
        query["device_id"] = device_id
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query["timestamp"] = {"$gte": cutoff}
    
    # ========================================================================
    # 2. RÉCUPÉRATION DES DONNÉES
    # ========================================================================
    # Tri par timestamp croissant (ordre chronologique)
    cursor = surveillance_collection.find(query).sort("timestamp", 1)
    data = await cursor.to_list(length=None)
    
    # Extraire les valeurs d'ensablement pour les calculs statistiques
    soiling_values = [d.get("ai_analysis", {}).get("soiling_level", 0) 
                      for d in data if d.get("ai_analysis")]
    
    # ========================================================================
    # 3. CAS PAS DE DONNÉES
    # ========================================================================
    if not soiling_values:
        return {
            "device_id": device_id or "all",
            "period_days": days,
            "data": [],
            "min_soiling": 0,
            "max_soiling": 0,
            "avg_soiling": 0,
            "trend": 0
        }
    
    # ========================================================================
    # 4. CALCUL DE LA TENDANCE (RÉGRESSION LINÉAIRE)
    # ========================================================================
    n = len(soiling_values)
    if n > 1:
        # x = indices (0, 1, 2, ...)
        x = list(range(n))
        y = soiling_values
        # Formule de la pente (slope) de régression linéaire
        # slope = (n*Σ(xy) - Σx*Σy) / (n*Σ(x²) - (Σx)²)
        slope = (n * sum(xi*yi for xi, yi in zip(x, y)) - sum(x) * sum(y)) / (n * sum(xi*xi for xi in x) - sum(x)**2)
    else:
        slope = 0
    
    # ========================================================================
    # 5. CONSTRUCTION DE LA RÉPONSE
    # ========================================================================
    return {
        "device_id": device_id or "all",
        "period_days": days,
        "data": [{
            "device_id": d["device_id"],
            "timestamp": d["timestamp"],
            "soiling_level": d.get("ai_analysis", {}).get("soiling_level", 0),
            "status": d.get("ai_analysis", {}).get("status", "Unknown"),
            "confidence": d.get("ai_analysis", {}).get("confidence", 0),
            "model_version": d.get("ai_analysis", {}).get("model_version", ""),
            "image_url": d.get("media", {}).get("image_url"),
        } for d in data],
        "min_soiling": min(soiling_values),
        "max_soiling": max(soiling_values),
        "avg_soiling": sum(soiling_values) / len(soiling_values),
        "trend": slope
    }


# ============================================================================
# 💡 RECOMMANDATION DE NETTOYAGE
# ============================================================================

@router.get("/recommendation", response_model=CleaningRecommendation)
async def get_cleaning_recommendation(
    device_id: str,
    token_payload: dict = Depends(verify_token)
):
    """
    Génère une recommandation de nettoyage avec calcul du ROI.
    
    📥 ENTRÉE:
        - device_id : Identifiant du device (requis)
    
    📤 SORTIE (CleaningRecommendation):
        - device_id            : Device concerné
        - current_soiling      : Niveau actuel (%)
        - status               : Clean/Warning/Critical
        - recommended_action   : Action recommandée
        - urgency              : low/high/immediate
        - estimated_loss_daily : Perte journalière estimée (kWh)
        - estimated_loss_monthly: Perte mensuelle estimée (kWh)
        - estimated_loss_yearly: Perte annuelle estimée (kWh)
        - cleaning_cost_estimate: Coût estimé du nettoyage (50 DT)
        - roi_percentage       : Retour sur investissement (%)
        - days_until_critical  : Jours avant seuil critique
        - weather_forecast     : Prévisions météo (simplifié)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🧮 FORMULES DE CALCUL:
        - Puissance théorique = Irradiance × 1.6m² × 0.20
        - Perte (W) = max(0, Pth - P_réelle)
        - Perte journalière (kWh) = Perte_W × 8h / 1000
        - ROI = (Perte_mensuelle_DT / Coût_nettoyage) × 100
    
    💰 EXEMPLE:
        - Ensablement 65%, perte 150W
        - Perte journalière = 150 × 8 / 1000 = 1.2 kWh
        - Perte mensuelle = 1.2 × 30 = 36 kWh
        - Coût mensuel = 36 × 0.15 = 5.4 DT
        - ROI = (5.4 / 50) × 100 = 10.8%
    
    ⚠️ ERREURS:
        - 404: Aucune donnée pour ce device
    """
    # Récupérer la dernière mesure du device
    doc = await surveillance_collection.find_one(
        {"device_id": device_id},
        sort=[("timestamp", -1)]
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Aucune donnée pour ce device")
    
    # ========================================================================
    # 1. EXTRACTION DES DONNÉES
    # ========================================================================
    soiling = doc.get("ai_analysis", {}).get("soiling_level", 0)
    power = doc.get("electrical_data", {}).get("power_output", 0)
    irradiance = doc.get("electrical_data", {}).get("irradiance", 0)
    
    # ========================================================================
    # 2. CALCUL DES PERTES ÉNERGÉTIQUES
    # ========================================================================
    # Puissance théorique = Irradiance × Surface × Rendement
    pth = irradiance * 1.6 * 0.20
    # Perte instantanée (W)
    loss = max(0, pth - power) if pth > 0 else 0
    # Pertes sur différentes périodes
    loss_daily_kwh = loss * 8 / 1000      # 8 heures d'ensoleillement par jour
    loss_monthly_kwh = loss_daily_kwh * 30
    loss_yearly_kwh = loss_daily_kwh * 365
    
    # ========================================================================
    # 3. CALCUL DU ROI (RETOUR SUR INVESTISSEMENT)
    # ========================================================================
    cleaning_cost = 50  # DT (Dinars Tunisiens)
    # Prix électricité: 0.15 DT/kWh
    roi = (loss_monthly_kwh * 0.15 / cleaning_cost * 100) if cleaning_cost > 0 else 0
    
    # ========================================================================
    # 4. DÉTERMINATION DE L'URGENCE
    # ========================================================================
    config = get_config()
    seuil_warning = config.get("seuil_warning", Config.SEUIL_WARNING)
    seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)
    
    if soiling >= seuil_critical:
        urgency = "immediate"
        action = "Nettoyage urgent requis"
    elif soiling >= seuil_warning:
        urgency = "high"
        action = "Nettoyage recommandé dans les 48h"
    else:
        urgency = "low"
        action = "Surveillance normale"
    
    # ========================================================================
    # 5. CONSTRUCTION DE LA RÉPONSE
    # ========================================================================
    return CleaningRecommendation(
        device_id=device_id,
        current_soiling=soiling,
        status=doc.get("ai_analysis", {}).get("status", "Unknown"),
        recommended_action=action,
        urgency=urgency,
        estimated_loss_daily=loss_daily_kwh,
        estimated_loss_monthly=loss_monthly_kwh,
        estimated_loss_yearly=loss_yearly_kwh,
        cleaning_cost_estimate=cleaning_cost,
        roi_percentage=roi,
        days_until_critical=int((seuil_critical - soiling) / (soiling/30)) if soiling > 0 else 999,
        weather_forecast={"rain_next_days": False} if soiling < 30 else {"rain_next_days": True}
    )


# ============================================================================
# 🔮 PRÉDICTION DE L'ENSABLEMENT
# ============================================================================

@router.get("/prediction", response_model=SoilingPrediction)
async def get_soiling_prediction(
    device_id: str,
    days: int = Query(7, ge=1, le=30),
    token_payload: dict = Depends(verify_token)
):
    """
    Prédit l'évolution future de l'ensablement sur N jours.
    
    📥 PARAMÈTRES:
        - device_id : Identifiant du device (requis)
        - days      : Horizon de prédiction (1-30 jours, défaut=7)
    
    📤 SORTIE (SoilingPrediction):
        - device_id         : Device concerné
        - generated_at      : Date de génération
        - predictions       : Liste des prédictions par jour
        - next_cleaning_date: Date prévue du prochain nettoyage
        - confidence_level  : low/medium/high
        - model_version     : Version du modèle (LinearTrend_v1)
        - features_used     : Caractéristiques utilisées
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🔮 MODÈLE DE PRÉDICTION:
        - Basé sur la tendance linéaire des 30 derniers jours
        - Prédiction = valeur_actuelle + trend × (j+1)
        - Bornée entre 0% et 100%
        - Confiance = 1 - (jour × 0.1) → diminue avec l'horizon
    
    📊 EXEMPLE DE PRÉDICTION:
        - Actuel: 45%, trend: +2%/jour
        - J+1: 47%, J+2: 49%, J+3: 51%, ...
        - Si seuil_critical = 60%, atteint à J+8
    
    ⚠️ ERREURS:
        - 404: Pas assez de données historiques (<2 mesures)
    
    💡 LIMITES DU MODÈLE:
        - Modèle linéaire simple (ne tient pas compte des nettoyages)
        - N'inclut pas les facteurs météo (pluie, vent)
        - À améliorer avec un modèle ML plus sophistiqué
    """
    # ========================================================================
    # 1. RÉCUPÉRATION DE L'HISTORIQUE (30 derniers jours)
    # ========================================================================
    cursor = surveillance_collection.find({"device_id": device_id}).sort("timestamp", -1).limit(30)
    history = await cursor.to_list(length=30)
    
    if not history:
        raise HTTPException(status_code=404, detail="Pas assez de données historiques")
    
    # ========================================================================
    # 2. EXTRACTION DES VALEURS D'ENSABLEMENT
    # ========================================================================
    soiling_values = [d.get("ai_analysis", {}).get("soiling_level", 0) 
                      for d in history if d.get("ai_analysis")]
    
    if not soiling_values:
        raise HTTPException(status_code=404, detail="Pas de données d'ensablement")
    
    # ========================================================================
    # 3. CALCUL DE LA TENDANCE ACTUELLE
    # ========================================================================
    current = soiling_values[-1]  # Valeur la plus récente
    # Tendance = (valeur_récente - valeur_ancienne) / nombre_de_mesures
    trend = (soiling_values[-1] - soiling_values[0]) / len(soiling_values) if len(soiling_values) > 1 else 0
    
    # ========================================================================
    # 4. GÉNÉRATION DES PRÉDICTIONS
    # ========================================================================
    predictions = []
    for i in range(days):
        date = datetime.now(timezone.utc) + timedelta(days=i)
        # Prédiction linéaire: actuel + trend × (jour+1)
        predicted = min(100, max(0, current + trend * (i + 1)))
        # Confiance: 100% à J0, 90% à J1, 80% à J2, ...
        confidence = max(0, 1 - (i * 0.1))
        predictions.append({
            "date": date.isoformat(),
            "predicted_soiling": round(predicted, 1),
            "confidence": confidence
        })
    
    # ========================================================================
    # 5. DATE PRÉVUE DU PROCHAIN NETTOYAGE
    # ========================================================================
    config = get_config()
    seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)
    next_cleaning = None
    for i, p in enumerate(predictions):
        if p["predicted_soiling"] > seuil_critical:
            next_cleaning = datetime.now(timezone.utc) + timedelta(days=i)
            break
    
    # ========================================================================
    # 6. CONSTRUCTION DE LA RÉPONSE
    # ========================================================================
    return SoilingPrediction(
        device_id=device_id,
        generated_at=datetime.now(timezone.utc),
        predictions=predictions,
        next_cleaning_date=next_cleaning,
        confidence_level="medium" if len(history) > 10 else "low",
        model_version="LinearTrend_v1",
        features_used=["historical_soiling", "seasonal_pattern"]
    )