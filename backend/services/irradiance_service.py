# ============================================================================
# FICHIER: irradiance_service.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier contient le service de gestion de l'irradiance solaire.
#   Il permet de récupérer les données d'ensoleillement (W/m²) en fonction
#   des coordonnées GPS configurées dans l'interface d'administration.
#
# 🌞 QU'EST-CE QUE L'IRRADIANCE?
#   L'irradiance est la puissance du rayonnement solaire reçue par unité
#   de surface (W/m²). Elle est essentielle pour calculer la puissance
#   théorique des panneaux solaires et évaluer leurs performances.
#
# 📊 VALEURS TYPIQUES:
#   - Nuit : 0 W/m²
#   - Lever/coucher : 50-200 W/m²
#   - Nuageux : 200-500 W/m²
#   - Soleil voilé : 500-800 W/m²
#   - Plein soleil : 800-1100 W/m²
#   - Maximum théorique : ~1366 W/m² (constante solaire)
#
# 🗺️ SOURCE DES DONNÉES:
#   - Utilise le module weather.getirradiance() qui appelle une API météo
#   - Les coordonnées GPS sont configurées dans l'admin
#   - Si non configurées, retourne 0.0 (pas d'irradiance)
#
# 🔧 UTILISATION:
#   Ce service est utilisé par:
#   - routers/ingest.py (calcul de l'irradiance pour les ESP32)
#   - routers/performance.py (calcul du Performance Ratio)
#   - routers/soiling.py (calcul des pertes)
#
# ============================================================================

"""
Service de gestion de l'irradiance solaire
Centralise la logique de récupération des données d'ensoleillement
"""

import logging
from typing import Optional, Tuple
from config_manager import get_config
from weather import getirradiance

logger = logging.getLogger(__name__)


# ============================================================================
# 🌞 SERVICE D'IRRADIANCE SOLAIRE
# ============================================================================

class IrradianceService:
    """
    Service pour la récupération de l'irradiance solaire.
    Utilise les coordonnées GPS configurées dans l'interface admin.
    
    Méthodes principales:
        - get_coordinates()              : Récupère les coordonnées GPS
        - are_coordinates_configured()   : Vérifie si coordonnées existent
        - get_current_irradiance()       : Irradiance depuis coordonnées configurées
        - get_irradiance_with_coords()   : Irradiance pour coordonnées spécifiques
    """
    
    @staticmethod
    def get_coordinates() -> Tuple[Optional[float], Optional[float]]:
        """
        Récupère les coordonnées GPS depuis la configuration globale.
        
        📤 SORTIE:
            Tuple[Optional[float], Optional[float]]: (latitude, longitude)
            - Si configurées: (36.8065, 10.1815)
            - Si non configurées: (None, None)
        
        📍 SOURCE: config_dynamic.json (latitude, longitude)
        """
        config = get_config()
        latitude = config.get("latitude")
        longitude = config.get("longitude")
        return latitude, longitude
    
    @staticmethod
    def are_coordinates_configured() -> bool:
        """
        Vérifie si les coordonnées GPS sont configurées dans l'admin.
        
        📤 SORTIE:
            bool: True si latitude ET longitude sont définies (non None)
        
        💡 UTILISATION:
            Vérifier avant d'appeler get_current_irradiance()
            pour éviter des erreurs ou des appels API inutiles.
        """
        lat, lon = IrradianceService.get_coordinates()
        return lat is not None and lon is not None
    
    @staticmethod
    async def get_current_irradiance() -> float:
        """
        Récupère l'irradiance actuelle à partir des coordonnées configurées.
        
        📤 SORTIE:
            float: Irradiance en W/m²
            - 0.0 si coordonnées non configurées
            - 0.0 si erreur API ou pas de données
        
        🌐 APPEL API:
            getirradiance(latitude, longitude) → float
        
        📝 EXEMPLE:
            irradiance = await IrradianceService.get_current_irradiance()
            # Retourne par exemple: 850.5 (W/m²)
        
        ⚠️ NOTE: Appelle une API externe (donc asynchrone)
        """
        # Vérifier que les coordonnées sont configurées
        if not IrradianceService.are_coordinates_configured():
            logger.warning("⚠️ Coordonnées globales non configurées")
            return 0.0
        
        lat, lon = IrradianceService.get_coordinates()
        
        try:
            # Appel à l'API météo externe
            irradiance = getirradiance(lat, lon)
            if irradiance:
                irradiance = float(irradiance)
                logger.info(f"🌞 Irradiance récupérée: {irradiance:.1f} W/m² (lat={lat}, lon={lon})")
                return irradiance
            else:
                logger.warning(f"⚠️ Aucune irradiance reçue pour lat={lat}, lon={lon}")
                return 0.0
        except Exception as e:
            logger.error(f"❌ Erreur récupération irradiance: {e}")
            return 0.0
    
    @staticmethod
    async def get_irradiance_with_coords(latitude: float, longitude: float) -> float:
        """
        Récupère l'irradiance pour des coordonnées GPS spécifiques.
        
        📥 ENTRÉE:
            latitude (float): Latitude GPS (-90 à 90)
            longitude (float): Longitude GPS (-180 à 180)
        
        📤 SORTIE:
            float: Irradiance en W/m² (0.0 si erreur)
        
        💡 UTILISATION:
            Utile pour des devices mobiles ou des tests
            avec des coordonnées différentes de la configuration globale.
        
        🌐 APPEL API:
            getirradiance(latitude, longitude) → float
        """
        try:
            irradiance = getirradiance(latitude, longitude)
            if irradiance:
                return float(irradiance)
            return 0.0
        except Exception as e:
            logger.error(f"❌ Erreur récupération irradiance: {e}")
            return 0.0


# ============================================================================
# 🚀 FONCTIONS SIMPLIFIÉES POUR APPEL DIRECT
# ============================================================================
# Ces fonctions permettent d'appeler le service d'irradiance sans instanciation
# Elles sont utilisées par d'autres modules (ingest.py, performance.py, etc.)

async def get_irradiance_from_config() -> float:
    """
    Version simplifiée pour récupérer l'irradiance depuis la configuration.
    
    📤 SORTIE:
        float: Irradiance en W/m² (0.0 si erreur ou non configuré)
    
    💡 EXEMPLE:
        irradiance = await get_irradiance_from_config()
    """
    return await IrradianceService.get_current_irradiance()


def are_coordinates_configured() -> bool:
    """
    Version simplifiée pour vérifier si les coordonnées sont configurées.
    
    📤 SORTIE:
        bool: True si latitude et longitude sont définies
    
    💡 EXEMPLE:
        if are_coordinates_configured():
            irradiance = await get_irradiance_from_config()
    """
    return IrradianceService.are_coordinates_configured()


def get_coordinates() -> Tuple[Optional[float], Optional[float]]:
    """
    Version simplifiée pour récupérer les coordonnées GPS.
    
    📤 SORTIE:
        Tuple[Optional[float], Optional[float]]: (latitude, longitude)
    
    💡 EXEMPLE:
        lat, lon = get_coordinates()
        if lat and lon:
            print(f"Position: {lat}, {lon}")
    """
    return IrradianceService.get_coordinates()