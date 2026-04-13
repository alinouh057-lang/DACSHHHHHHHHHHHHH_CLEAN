# backend/tests/test_cleaning_service.py
"""
Tests pour le service de nettoyage
Exécution: python tests/test_cleaning_service.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.cleaning_service import CleaningService, get_theoretical_power, get_power_loss, get_cleaning_urgency


def test_theoretical_power():
    """Test calcul puissance théorique"""
    print("\n📊 Test puissance théorique...")
    
    # Cas normal
    power = CleaningService.calculate_theoretical_power(800)
    print(f"   Irradiance 800 W/m² → Puissance théorique: {power:.1f} W")
    assert power > 0
    
    # Cas limite
    power_zero = CleaningService.calculate_theoretical_power(0)
    print(f"   Irradiance 0 W/m² → Puissance théorique: {power_zero:.1f} W")
    assert power_zero == 0


def test_power_loss():
    """Test calcul perte de puissance"""
    print("\n📉 Test perte de puissance...")
    
    theoretical = 256  # 800 * 1.6 * 0.20
    actual = 230
    
    loss = CleaningService.calculate_power_loss(theoretical, actual)
    loss_percent = CleaningService.calculate_loss_percentage(theoretical, actual)
    
    print(f"   Théorique: {theoretical}W, Réelle: {actual}W")
    print(f"   Perte: {loss:.1f}W ({loss_percent:.1f}%)")
    
    assert loss == 26
    assert loss_percent == pytest.approx(10.16, 0.1)  # ~10.16%


def test_energy_loss():
    """Test calcul pertes énergétiques"""
    print("\n⚡ Test pertes énergétiques...")
    
    power_loss = 26  # Watts
    
    daily = CleaningService.calculate_daily_energy_loss(power_loss)
    monthly = CleaningService.calculate_monthly_energy_loss(daily)
    yearly = CleaningService.calculate_yearly_energy_loss(daily)
    
    print(f"   Perte de puissance: {power_loss}W")
    print(f"   Perte journalière: {daily:.2f} kWh")
    print(f"   Perte mensuelle: {monthly:.2f} kWh")
    print(f"   Perte annuelle: {yearly:.2f} kWh")
    
    assert daily > 0
    assert monthly == daily * 30
    assert yearly == daily * 365


def test_financial_loss():
    """Test calcul pertes financières"""
    print("\n💰 Test pertes financières...")
    
    monthly_loss_kwh = 6.24  # kWh
    financial_loss = CleaningService.calculate_financial_loss(monthly_loss_kwh)
    
    print(f"   Perte mensuelle: {monthly_loss_kwh} kWh")
    print(f"   Perte financière: {financial_loss:.2f} DT")
    
    assert financial_loss > 0


def test_roi():
    """Test calcul ROI"""
    print("\n📈 Test ROI...")
    
    monthly_loss_dt = 10.0
    roi = CleaningService.calculate_roi_percentage(monthly_loss_dt, cleaning_cost=50)
    
    print(f"   Perte mensuelle: {monthly_loss_dt} DT")
    print(f"   Coût nettoyage: 50 DT")
    print(f"   ROI: {roi:.1f}%")
    
    assert roi == 20.0


def test_urgency():
    """Test détermination urgence"""
    print("\n🚨 Test urgence nettoyage...")
    
    # Niveau propre
    urgency = CleaningService.determine_urgency(15)
    print(f"   Ensablement 15% → {urgency['urgency']} ({urgency['action']})")
    assert urgency['urgency'] == 'low'
    
    # Niveau warning
    urgency = CleaningService.determine_urgency(45)
    print(f"   Ensablement 45% → {urgency['urgency']} ({urgency['action']})")
    assert urgency['urgency'] == 'high'
    
    # Niveau critique
    urgency = CleaningService.determine_urgency(75)
    print(f"   Ensablement 75% → {urgency['urgency']} ({urgency['action']})")
    assert urgency['urgency'] == 'immediate'


def test_full_recommendation():
    """Test recommandation complète"""
    print("\n📋 Test recommandation complète...")
    
    recommendation = CleaningService.get_cleaning_recommendation(
        device_id="test_panel",
        soiling_level=45.5,
        actual_power=180,
        irradiance=800,
        status="Warning"
    )
    
    print("\n   RÉSULTAT:")
    for key, value in recommendation.items():
        print(f"      {key}: {value}")
    
    assert recommendation["device_id"] == "test_panel"
    assert recommendation["current_soiling"] == 45.5
    assert recommendation["urgency"] in ["low", "high", "immediate"]


def test_simple_functions():
    """Test des fonctions simplifiées"""
    print("\n🔧 Test fonctions simplifiées...")
    
    theoretical = get_theoretical_power(800)
    print(f"   get_theoretical_power(800) → {theoretical:.1f} W")
    
    loss = get_power_loss(256, 230)
    print(f"   get_power_loss(256, 230) → {loss:.1f} W")
    
    urgency = get_cleaning_urgency(45)
    print(f"   get_cleaning_urgency(45) → {urgency['urgency']}")
    
    assert theoretical > 0
    assert loss > 0


if __name__ == "__main__":
    import pytest
    print("="*50)
    print("🧪 TEST DU SERVICE DE NETTOYAGE")
    print("="*50)
    
    test_theoretical_power()
    test_power_loss()
    test_energy_loss()
    test_financial_loss()
    test_roi()
    test_urgency()
    test_full_recommendation()
    test_simple_functions()
    
    print("\n" + "="*50)
    print("✅ Tous les tests sont passés!")
    print("="*50)