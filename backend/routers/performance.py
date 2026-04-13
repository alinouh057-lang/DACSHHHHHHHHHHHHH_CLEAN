# ============================================================================
# FICHIER: performance.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier calcule les indicateurs clés de performance (KPIs)
#   des panneaux solaires. Il permet d'évaluer l'efficacité énergétique,
#   le rendement et les pertes du système photovoltaïque.
#
# 📥 ENDPOINT:
#   GET /api/v1/performance/kpis - Récupère les KPIs de performance
#
# 📊 INDICATEURS CALCULÉS (PerformanceMetrics):
#   - energy_daily_kwh     : Énergie produite par jour (kWh)
#   - energy_monthly_kwh   : Énergie produite par mois (kWh)
#   - energy_yearly_kwh    : Énergie produite par an (kWh)
#   - performance_ratio    : Ratio de performance (PR) - 0 à 1.2
#   - specific_yield       : Rendement spécifique (kWh/kWc)
#   - capacity_factor      : Facteur de capacité (0-1)
#   - availability         : Disponibilité du système (0-1)
#   - soiling_loss_kwh     : Perte due à l'ensablement (kWh)
#   - temperature_loss_kwh : Perte due à la température (kWh)
#   - other_losses_kwh     : Autres pertes (kWh)
#   - degradation_rate     : Taux de dégradation annuel (%)
#
# 📈 PÉRIODES DISPONIBLES:
#   - day   : Dernières 24 heures
#   - week  : Derniers 7 jours
#   - month : Derniers 30 jours
#   - year  : Derniers 365 jours
#
# 🔐 AUTHENTIFICATION:
#   - Requise (verify_token)
#
# 🧮 FORMULES DE CALCUL:
#   - Performance Ratio (PR) = Puissance_réelle / (Irradiance × Surface × Rendement)
#   - Specific Yield = Énergie / Puissance_crête (3 kWc)
#   - Capacity Factor = Énergie / (Puissance_crête × 24h)
#
# ⚠️ NOTES:
#   - Utilise des approximations (surface 1.6m², rendement 20%)
#   - Les pertes sont estimées (10% ensablement, 5% température, 2% autres)
#   - En l'absence de données, retourne des valeurs par défaut
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timedelta, timezone
from database import surveillance_collection
from auth import verify_token
from schemas import PerformanceKPIResponse, PerformanceMetrics
import logging

logger = logging.getLogger(__name__)

# Création du routeur pour les endpoints de performance
# Toutes les routes commenceront par /api/v1/performance
router = APIRouter(prefix="/api/v1/performance", tags=["performance"])


# ============================================================================
# 📈 INDICATEURS CLÉS DE PERFORMANCE (KPIs)
# ============================================================================

