#!/usr/bin/env python3
"""
Script de test des endpoints du backend PV Monitor
Utilisation: python test_endpoints.py
"""

import requests
import json
import time
from datetime import datetime, timedelta

# ============================================================
# CONFIGURATION
# ============================================================
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

# Credentials de test
TEST_USER = {
    "email": "alinouh057@gmail.com",
    "password": "alinouh2000"
}

TEST_DEVICE = {
    "device_id": "test_device_002",
    "name": "Device de Test"
}

# ============================================================
# COULEURS POUR L'AFFICHAGE
# ============================================================
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️ {msg}{Colors.END}")

def print_header(msg):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{msg}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")

def print_endpoint(name, method, url, status, duration=None):
    status_color = Colors.GREEN if status < 300 else Colors.RED
    status_text = f"{status_color}{status}{Colors.END}"
    duration_text = f" ({duration:.2f}ms)" if duration else ""
    print(f"  {method:6} {url:<40} → {status_text}{duration_text}")

# ============================================================
# VARIABLES GLOBALES
# ============================================================
auth_token = None
test_device_id = None
test_alert_id = None
test_intervention_id = None

# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================
def make_request(method, endpoint, data=None, headers=None, files=None, auth=True):
    """Effectue une requête HTTP et retourne la réponse"""
    url = f"{BASE_URL}{API_PREFIX}{endpoint}"
    start_time = time.time()
    
    req_headers = {}
    if auth and auth_token:
        req_headers["Authorization"] = f"Bearer {auth_token}"
    if headers:
        req_headers.update(headers)
    
    try:
        if method == "GET":
            response = requests.get(url, headers=req_headers, timeout=30)
        elif method == "POST":
            if files:
                response = requests.post(url, headers=req_headers, files=files, data=data, timeout=30)
            else:
                req_headers["Content-Type"] = "application/json"
                response = requests.post(url, headers=req_headers, json=data, timeout=30)
        elif method == "PUT":
            req_headers["Content-Type"] = "application/json"
            response = requests.put(url, headers=req_headers, json=data, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=req_headers, timeout=30)
        else:
            return None
        
        duration = (time.time() - start_time) * 1000
        return response, duration
    except Exception as e:
        print_error(f"Erreur requête: {e}")
        return None, 0

def test_endpoint(name, method, endpoint, data=None, auth=True, expected_status=200):
    """Teste un endpoint et affiche le résultat"""
    print(f"  Testing {name}...", end=" ")
    response, duration = make_request(method, endpoint, data, auth=auth)
    
    if response is None:
        print_error("Erreur")
        return False
    
    status = response.status_code
    print_endpoint("", method, endpoint, status, duration)
    
    if status == expected_status:
        return response.json() if response.text else True
    else:
        print(f"      Expected {expected_status}, got {status}")
        if response.text:
            try:
                error = response.json()
                print(f"      Error: {error.get('detail', error)}")
            except:
                print(f"      Response: {response.text[:200]}")
        return False

