# backend/tests/test_alert_service.py
"""
Tests pour le service d'alertes
Exécution: python tests/test_alert_service.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from services.alert_service import AlertService
from schemas import AlertType, AlertSeverity


async def test_create_alert():
    """Test de création d'alerte simple"""
    print("\n📝 Test création alerte simple...")
    
    alert = await AlertService.create_alert(
        device_id="test_device",
        alert_type=AlertType.SYSTEM,
        severity=AlertSeverity.INFO,
        title="Test alerte",
        message="Ceci est un test",
        value=42,
        threshold=50
    )
    
    if alert:
        print(f"   ✅ Alerte créée: {alert.id}")
        print(f"      Titre: {alert.title}")
        print(f"      Message: {alert.message}")
        return alert
    else:
        print("   ⚠️ Aucune alerte créée (peut-être déjà existante)")
        return None


async def test_create_soiling_alert():
    """Test de création d'alerte d'ensablement"""
    print("\n🧹 Test alerte ensablement...")
    
    # Alerte Warning
    alert_warning = await AlertService.create_soiling_alert(
        device_id="test_device",
        soiling_level=45.5,
        threshold=30,
        is_critical=False
    )
    
    if alert_warning:
        print(f"   ✅ Alerte WARNING créée: {alert_warning.id}")
    
    # Alerte Critical
    alert_critical = await AlertService.create_soiling_alert(
        device_id="test_device_2",
        soiling_level=85.0,
        threshold=60,
        is_critical=True
    )
    
    if alert_critical:
        print(f"   ✅ Alerte CRITICAL créée: {alert_critical.id}")


async def test_resolve_alert():
    """Test de résolution d'alerte"""
    print("\n✅ Test résolution alerte...")
    
    # Créer d'abord une alerte
    alert = await AlertService.create_alert(
        device_id="test_device",
        alert_type=AlertType.SYSTEM,
        severity=AlertSeverity.INFO,
        title="À résoudre",
        message="Cette alerte sera résolue"
    )
    
    if alert:
        success = await AlertService.resolve_alert(alert.id, "Test résolu")
        if success:
            print(f"   ✅ Alerte {alert.id} résolue avec succès")
        else:
            print(f"   ❌ Échec résolution")
    else:
        print("   ⚠️ Aucune alerte à résoudre")


async def test_get_unresolved_alerts():
    """Test de récupération des alertes non résolues"""
    print("\n📋 Test récupération alertes non résolues...")
    
    alerts = await AlertService.get_unresolved_alerts()
    print(f"   📊 {len(alerts)} alertes non résolues")
    
    for alert in alerts[:5]:
        print(f"      - {alert['title']} ({alert['severity']})")


async def main():
    print("="*50)
    print("🧪 TEST DU SERVICE D'ALERTES")
    print("="*50)
    
    await test_create_alert()
    await test_create_soiling_alert()
    await test_resolve_alert()
    await test_get_unresolved_alerts()
    
    print("\n" + "="*50)
    print("✅ Tests terminés")
    print("="*50)


if __name__ == "__main__":
    asyncio.run(main())