@router.get("/kpis", response_model=PerformanceKPIResponse)
async def get_performance_kpis(
    device_id: Optional[str] = None,
    period: str = "day",
    token_payload: dict = Depends(verify_token)
):
    """
    Calcule les indicateurs clés de performance pour une période donnée.
    
    📥 PARAMÈTRES:
        - device_id : Filtrer par device spécifique (optionnel)
        - period    : Période d'analyse (day/week/month/year, défaut=day)
    
    📤 SORTIE: Objet PerformanceKPIResponse contenant:
        - device_id          : Device concerné (ou "all")
        - period             : Période analysée
        - start_date         : Date de début
        - end_date           : Date de fin
        - metrics            : Objet PerformanceMetrics avec tous les KPIs
        - comparison_vs_previous: Comparaison avec période précédente
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🧮 EXEMPLE DE CALCUL (Période jour):
        - Données: 10 mesures sur 24h
        - Puissance moyenne: 125W
        - Irradiance moyenne: 850W/m²
        - Performance Ratio = 125 / (850 × 1.6 × 0.20) = 125 / 272 = 0.46
        - Énergie journalière = (125 × 24) / 1000 = 3.0 kWh
    
    📊 INTERPRÉTATION:
        - PR > 0.8 : Très bon rendement
        - PR 0.6-0.8 : Rendement correct
        - PR < 0.6 : Perte significative (ensablement probable)
        - Capacity Factor > 0.25 : Bonne production
    
    ⚠️ NOTES IMPORTANTES:
        - Les calculs supposent une puissance crête de 3 kWc
        - Surface standard: 1.6 m² par panneau
        - Rendement standard: 20%
    """
    
    # ========================================================================
    # 1. CONSTRUCTION DE LA REQUÊTE
    # ========================================================================
    query = {}
    if device_id:
        query["device_id"] = device_id
    
    # Déterminer la date de début selon la période
    now = datetime.now(timezone.utc)
    if period == "day":
        start = now - timedelta(days=1)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    else:  # year ou autre
        start = now - timedelta(days=365)
    
    query["timestamp"] = {"$gte": start}
    
    # ========================================================================
    # 2. RÉCUPÉRATION DES DONNÉES
    # ========================================================================
    cursor = surveillance_collection.find(query)
    data = await cursor.to_list(length=None)
    
    # Si aucune donnée, retourner des valeurs par défaut
    if not data:
        logger.warning(f"Aucune donnée pour la période {period}")
        return PerformanceKPIResponse(
            device_id=device_id or "all",
            period=period,
            start_date=start,
            end_date=now,
            metrics=PerformanceMetrics(
                device_id=device_id or "all",
                date=now,
                energy_daily_kwh=0,
                energy_monthly_kwh=0,
                energy_yearly_kwh=0,
                performance_ratio=0,
                specific_yield=0,
                capacity_factor=0,
                availability=0.99,
                soiling_loss_kwh=0,
                temperature_loss_kwh=0,
                other_losses_kwh=0,
                degradation_rate=0.5
            ),
            comparison_vs_previous={"energy": 0, "pr": 0}
        )
    
    # ========================================================================
    # 3. CALCUL DES MÉTRIQUES DE BASE
    # ========================================================================
    try:
        total_power = 0
        total_irradiance = 0
        count = 0
        
        for d in data:
            electrical = d.get("electrical_data", {})
            power = electrical.get("power_output", 0)
            irrad = electrical.get("irradiance", 0)
            
            if power is not None:
                total_power += power
            if irrad is not None:
                total_irradiance += irrad
            count += 1
        
        # Éviter la division par zéro
        if count == 0:
            count = 1
        
        # Moyennes sur la période
        avg_power = total_power / count
        avg_irradiance = total_irradiance / count if total_irradiance > 0 else 0
        
        # Conversion en kWh (approximation)
        # Pour "day", on suppose que les mesures couvrent toute la journée
        total_energy = (total_power / 1000) * (24 if period == "day" else 1)
        
        # ====================================================================
        # 4. PERFORMANCE RATIO (PR)
        # ====================================================================
        # Formule: PR = Puissance_réelle / (Irradiance × Surface × Rendement)
        # Surface = 1.6 m², Rendement = 0.20 (20%)
        if avg_irradiance > 0:
            pr = avg_power / (avg_irradiance * 1.6 * 0.20)
            pr = min(pr, 1.2)  # Limiter à 120% maximum (erreurs de mesure)
        else:
            pr = 0
        
        # ====================================================================
        # 5. CONSTRUCTION DE LA RÉPONSE
        # ====================================================================
        metrics = PerformanceMetrics(
            device_id=device_id or "all",
            date=now,
            energy_daily_kwh=round(total_energy, 2),
            energy_monthly_kwh=round(total_energy * 30, 2),
            energy_yearly_kwh=round(total_energy * 365, 2),
            performance_ratio=round(pr, 3),
            specific_yield=round(total_energy / 3.0, 2) if total_energy > 0 else 0,
            capacity_factor=round(total_energy / (3.0 * 24), 3) if total_energy > 0 else 0,
            availability=0.99,  # À calculer plus tard avec les heartbeats
            soiling_loss_kwh=round(total_energy * 0.1, 2),  # Estimation 10%
            temperature_loss_kwh=round(total_energy * 0.05, 2),  # Estimation 5%
            other_losses_kwh=round(total_energy * 0.02, 2),  # Estimation 2%
            degradation_rate=0.5  # Valeur par défaut (0.5%/an)
        )
        
        return PerformanceKPIResponse(
            device_id=device_id or "all",
            period=period,
            start_date=start,
            end_date=now,
            metrics=metrics,
            comparison_vs_previous={"energy": 0, "pr": 0}  # TODO: Implémenter
        )
        
    except Exception as e:
        logger.error(f"Erreur calcul KPIs: {e}")
        # En cas d'erreur, retourner des valeurs par défaut
        return PerformanceKPIResponse(
            device_id=device_id or "all",
            period=period,
            start_date=start,
            end_date=now,
            metrics=PerformanceMetrics(
                device_id=device_id or "all",
                date=now,
                energy_daily_kwh=0,
                energy_monthly_kwh=0,
                energy_yearly_kwh=0,
                performance_ratio=0,
                specific_yield=0,
                capacity_factor=0,
                availability=0.99,
                soiling_loss_kwh=0,
                temperature_loss_kwh=0,
                other_losses_kwh=0,
                degradation_rate=0.5
            ),
            comparison_vs_previous={"energy": 0, "pr": 0}
        )