# ============================================================
# TESTS D'AUTHENTIFICATION
# ============================================================
def test_auth():
    global auth_token
    print_header("🔐 TESTS D'AUTHENTIFICATION")
    
    # 1. Register device (pour le dashboard)
    result = test_endpoint(
        "Register device (dashboard)",
        "POST",
        "/auth/register-device",
        {"device_id": "dashboard"},
        auth=False,
        expected_status=200
    )
    if result and "access_token" in result:
        auth_token = result["access_token"]
        print_success("Token obtenu pour dashboard")
    
    # 2. Login utilisateur
    result = test_endpoint(
        "Login utilisateur",
        "POST",
        "/auth/login",
        TEST_USER,
        auth=False,
        expected_status=200
    )
    if result and "access_token" in result:
        auth_token = result["access_token"]
        print_success("Login réussi")
    
    # 3. Vérification du token
    test_endpoint(
        "Vérifier token",
        "GET",
        "/auth/verify",
        auth=True,
        expected_status=200
    )
    
    # 4. Récupérer profil
    test_endpoint(
        "Récupérer profil",
        "GET",
        "/auth/me",
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS DES DEVICES
# ============================================================
def test_devices():
    global test_device_id
    print_header("📱 TESTS DES DEVICES")
    
    # 1. Lister les devices (initial)
    test_endpoint(
        "Liste des devices (initial)",
        "GET",
        "/devices",
        auth=True,
        expected_status=200
    )
    
    # 2. Ajouter un device
    result = test_endpoint(
        "Ajouter un device",
        "POST",
        "/devices",
        TEST_DEVICE,
        auth=True,
        expected_status=200
    )
    if result:
        test_device_id = result.get("device_id")
        print_success(f"Device créé: {test_device_id}")
    
    # 3. Lister les devices (après ajout)
    test_endpoint(
        "Liste des devices (après ajout)",
        "GET",
        "/devices",
        auth=True,
        expected_status=200
    )
    
    # 4. Récupérer un device spécifique
    if test_device_id:
        test_endpoint(
            "Récupérer device spécifique",
            "GET",
            f"/devices/{test_device_id}",
            auth=True,
            expected_status=200
        )
    
    # 5. Mettre à jour un device
    if test_device_id:
        test_endpoint(
            "Mettre à jour device",
            "PUT",
            f"/devices/{test_device_id}",
            {"name": "Device Test Modifié", "status": "maintenance"},
            auth=True,
            expected_status=200
        )
    
    # 6. Heartbeat
    test_endpoint(
            "Heartbeat",
            "POST",
            "/heartbeat",
            {"device_id": test_device_id or "test_device"},
            auth=True,
            expected_status=200
        )
    
    # 7. Récupérer statut heartbeat
    test_endpoint(
        "Statut heartbeat",
        "GET",
        "/heartbeat",
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS D'INGESTION
# ============================================================
def test_ingest():
    print_header("📤 TESTS D'INGESTION")
    
    # 1. Ingestion sans image (données électriques) - format form-data
    print(f"  Testing Ingestion données électriques...", end=" ")
    
    import requests
    url = f"{BASE_URL}{API_PREFIX}/ingest"
    
    form_data = {
        "device_id": test_device_id or "test_device",
        "voltage": "18.5",
        "current": "2.3",
        "temperature": "35.5"
    }
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        start_time = time.time()
        response = requests.post(url, data=form_data, headers=headers, timeout=30)
        duration = (time.time() - start_time) * 1000
        
        status = response.status_code
        print_endpoint("", "POST", "/ingest", status, duration)
        
        if status == 200:
            print_success("  Ingestion réussie")
        else:
            print_warning(f"  Expected 200, got {status}")
            if response.text:
                try:
                    error = response.json()
                    print(f"      Error: {error.get('detail', error)}")
                except:
                    print(f"      Response: {response.text[:200]}")
    except Exception as e:
        print_error(f"Erreur: {e}")
    
    # 2. Configuration admin
    test_endpoint(
        "Récupérer config admin",
        "GET",
        "/admin/config",
        auth=True,
        expected_status=200
    )
    
    # 3. Mettre à jour config admin
    test_endpoint(
        "Mettre à jour config admin",
        "POST",
        "/admin/config",
        {
            "seuil_warning": 35,
            "seuil_critical": 70,
            "retention_days": 14,
            "cleanup_interval": 12
        },
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS DES DONNÉES
# ============================================================
def test_data():
    print_header("📊 TESTS DES DONNÉES")
    
    # 1. Dernière mesure
    test_endpoint(
        "Dernière mesure",
        "GET",
        "/latest",
        auth=True,
        expected_status=200
    )
    
    # 2. Historique
    test_endpoint(
        "Historique (20 premières)",
        "GET",
        "/history?limit=20",
        auth=True,
        expected_status=200
    )
    
    # 3. Historique complet
    test_endpoint(
        "Historique (toutes)",
        "GET",
        "/history?limit=0",
        auth=True,
        expected_status=200
    )
    
    # 4. Statistiques
    test_endpoint(
        "Statistiques",
        "GET",
        "/stats",
        auth=True,
        expected_status=200
    )
    
    # 5. Recommandation
    test_endpoint(
        "Recommandation",
        "GET",
        "/recommendation",
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS DE L'ENSABLEMENT
# ============================================================
def test_soiling():
    print_header("🧹 TESTS DE L'ENSABLEMENT")
    
    # 1. Historique ensablement
    test_endpoint(
        "Historique ensablement (30j)",
        "GET",
        "/soiling/history?days=30",
        auth=True,
        expected_status=200
    )
    
    if test_device_id:
        # 2. Recommandation nettoyage
        test_endpoint(
            "Recommandation nettoyage",
            "GET",
            f"/soiling/recommendation?device_id={test_device_id}",
            auth=True,
            expected_status=200
        )
        
        # 3. Prédiction ensablement
        test_endpoint(
            "Prédiction ensablement",
            "GET",
            f"/soiling/prediction?device_id={test_device_id}&days=7",
            auth=True,
            expected_status=200
        )

# ============================================================
# TESTS DES ALERTES
# ============================================================
def test_alerts():
    global test_alert_id
    print_header("🚨 TESTS DES ALERTES")
    
    # 1. Lister les alertes
    result = test_endpoint(
        "Lister alertes (non résolues)",
        "GET",
        "/alerts?resolved=false",
        auth=True,
        expected_status=200
    )
    
    if isinstance(result, list) and len(result) > 0:
        test_alert_id = result[0].get("id")
    
    if test_alert_id:
        # 2. Récupérer alerte spécifique
        test_endpoint(
            "Récupérer alerte",
            "GET",
            f"/alerts/{test_alert_id}",
            auth=True,
            expected_status=200
        )
        
        # 3. Accuser réception
        test_endpoint(
            "Accuser réception alerte",
            "POST",
            f"/alerts/{test_alert_id}/acknowledge",
            {"acknowledged_by": "test_user"},
            auth=True,
            expected_status=200
        )
        
        # 4. Résoudre alerte
        test_endpoint(
            "Résoudre alerte",
            "POST",
            f"/alerts/{test_alert_id}/resolve",
            {"resolution_notes": "Test résolu"},
            auth=True,
            expected_status=200
        )

# ============================================================
# TESTS DES PERFORMANCES
# ============================================================
def test_performance():
    print_header("📈 TESTS DES PERFORMANCES")
    
    periods = ["day", "week", "month", "year"]
    for period in periods:
        test_endpoint(
            f"KPIs performance ({period})",
            "GET",
            f"/performance/kpis?period={period}",
            auth=True,
            expected_status=200
        )

# ============================================================
# TESTS DE MAINTENANCE
# ============================================================
def test_maintenance():
    global test_intervention_id
    print_header("🔧 TESTS DE MAINTENANCE")
    
    # 1. Lister les logs de maintenance
    test_endpoint(
        "Logs maintenance",
        "GET",
        "/maintenance/logs?limit=20",
        auth=True,
        expected_status=200
    )
    
    # 2. Ajouter un log de maintenance
    result = test_endpoint(
        "Ajouter log maintenance",
        "POST",
        "/maintenance/logs",
        {
            "device_id": test_device_id or "test_device",
            "action": "cleaning",
            "description": "Nettoyage de test",
            "operator": "Testeur",
            "cost": 50,
            "energy_gained_estimate": 5.5
        },
        auth=True,
        expected_status=200
    )
    
    if result and "id" in result:
        test_intervention_id = result["id"]
    
    # 3. Planning maintenance
    if test_device_id:
        test_endpoint(
            "Planning maintenance",
            "GET",
            f"/maintenance/schedule/{test_device_id}",
            auth=True,
            expected_status=200
        )
    
    # 4. Interventions (nouvelle route)
    test_endpoint(
        "Lister interventions",
        "GET",
        "/maintenance/interventions?limit=20",
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS ADMIN
# ============================================================
def test_admin():
    print_header("👑 TESTS ADMIN")
    
    # 1. Configuration email
    test_endpoint(
        "Récupérer config email",
        "GET",
        "/admin/email-config",
        auth=True,
        expected_status=200
    )
    
    # 2. Utilisateurs
    test_endpoint(
        "Lister utilisateurs",
        "GET",
        "/admin/users",
        auth=True,
        expected_status=200
    )
    
    # 3. Configuration panneaux
    test_endpoint(
        "Récupérer config panneaux",
        "GET",
        "/admin/panel-config",
        auth=True,
        expected_status=200
    )
    
    # 4. Mettre à jour config panneaux
    test_endpoint(
        "Mettre à jour config panneaux",
        "POST",
        "/admin/panel-config",
        {
            "panel_type": "monocristallin",
            "panel_capacity_kw": 3.5,
            "panel_area_m2": 1.8,
            "panel_efficiency": 0.22,
            "tilt_angle": 35,
            "azimuth": 180,
            "degradation_rate": 0.5
        },
        auth=True,
        expected_status=200
    )
    
    # 5. Informations stockage
    test_endpoint(
        "Informations stockage",
        "GET",
        "/storage/info",
        auth=True,
        expected_status=200
    )
    
    # 6. Cache IA
    test_endpoint(
        "Statistiques cache IA",
        "GET",
        "/ai/cache-stats",
        auth=True,
        expected_status=200
    )

# ============================================================
# TESTS D'EXPORT
# ============================================================
def test_export():
    print_header("📄 TESTS D'EXPORT")
    
    # 1. Export JSON
    result = test_endpoint(
        "Export JSON",
        "GET",
        "/export?format=json",
        auth=True,
        expected_status=200
    )
    if result:
        print_success("  Export JSON réussi")
    
    # 2. Export CSV (ne pas parser comme JSON)
    print(f"  Testing Export CSV...", end=" ")
    response, duration = make_request("GET", "/export?format=csv", auth=True)
    
    if response is None:
        print_error("Erreur")
        return
    
    status = response.status_code
    print_endpoint("", "GET", "/export?format=csv", status, duration)
    
    if status == 200:
        content_type = response.headers.get('content-type', '')
        if 'csv' in content_type or 'octet-stream' in content_type:
            print_success("  Export CSV réussi")
        else:
            print_warning(f"  Format réponse: {content_type}")
    else:
        print_error(f"  Expected 200, got {status}")

# ============================================================
# TESTS DE NETTOYAGE
# ============================================================
def test_cleanup():
    print_header("🧹 TESTS DE NETTOYAGE")
    
    # 1. Déclencher nettoyage manuel
    test_endpoint(
        "Nettoyage manuel",
        "POST",
        "/cleanup",
        auth=True,
        expected_status=200
    )
    
    # 2. Vider cache IA
    test_endpoint(
        "Vider cache IA",
        "POST",
        "/ai/clear-cache",
        auth=True,
        expected_status=200
    )

# ============================================================
# NETTOYAGE FINAL
# ============================================================
def cleanup():
    print_header("🧹 NETTOYAGE FINAL")
    
    # Supprimer le device de test
    if test_device_id:
        test_endpoint(
            "Supprimer device de test",
            "DELETE",
            f"/devices/{test_device_id}",
            auth=True,
            expected_status=200
        )
        print_success(f"Device {test_device_id} supprimé")

# ============================================================
# MAIN
# ============================================================
def main():
    print_header("🚀 DÉMARrage DES TESTS")
    print_info(f"Backend: {BASE_URL}")
    print_info(f"Test user: {TEST_USER['email']}")
    
    # Vérifier que le backend est accessible
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code != 200:
            print_error("Backend non accessible")
            return
        print_success("Backend accessible")
    except:
        print_error("Impossible de contacter le backend")
        return
    
    # Exécuter les tests
    test_auth()
    test_devices()
    test_ingest()
    test_data()
    test_soiling()
    test_alerts()
    test_performance()
    test_maintenance()
    test_admin()
    test_export()
    test_cleanup()
    
    # Nettoyage
    cleanup()
    
    print_header("🏁 FIN DES TESTS")
    print_success("Tous les tests sont terminés")

if __name__ == "__main__":
    main()