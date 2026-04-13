"""
============================================================
SIMULATEUR ESP32-CAM - PV MONITOR (UNIQUEMENT IMAGE)
============================================================
Ce script simule un ESP32-CAM envoyant uniquement des images
au serveur backend, sans données électriques.
Version avec coordonnées GPS pour la récupération d'irradiance.
============================================================
"""

import requests
import time
import random
import json
import base64
from datetime import datetime
import os
import sys

# ============================================================
# CONFIGURATION (à adapter)
# ============================================================

# Configuration réseau
SERVER_IP = "10.142.240.222"      # IP de ton PC
SERVER_PORT = 8000               # Port du serveur
DEVICE_ID = "esp2"        # ID unique pour la CAM (différent de l'ESP électrique)

# ============================================================
# COORDONNÉES GPS DU DEVICE (IMPORTANT !)
# ============================================================
#DEVICE_LATITUDE = 36.8065        # Latitude (ex: Tunis)
#DEVICE_LONGITUDE = 10.1815       # Longitude (ex: Tunis)
DEVICE_ZONE = "Zone Test"        # Zone géographique
DEVICE_NAME = "ESP32-CAM"        # Nom du device

# ============================================================
# AUTRES CONFIGURATIONS
# ============================================================

# Intervalle d'envoi (en secondes)
INTERVAL_SEC = 30                # 30 secondes entre chaque envoi
HEARTBEAT_SEC = 10               # 10 secondes entre chaque heartbeat

# Optionnel : chemin vers une image réelle à envoyer
# Si None, une image factice sera générée
TEST_IMAGE_PATH = r"C:\Users\INFOKOM ADMINN\Desktop\DASHHHHHHHHHHHHHHHHHHH\backend\test_panel.jpg"

# ============================================================
# VARIABLES GLOBALES
# ============================================================
auth_token = ""
token_expires = 0
send_count = 0
last_send = 0
last_heartbeat = 0

# ============================================================
# FONCTIONS D'AUTHENTIFICATION (AVEC COORDONNÉES)
# ============================================================

if TEST_IMAGE_PATH and os.path.exists(TEST_IMAGE_PATH):
    print(f"✅ Image trouvée: {TEST_IMAGE_PATH}")
    print(f"📦 Taille: {os.path.getsize(TEST_IMAGE_PATH)} bytes")
else:
    print(f"⚠️ Image NON trouvée: {TEST_IMAGE_PATH}")
    print("👉 Image factice sera générée")

def ensure_valid_token():
    """
    Vérifie et renouvelle le token JWT si nécessaire.
    Envoie les coordonnées GPS lors de l'enregistrement.
    """
    global auth_token, token_expires
    
    # Si token déjà valide (avec 1 heure de marge)
    if auth_token and time.time() * 1000 < token_expires - 3600000:
        print("✅ Token déjà valide")
        return True
    
    print("\n🔄 Authentification...")
    
    # URL d'enregistrement
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/auth/register-device"
    
    # ============================================================
    # PAYLOAD AVEC COORDONNÉES GPS (IMPORTANT !)
    # ============================================================
    payload = {
        "device_id": DEVICE_ID,
        "name": DEVICE_NAME,
        "location": "Simulation",
        "zone": DEVICE_ZONE,
        #"latitude": DEVICE_LATITUDE,    # ← AJOUT
        #"longitude": DEVICE_LONGITUDE   # ← AJOUT
    }
    
    #print(f"📤 Envoi coordonnées: lat={DEVICE_LATITUDE}, lon={DEVICE_LONGITUDE}")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        # 200 = nouveau device, 400 = déjà enregistré -> les deux sont OK
        if response.status_code in [200, 400]:
            data = response.json()
            if "access_token" in data:
                auth_token = data["access_token"]
                token_expires = time.time() * 1000 + 30 * 24 * 3600 * 1000  # 30 jours
                print("✅ Token obtenu !")
                
                # Vérifier que les coordonnées sont bien enregistrées
             #   if response.status_code == 200:
               #     print(f"📌 Device enregistré avec coordonnées: {DEVICE_LATITUDE}, {DEVICE_LONGITUDE}")
              #  else:
              #      print(f"📌 Device existant, mise à jour des coordonnées...")
                  # update_device_coordinates()
                
                return True
            else:
                print("❌ Réponse sans token")
        else:
            print(f"❌ Échec auth ({response.status_code})")
            print(f"   Réponse: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
    
    return False

def update_device_coordinates():
    """
    Met à jour les coordonnées du device via l'API admin
    (si le device existe déjà mais sans coordonnées)
    """
    try:
        if not auth_token:
            return
        
        url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/devices/{DEVICE_ID}"
        payload = {
           # "latitude": DEVICE_LATITUDE,
          #  "longitude": DEVICE_LONGITUDE,
            "zone": DEVICE_ZONE
        }
        
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.put(url, json=payload, headers=headers, timeout=10)
        
     # if response.status_code == 200:
        #    print(f"✅ Coordonnées mises à jour: lat={DEVICE_LATITUDE}, lon={DEVICE_LONGITUDE}")
       # else:
     #       print(f"⚠️ Mise à jour coordonnées échouée: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Erreur mise à jour coordonnées: {e}")

# ============================================================
# CAPTURE D'IMAGE (UNIQUEMENT)
# ============================================================

def capture_image():
    """Capture une image (réelle ou factice)"""
    if TEST_IMAGE_PATH and os.path.exists(TEST_IMAGE_PATH):
        with open(TEST_IMAGE_PATH, 'rb') as f:
            image_data = f.read()
        print(f"📷 Image chargée: {TEST_IMAGE_PATH} ({len(image_data)} bytes)")
    else:
        image_data = create_dummy_image()
        print(f"📷 Image factice générée ({len(image_data)} bytes)")
    return image_data

def create_dummy_image():
    """Crée une image JPEG factice minimale"""
    jpeg_header = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00,
        0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB,
        0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
        0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B,
        0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E,
        0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C,
        0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34,
        0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
        0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0xE0, 0x01, 0x40, 0x03,
        0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01
    ])
    dummy_data = jpeg_header + bytes([random.randint(0, 255) for _ in range(5000)])
    return dummy_data

