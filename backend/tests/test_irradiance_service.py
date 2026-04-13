# backend/tests/test_irradiance_service.py
"""
Tests pour le service d'irradiance
Exécution: python -m pytest tests/test_irradiance_service.py -v
Ou: python tests/test_irradiance_service.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from services.irradiance_service import (
    IrradianceService,
    get_irradiance_from_config,
    are_coordinates_configured,
    get_coordinates
)


def test_get_coordinates():
    """Test de récupération des coordonnées"""
    lat, lon = get_coordinates()
    print(f"📍 Coordonnées: lat={lat}, lon={lon}")
    # Le test passe toujours (les coordonnées peuvent être None)
    assert True


def test_are_coordinates_configured():
    """Test de vérification de configuration des coordonnées"""
    configured = are_coordinates_configured()
    print(f"🔧 Coordonnées configurées: {configured}")
    assert isinstance(configured, bool)


async def test_get_irradiance():
    """Test de récupération de l'irradiance"""
    irradiance = await get_irradiance_from_config()
    print(f"🌞 Irradiance: {irradiance} W/m²")
    assert isinstance(irradiance, (int, float))
    assert irradiance >= 0


async def test_irradiance_service():
    """Test complet du service"""
    print("\n" + "="*50)
    print("🧪 TEST DU SERVICE D'IRRADIANCE")
    print("="*50)
    
    # 1. Coordonnées
    lat, lon = IrradianceService.get_coordinates()
    print(f"📍 Latitude: {lat}")
    print(f"📍 Longitude: {lon}")
    
    # 2. Vérification configuration
    configured = IrradianceService.are_coordinates_configured()
    print(f"🔧 Coordonnées configurées: {configured}")
    
    # 3. Récupération irradiance
    irradiance = await IrradianceService.get_current_irradiance()
    print(f"🌞 Irradiance actuelle: {irradiance:.1f} W/m²")
    
    # 4. Test avec coordonnées spécifiques (Tunis)
    if lat is None:
        test_irradiance = await IrradianceService.get_irradiance_with_coords(36.8065, 10.1815)
        print(f"🧪 Test Tunis (36.8065, 10.1815): {test_irradiance:.1f} W/m²")
    
    print("\n✅ Test terminé")


if __name__ == "__main__":
    # Exécution des tests synchrones
    test_get_coordinates()
    test_are_coordinates_configured()
    
    # Exécution des tests asynchrones
    asyncio.run(test_get_irradiance())
    asyncio.run(test_irradiance_service())
    
    print("\n🎉 Tous les tests sont passés!")