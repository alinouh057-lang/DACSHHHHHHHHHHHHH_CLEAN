"""
============================================================
SIMULATEUR ESP32 ÉLECTRIQUE - PV MONITOR (UNIQUEMENT DONNÉES)
============================================================
Ce script simule un ESP32 envoyant uniquement des données électriques
(tension, courant, température) au serveur backend, sans image.
Version avec coordonnées GPS pour la récupération d'
irradiance.
============================================================
"""

import requests
import time
import random
import json
from datetime import datetime
import os
import sys

# ============================================================
# CONFIGURATION (à adapter)
# ============================================================

# Configuration réseau
SERVER_IP = "10.142.240.222"      # IP de ton PC
SERVER_PORT = 8000               # Port du serveur
DEVICE_ID = "esp2"       # ID unique pour l'ESP électrique (différent de la CAM)

# ============================================================
# COORDONNÉES GPS DU DEVICE (IMPORTANT !)
# ============================================================
#DEVICE_LATITUDE = 36.8065        # Latitude (ex: Tunis)
#DEVICE_LONGITUDE = 10.1815       # Longitude (ex: Tunis)
DEVICE_ZONE = "Zone Test"        # Zone géographique
DEVICE_NAME = "ESP32 Électrique" # Nom du device

# ============================================================
# AUTRES CONFIGURATIONS
# ============================================================

# Intervalle d'envoi (en secondes)
INTERVAL_SEC = 30                # 10 secondes entre chaque envoi (plus fréquent que la CAM)
HEARTBEAT_SEC = 10               # 10 secondes entre chaque heartbeat

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

def ensure_valid_token():
    """
    Vérifie et renouvelle le token JWT si nécessaire.
    Envoie les coordonnées GPS lors de l'enregistrement.
    """
    global auth_token, token_expires
    
    # Si token déjà valide (avec 1 heure de marge)
    if auth_token and time.time() * 1000 < token_expires - 3600000:
        return True
    
    print("\n🔄 Authentification...")
    
    # URL d'enregistrement
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/auth/register-device"
    
    # ============================================================
    # PAYLOAD AVEC COORDONNÉES GPS
    # ============================================================
    payload = {
        "device_id": DEVICE_ID,
        "name": DEVICE_NAME,
        "location": "Simulation",
        "zone": DEVICE_ZONE,
       # "latitude": DEVICE_LATITUDE,
      #  "longitude": DEVICE_LONGITUDE
    }
    
   # print(f"📤 Envoi coordonnées: lat={DEVICE_LATITUDE}, lon={DEVICE_LONGITUDE}")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        # 200 = nouveau device, 400 = déjà enregistré -> les deux sont OK
        if response.status_code in [200, 400]:
            data = response.json()
            if "access_token" in data:
                auth_token = data["access_token"]
                token_expires = time.time() * 1000 + 30 * 24 * 3600 * 1000  # 30 jours
                print("✅ Token obtenu !")
                
              #  if response.status_code == 200:
             #       print(f"📌 Device enregistré avec coordonnées: {DEVICE_LATITUDE}, {DEVICE_LONGITUDE}")
              #  else:
              #      print(f"📌 Device existant, mise à jour des coordonnées...")
             #       update_device_coordinates()
                
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
         #   "longitude": DEVICE_LONGITUDE,
            "zone": DEVICE_ZONE
        }
        
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.put(url, json=payload, headers=headers, timeout=10)
        
      #  if response.status_code == 200:
      #      print(f"✅ Coordonnées mises à jour: lat={DEVICE_LATITUDE}, lon={DEVICE_LONGITUDE}")
       # else:
         #   print(f"⚠️ Mise à jour coordonnées échouée: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Erreur mise à jour coordonnées: {e}")

# ============================================================
# SIMULATION DES CAPTEURS ÉLECTRIQUES
# ============================================================

def read_temperature():
    """Simule la lecture de température du module"""
    # Température de base + variation
    hour = datetime.now().hour
    if 12 <= hour <= 14:  # Midi (plus chaud)
        base_temp = 45.0
    elif 6 <= hour <= 18:  # Journée
        base_temp = 35.0
    else:  # Nuit
        base_temp = 20.0
    
    temperature = base_temp + random.uniform(-5, 8)
    return round(temperature, 1)

