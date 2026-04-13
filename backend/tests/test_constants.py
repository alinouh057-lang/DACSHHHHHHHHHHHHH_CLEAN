# backend/tests/test_constants.py
"""
Tests pour le fichier des constantes
Exécution: python tests/test_constants.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.constants import (
    DEFAULT_PANEL_AREA_M2,
    DEFAULT_PANEL_EFFICIENCY,
    DEFAULT_CLEANING_COST,
    ENERGY_PRICE_DT_PER_KWH,
    SUN_HOURS_PER_DAY,
    JWT_DEVICE_TOKEN_DAYS,
    VERIFICATION_CODE_LENGTH,
    DEFAULT_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_THRESHOLD,
    COLOR_CLEAN,
    COLOR_WARNING,
    COLOR_CRITICAL,
    get_constant,
    get_all_constants
)


def test_panel_constants():
    """Test des constantes panneaux"""
    print("\n📊 Test constantes panneaux...")
    
    assert DEFAULT_PANEL_AREA_M2 == 1.6
    assert DEFAULT_PANEL_EFFICIENCY == 0.20
    print(f"   ✅ Surface: {DEFAULT_PANEL_AREA_M2} m²")
    print(f"   ✅ Rendement: {DEFAULT_PANEL_EFFICIENCY * 100}%")


def test_economic_constants():
    """Test des constantes économiques"""
    print("\n💰 Test constantes économiques...")
    
    assert DEFAULT_CLEANING_COST == 50
    assert ENERGY_PRICE_DT_PER_KWH == 0.15
    print(f"   ✅ Coût nettoyage: {DEFAULT_CLEANING_COST} DT")
    print(f"   ✅ Prix kWh: {ENERGY_PRICE_DT_PER_KWH} DT")


def test_time_constants():
    """Test des constantes temporelles"""
    print("\n⏱️ Test constantes temporelles...")
    
    assert SUN_HOURS_PER_DAY == 8
    print(f"   ✅ Heures d'ensoleillement: {SUN_HOURS_PER_DAY} h/jour")


def test_auth_constants():
    """Test des constantes d'authentification"""
    print("\n🔐 Test constantes authentification...")
    
    assert JWT_DEVICE_TOKEN_DAYS == 30
    assert VERIFICATION_CODE_LENGTH == 6
    print(f"   ✅ Token device: {JWT_DEVICE_TOKEN_DAYS} jours")
    print(f"   ✅ Code vérification: {VERIFICATION_CODE_LENGTH} chiffres")


def test_threshold_constants():
    """Test des constantes de seuils"""
    print("\n⚠️ Test constantes seuils...")
    
    assert DEFAULT_WARNING_THRESHOLD == 30
    assert DEFAULT_CRITICAL_THRESHOLD == 60
    print(f"   ✅ Seuil warning: {DEFAULT_WARNING_THRESHOLD}%")
    print(f"   ✅ Seuil critical: {DEFAULT_CRITICAL_THRESHOLD}%")


def test_color_constants():
    """Test des constantes de couleurs"""
    print("\n🎨 Test constantes couleurs...")
    
    assert COLOR_CLEAN == "#1a7f4f"
    assert COLOR_WARNING == "#c47d0e"
    assert COLOR_CRITICAL == "#c0392b"
    print(f"   ✅ Clean: {COLOR_CLEAN}")
    print(f"   ✅ Warning: {COLOR_WARNING}")
    print(f"   ✅ Critical: {COLOR_CRITICAL}")


def test_get_constant_function():
    """Test de la fonction get_constant"""
    print("\n🔧 Test fonction get_constant...")
    
    value = get_constant("DEFAULT_PANEL_AREA_M2", 999)
    assert value == 1.6
    print(f"   ✅ get_constant('DEFAULT_PANEL_AREA_M2') → {value}")
    
    default_value = get_constant("NON_EXISTANTE", 999)
    assert default_value == 999
    print(f"   ✅ get_constant('NON_EXISTANTE', 999) → {default_value}")


def test_get_all_constants_function():
    """Test de la fonction get_all_constants"""
    print("\n📋 Test fonction get_all_constants...")
    
    constants = get_all_constants()
    assert isinstance(constants, dict)
    assert len(constants) > 20
    print(f"   ✅ {len(constants)} constantes chargées")


def run_all_tests():
    """Exécute tous les tests"""
    print("="*50)
    print("🧪 TEST DU FICHIER DES CONSTANTES")
    print("="*50)
    
    tests = [
        ("Constantes panneaux", test_panel_constants),
        ("Constantes économiques", test_economic_constants),
        ("Constantes temporelles", test_time_constants),
        ("Constantes authentification", test_auth_constants),
        ("Constantes seuils", test_threshold_constants),
        ("Constantes couleurs", test_color_constants),
        ("Fonction get_constant", test_get_constant_function),
        ("Fonction get_all_constants", test_get_all_constants_function),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"   ❌ {name} échoué: {e}")
            failed += 1
        except Exception as e:
            print(f"   ❌ {name} erreur: {e}")
            failed += 1
    
    print("\n" + "="*50)
    print(f"📊 RÉSULTATS: {passed} réussis, {failed} échoués")
    print("="*50)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)