# ============================================================
# ENVOI AU SERVEUR (SEULEMENT IMAGE)
# ============================================================

def send_to_server(image_data):
    """
    Envoie uniquement l'image au serveur
    (sans voltage, current, temperature)
    """
    global auth_token
    
    if not ensure_valid_token():
        print("❌ Authentification impossible")
        return False
    
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/ingest"
    
    boundary = "ESP32CamBoundary"
    
    # Envoyer SEULEMENT device_id + image (pas de voltage/current)
    text_part = ""
    text_part += f"--{boundary}\r\n"
    text_part += 'Content-Disposition: form-data; name="device_id"\r\n\r\n'
    text_part += f"{DEVICE_ID}\r\n"
    
    image_part = f"--{boundary}\r\n"
    image_part += 'Content-Disposition: form-data; name="image"; filename="image.jpg"\r\n'
    image_part += 'Content-Type: image/jpeg\r\n\r\n'
    
    tail = f"\r\n--{boundary}--\r\n"
    
    body = text_part.encode('utf-8') + image_part.encode('utf-8') + image_data + tail.encode('utf-8')
    
    headers = {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    
    try:
        response = requests.post(url, headers=headers, data=body, timeout=20)
        
        if response.status_code == 200:
            print("✅ Image envoyée avec succès !")
            return True
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(f"   Réponse: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
        return False
# ============================================================
# HEARTBEAT
# ============================================================

def send_heartbeat():
    """Envoie un heartbeat au serveur"""
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/heartbeat"
    
    try:
        payload = {"device_id": DEVICE_ID}
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            print("💓 Heartbeat OK")
        else:
            print(f"💔 Heartbeat {response.status_code}")
    except Exception as e:
        print(f"💔 Heartbeat erreur: {e}")

# ============================================================
# AFFICHAGE DES INFORMATIONS
# ============================================================

def print_header():
    """Affiche l'en-tête du simulateur"""
    print("=" * 60)
    print("📷 SIMULATEUR ESP32-CAM - PV MONITOR (UNIQUEMENT IMAGE)")
    print("=" * 60)
    print(f"📱 Device ID: {DEVICE_ID}")
   # print(f"📍 Coordonnées: {DEVICE_LATITUDE}, {DEVICE_LONGITUDE}")
    print(f"🌐 Serveur: http://{SERVER_IP}:{SERVER_PORT}")
    print(f"⏱️  Intervalle: {INTERVAL_SEC}s, Heartbeat: {HEARTBEAT_SEC}s")
    print("=" * 60)

# ============================================================
# BOUCLE PRINCIPALE
# ============================================================

def main():
    global last_send, last_heartbeat, send_count
    
    print_header()
    
    # Authentification au démarrage (envoie les coordonnées)
    ensure_valid_token()
    
    try:
        while True:
            current_time = time.time()
            
            # Heartbeat périodique
            if current_time - last_heartbeat >= HEARTBEAT_SEC:
                last_heartbeat = current_time
                send_heartbeat()
            
            # Envoi de l'image à intervalle régulier
            if current_time - last_send >= INTERVAL_SEC:
                last_send = current_time
                send_count += 1
                
                print("\n" + "-" * 60)
                print(f"📸 Capture #{send_count} - {datetime.now().strftime('%H:%M:%S')}")
               # print(f"📍 Coordonnées: {DEVICE_LATITUDE}, {DEVICE_LONGITUDE}")
                
                # Capture d'image
                image_data = capture_image()
                
                # Envoi au serveur (seulement l'image)
                success = send_to_server(image_data)
                
                if success:
                    print("✅ Image envoyée avec succès")
                else:
                    print("❌ Échec de l'envoi")
                
                print("-" * 60)
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n\n👋 Arrêt du simulateur ESP32-CAM")
        sys.exit(0)

if __name__ == "__main__":
    main()