def read_voltage():
    """Simule la lecture de tension"""
    # Tension nominale: ~24V pour panneau solaire
    hour = datetime.now().hour
    
    if 10 <= hour <= 14:  # Plein soleil
        voltage = 24.0 + random.uniform(-1, 2)
    elif 8 <= hour <= 18:  # Journée normale
        voltage = 22.0 + random.uniform(-2, 3)
    else:  # Nuit
        voltage = random.uniform(0, 5)
    
    return round(voltage, 1)

def read_current():
    """Simule la lecture de courant"""
    hour = datetime.now().hour
    
    if 10 <= hour <= 14:  # Plein soleil (courant max)
        current = 8.0 + random.uniform(-1, 2)
    elif 8 <= hour <= 18:  # Journée normale
        current = 5.0 + random.uniform(-2, 3)
    elif 6 <= hour <= 7 or 18 <= hour <= 19:  # Lever/coucher
        current = random.uniform(0.5, 2)
    else:  # Nuit
        current = random.uniform(0, 0.5)
    
    # Nuages aléatoires (réduction de courant)
    if random.random() < 0.3:
        current *= random.uniform(0.3, 0.8)
    
    return round(current, 2)

# ============================================================
# ENVOI AU SERVEUR (UNIQUEMENT DONNÉES ÉLECTRIQUES)
# ============================================================

def send_to_server(voltage, current, temperature):
    """
    Envoie uniquement les données électriques au serveur
    (sans image)
    """
    global auth_token
    
    if not ensure_valid_token():
        print("❌ Authentification impossible")
        return False
    
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/v1/ingest"
    
    boundary = "ESP32ElecBoundary"
    
    # Envoyer SEULEMENT device_id + données électriques (pas d'image)
    text_part = ""
    text_part += f"--{boundary}\r\n"
    text_part += 'Content-Disposition: form-data; name="device_id"\r\n\r\n'
    text_part += f"{DEVICE_ID}\r\n"
    
    text_part += f"--{boundary}\r\n"
    text_part += 'Content-Disposition: form-data; name="voltage"\r\n\r\n'
    text_part += f"{voltage:.1f}\r\n"
    
    text_part += f"--{boundary}\r\n"
    text_part += 'Content-Disposition: form-data; name="current"\r\n\r\n'
    text_part += f"{current:.2f}\r\n"
    
    text_part += f"--{boundary}\r\n"
    text_part += 'Content-Disposition: form-data; name="temperature"\r\n\r\n'
    text_part += f"{temperature:.1f}\r\n"
    
    tail = f"\r\n--{boundary}--\r\n"
    
    body = text_part.encode('utf-8') + tail.encode('utf-8')
    
    headers = {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    
    try:
        response = requests.post(url, headers=headers, data=body, timeout=20)
        
        if response.status_code == 200:
            print("✅ Données électriques envoyées avec succès !")
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
    print("⚡ SIMULATEUR ESP32 ÉLECTRIQUE - PV MONITOR (UNIQUEMENT DONNÉES)")
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
            
            # Envoi des données à intervalle régulier
            if current_time - last_send >= INTERVAL_SEC:
                last_send = current_time
                send_count += 1
                
                print("\n" + "-" * 60)
                print(f"📊 Mesure #{send_count} - {datetime.now().strftime('%H:%M:%S')}")
                
                # Lecture des capteurs simulés
                voltage = read_voltage()
                current = read_current()
                temperature = read_temperature()
                power = voltage * current
                
                print(f"⚡ Tension: {voltage:.1f} V")
                print(f"🔌 Courant: {current:.2f} A")
                print(f"💪 Puissance: {power:.1f} W")
                print(f"🌡️ Température: {temperature:.1f} °C")
              #  print(f"📍 Coordonnées: {DEVICE_LATITUDE}, {DEVICE_LONGITUDE}")
                
                # Envoi au serveur (seulement les données)
                success = send_to_server(voltage, current, temperature)
                
                if success:
                    print("✅ Données envoyées avec succès")
                else:
                    print("❌ Échec de l'envoi")
                
                print("-" * 60)
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n\n👋 Arrêt du simulateur ESP32 Électrique")
        sys.exit(0)

if __name__ == "__main__":
    main()