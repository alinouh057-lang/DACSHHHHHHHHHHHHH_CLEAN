# ============================================================================
# FICHIER: cleaning_service.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient le service de calcul des recommandations de nettoyage.
#   Il centralise toute la logique métier liée aux pertes énergétiques,
#   au calcul du ROI (Retour Sur Investissement) et à l'urgence du nettoyage
#   des panneaux solaires.
#
# 🏗️ ARCHITECTURE:
#   - Classe CleaningService avec méthodes statiques (design pattern Service)
#   - Fonctions simplifiées pour un appel direct depuis d'autres modules
#
# 🧮 FORMULES DE CALCUL:
#   1. Puissance théorique (W) = Irradiance × Surface × Rendement
#   2. Perte de puissance (W) = max(0, P_théorique - P_réelle)
#   3. Perte énergétique journalière (kWh) = Perte_W × 8h / 1000
#   4. Perte financière (DT) = Perte_kWh × 0.15 DT/kWh
#   5. ROI (%) = (Perte_mensuelle_DT / Coût_nettoyage) × 100
#
# 📊 CONSTANTES (adaptables via configuration):
#   - Surface panneau standard: 1.6 m²
#   - Rendement standard: 20%
#   - Coût nettoyage: 50 DT
#   - Prix électricité: 0.15 DT/kWh
#   - Heures d'ensoleillement: 8h/jour
#
# 🚨 URGENCE DU NETTOYAGE:
#   - Clean (soiling < seuil_warning)     → low, "Surveillance normale"
#   - Warning (soiling >= seuil_warning)  → high, "Nettoyage recommandé dans 48h"
#   - Critical (soiling >= seuil_critical)→ immediate, "Nettoyage urgent requis"
#
# 🔧 UTILISATION:
#   Ce service est utilisé par:
#   - routers/soiling.py (recommandation de nettoyage)
#   - routers/data.py (calcul des pertes)
#   - alert_task.py (déclenchement d'alertes)
#
# ============================================================================

"""
Service de calcul des recommandations de nettoyage
Centralise la logique de calcul des pertes et du ROI
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from config_manager import get_config
from config import Config

logger = logging.getLogger(__name__)


# ============================================================================
# 🧹 SERVICE DE CALCUL POUR LE NETTOYAGE
# ============================================================================

class CleaningService:
    """
    Service pour les calculs liés au nettoyage des panneaux solaires.
    
    Méthodes principales:
        - get_panel_params()              : Récupère les paramètres du panneau
        - calculate_theoretical_power()   : Calcule la puissance théorique
        - calculate_power_loss()          : Calcule la perte de puissance
        - calculate_loss_percentage()     : Calcule le % de perte
        - calculate_daily_energy_loss()   : Perte énergétique journalière
        - calculate_monthly_energy_loss() : Perte énergétique mensuelle
        - calculate_yearly_energy_loss()  : Perte énergétique annuelle
        - calculate_financial_loss()      : Perte financière (DT)
        - calculate_roi_percentage()      : Retour sur investissement (%)
        - determine_urgency()             : Urgence du nettoyage
        - calculate_days_until_critical() : Jours avant seuil critique
        - get_cleaning_recommendation()   : Recommandation complète
    """
    
    # ============================================================================
    # 📊 CONSTANTES PAR DÉFAUT
    # ============================================================================
    DEFAULT_PANEL_AREA = 1.6          # Surface standard d'un panneau (m²)
    DEFAULT_PANEL_EFFICIENCY = 0.20   # Rendement standard (20%)
    DEFAULT_CLEANING_COST = 50        # Coût standard d'un nettoyage (DT)
    ENERGY_PRICE = 0.15               # Prix de l'électricité (DT/kWh)
    SUN_HOURS_PER_DAY = 8             # Heures d'ensoleillement effectives par jour
    
    @classmethod
    def get_panel_params(cls) -> Dict[str, float]:
        """
        Récupère les paramètres du panneau depuis la configuration.
        
        📥 ENTRÉE: Aucune (lit la config globale)
        
        📤 SORTIE:
            dict: {
                'area': float,       # Surface en m²
                'efficiency': float  # Rendement (0-1)
            }
        
        💡 SOURCE: config_dynamic.json (panel_area_m2, panel_efficiency)
        """
        config = get_config()
        return {
            "area": config.get("panel_area_m2", cls.DEFAULT_PANEL_AREA),
            "efficiency": config.get("panel_efficiency", cls.DEFAULT_PANEL_EFFICIENCY)
        }
    
    @classmethod
    def calculate_theoretical_power(cls, irradiance: float) -> float:
        """
        Calcule la puissance théorique du panneau en conditions idéales.
        
        📥 ENTRÉE:
            irradiance: Irradiance solaire en W/m²
            
        📤 SORTIE:
            float: Puissance théorique en Watts
            
        🧮 FORMULE:
            Pth = Irradiance × Surface × Rendement
            Exemple: 850 W/m² × 1.6 m² × 0.20 = 272 W
        """
        params = cls.get_panel_params()
        return irradiance * params["area"] * params["efficiency"]
    
    @classmethod
    def calculate_power_loss(cls, theoretical_power: float, actual_power: float) -> float:
        """
        Calcule la perte de puissance due à l'ensablement.
        
        📥 ENTRÉE:
            theoretical_power: Puissance théorique (W)
            actual_power: Puissance réelle mesurée (W)
            
        📤 SORTIE:
            float: Perte en Watts (toujours >= 0)
        
        🧮 FORMULE:
            Perte = max(0, Pth - Préelle)
        """
        return max(0, theoretical_power - actual_power)
    
    @classmethod
    def calculate_loss_percentage(cls, theoretical_power: float, actual_power: float) -> float:
        """
        Calcule le pourcentage de perte par rapport à la puissance théorique.
        
        📥 ENTRÉE:
            theoretical_power: Puissance théorique (W)
            actual_power: Puissance réelle mesurée (W)
            
        📤 SORTIE:
            float: Pourcentage de perte (0-100)
        
        🧮 FORMULE:
            %Perte = (Perte / Pth) × 100
        """
        if theoretical_power <= 0:
            return 0
        loss = cls.calculate_power_loss(theoretical_power, actual_power)
        return (loss / theoretical_power) * 100
    
    @classmethod
    def calculate_daily_energy_loss(cls, power_loss: float) -> float:
        """
        Calcule la perte d'énergie sur une journée.
        
        📥 ENTRÉE:
            power_loss: Perte de puissance en Watts
            
        📤 SORTIE:
            float: Perte en kWh par jour
        
        🧮 FORMULE:
            Perte_kWh/jour = Perte_W × 8h / 1000
            (8 heures d'ensoleillement effectif)
        """
        return (power_loss * cls.SUN_HOURS_PER_DAY) / 1000
    
    @classmethod
    def calculate_monthly_energy_loss(cls, daily_loss: float) -> float:
        """
        Calcule la perte d'énergie sur un mois.
        
        📥 ENTRÉE:
            daily_loss: Perte journalière en kWh
            
        📤 SORTIE:
            float: Perte en kWh par mois (30 jours)
        """
        return daily_loss * 30
    
    @classmethod
    def calculate_yearly_energy_loss(cls, daily_loss: float) -> float:
        """
        Calcule la perte d'énergie sur une année.
        
        📥 ENTRÉE:
            daily_loss: Perte journalière en kWh
            
        📤 SORTIE:
            float: Perte en kWh par an (365 jours)
        """
        return daily_loss * 365
    
    @classmethod
    def calculate_financial_loss(cls, energy_loss_kwh: float) -> float:
        """
        Calcule la perte financière correspondant à la perte d'énergie.
        
        📥 ENTRÉE:
            energy_loss_kwh: Perte d'énergie en kWh
            
        📤 SORTIE:
            float: Perte en Dinars Tunisiens (DT)
        
        🧮 FORMULE:
            Perte_DT = Perte_kWh × 0.15 DT/kWh
        """
        return energy_loss_kwh * cls.ENERGY_PRICE
    
    @classmethod
    def calculate_roi_percentage(cls, monthly_loss_dt: float, cleaning_cost: float = None) -> float:
        """
        Calcule le Retour Sur Investissement (ROI) du nettoyage.
        
        📥 ENTRÉE:
            monthly_loss_dt: Perte mensuelle en DT
            cleaning_cost: Coût du nettoyage (optionnel, défaut 50 DT)
            
        📤 SORTIE:
            float: ROI en pourcentage
        
        🧮 FORMULE:
            ROI (%) = (Perte_mensuelle_DT / Coût_nettoyage) × 100
        
        📊 INTERPRÉTATION:
            - ROI > 100% : Rentable dès le premier mois
            - ROI 50-100% : Rentable en 1-2 mois
            - ROI < 50% : Rentabilité sur plusieurs mois
        """
        if cleaning_cost is None:
            cleaning_cost = cls.DEFAULT_CLEANING_COST
        
        if cleaning_cost <= 0:
            return 0
        
        return (monthly_loss_dt / cleaning_cost) * 100
    
    @classmethod
    def determine_urgency(cls, soiling_level: float) -> Dict[str, Any]:
        """
        Détermine l'urgence du nettoyage en fonction du niveau d'ensablement.
        
        📥 ENTRÉE:
            soiling_level: Niveau d'ensablement (%)
            
        📤 SORTIE:
            dict: {
                'urgency': str,   # "low", "high", "immediate"
                'action': str,    # Description de l'action recommandée
                'color': str,     # Code couleur hexadécimal
                'priority': str   # "low", "high", "critical"
            }
        
        📊 SEUILS:
            - Soiling < seuil_warning  → low
            - Soiling >= seuil_warning → high
            - Soiling >= seuil_critical→ immediate
        """
        config = get_config()
        seuil_warning = config.get("seuil_warning", Config.SEUIL_WARNING)
        seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)
        
        if soiling_level >= seuil_critical:
            return {
                "urgency": "immediate",
                "action": "Nettoyage urgent requis",
                "color": "#c0392b",
                "priority": "critical"
            }
        elif soiling_level >= seuil_warning:
            return {
                "urgency": "high",
                "action": "Nettoyage recommandé dans les 48h",
                "color": "#ef6c00",
                "priority": "high"
            }
        else:
            return {
                "urgency": "low",
                "action": "Surveillance normale",
                "color": "#1a7f4f",
                "priority": "low"
            }
    
    @classmethod
    def calculate_days_until_critical(cls, current_soiling: float, trend: float) -> int:
        """
        Calcule le nombre de jours avant d'atteindre le seuil critique.
        
        📥 ENTRÉE:
            current_soiling: Niveau d'ensablement actuel (%)
            trend: Tendance d'évolution (% par jour)
            
        📤 SORTIE:
            int: Nombre de jours (999 si tendance stable ou négative)
        
        🧮 FORMULE:
            Jours = (Seuil_critique - Soiling_actuel) / Tendance
        
        📊 INTERPRÉTATION:
            - 0 jours     : Déjà au-dessus du seuil critique
            - 1-7 jours   : Nettoyage urgent
            - 8-30 jours  : Planifier nettoyage
            - 999 jours   : Tendance stable ou amélioration
        """
        if trend <= 0 or current_soiling <= 0:
            return 999
        
        config = get_config()
        seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)
        
        if current_soiling >= seuil_critical:
            return 0
        
        days = int((seuil_critical - current_soiling) / trend)
        return max(0, days)
    
    @classmethod
    def get_cleaning_recommendation(
        cls,
        device_id: str,
        soiling_level: float,
        actual_power: float,
        irradiance: float,
        status: str
    ) -> Dict[str, Any]:
        """
        Génère une recommandation de nettoyage complète et détaillée.
        
        📥 ENTRÉE:
            device_id: Identifiant du dispositif
            soiling_level: Niveau d'ensablement (%)
            actual_power: Puissance réelle mesurée (W)
            irradiance: Irradiance mesurée (W/m²)
            status: Statut actuel (Clean, Warning, Critical)
            
        📤 SORTIE:
            dict: Recommandation complète avec:
                - Données techniques (puissances, pertes)
                - Données énergétiques (kWh)
                - Données financières (DT, ROI)
                - Actions recommandées
                - Niveau d'urgence
        
        🧮 CHAÎNE DE CALCUL:
            1. Puissance théorique = irradiance × surface × rendement
            2. Perte (W) = Pth - P_actuelle
            3. Perte journalière (kWh) = perte_W × 8h / 1000
            4. Perte mensuelle (kWh) = perte_journalière × 30
            5. Perte financière mensuelle (DT) = perte_mensuelle_kWh × 0.15
            6. ROI (%) = (perte_mensuelle_DT / 50) × 100
            7. Urgence = f(soiling_level)
        """
        # ====================================================================
        # 1. CALCULS DE BASE
        # ====================================================================
        theoretical_power = cls.calculate_theoretical_power(irradiance)
        power_loss = cls.calculate_power_loss(theoretical_power, actual_power)
        loss_percentage = cls.calculate_loss_percentage(theoretical_power, actual_power)
        
        # ====================================================================
        # 2. PERTES ÉNERGÉTIQUES
        # ====================================================================
        daily_loss_kwh = cls.calculate_daily_energy_loss(power_loss)
        monthly_loss_kwh = cls.calculate_monthly_energy_loss(daily_loss_kwh)
        yearly_loss_kwh = cls.calculate_yearly_energy_loss(daily_loss_kwh)
        
        # ====================================================================
        # 3. PERTES FINANCIÈRES
        # ====================================================================
        monthly_loss_dt = cls.calculate_financial_loss(monthly_loss_kwh)
        yearly_loss_dt = cls.calculate_financial_loss(yearly_loss_kwh)
        
        # ====================================================================
        # 4. RETOUR SUR INVESTISSEMENT (ROI)
        # ====================================================================
        roi = cls.calculate_roi_percentage(monthly_loss_dt)
        
        # ====================================================================
        # 5. URGENCE
        # ====================================================================
        urgency_info = cls.determine_urgency(soiling_level)
        
        # ====================================================================
        # 6. CONSTRUCTION DE LA RÉPONSE
        # ====================================================================
        return {
            "device_id": device_id,
            "current_soiling": round(soiling_level, 1),
            "status": status,
            "theoretical_power": round(theoretical_power, 1),
            "actual_power": round(actual_power, 1),
            "power_loss": round(power_loss, 1),
            "loss_percentage": round(loss_percentage, 1),
            "daily_loss_kwh": round(daily_loss_kwh, 2),
            "monthly_loss_kwh": round(monthly_loss_kwh, 2),
            "yearly_loss_kwh": round(yearly_loss_kwh, 2),
            "monthly_loss_dt": round(monthly_loss_dt, 2),
            "yearly_loss_dt": round(yearly_loss_dt, 2),
            "roi_percentage": round(roi, 1),
            "recommended_action": urgency_info["action"],
            "urgency": urgency_info["urgency"],
            "color": urgency_info["color"],
            "priority": urgency_info["priority"],
            "cleaning_cost_estimate": cls.DEFAULT_CLEANING_COST
        }


# ============================================================================
# 🚀 FONCTIONS SIMPLIFIÉES POUR APPEL DIRECT
# ============================================================================
# Ces fonctions permettent d'appeler le service sans instanciation
# Elles sont utilisées par d'autres modules (soiling.py, data.py, etc.)

def get_theoretical_power(irradiance: float) -> float:
    """
    Calcule la puissance théorique du panneau.
    
    📥 ENTRÉE: irradiance (W/m²)
    📤 SORTIE: Puissance théorique (W)
    """
    return CleaningService.calculate_theoretical_power(irradiance)


def get_power_loss(theoretical: float, actual: float) -> float:
    """
    Calcule la perte de puissance.
    
    📥 ENTRÉE:
        theoretical: Puissance théorique (W)
        actual: Puissance réelle (W)
    📤 SORTIE: Perte en Watts
    """
    return CleaningService.calculate_power_loss(theoretical, actual)


def get_cleaning_urgency(soiling_level: float) -> Dict[str, Any]:
    """
    Détermine l'urgence du nettoyage.
    
    📥 ENTRÉE: soiling_level (%)
    📤 SORTIE: Dictionnaire avec urgence, action, couleur, priorité
    """
    return CleaningService.determine_urgency(soiling_level)