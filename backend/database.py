# ============================================================================
# FICHIER: database.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier gère la connexion à MongoDB et expose toutes les collections
#   utilisées par l'application PV Monitor de manière asynchrone.
#   C'est le point d'entrée unique pour toutes les opérations base de données.
#
# 🏗️ ARCHITECTURE:
#   - Utilise Motor (driver MongoDB asynchrone pour FastAPI)
#   - Connexion unique partagée dans toute l'application
#   - Collections typées pour faciliter l'accès
#   - Variables d'environnement pour la configuration
#
# 📚 COLLECTIONS DISPONIBLES:
#   - surveillance_collection : Mesures et analyses d'ensablement (la plus importante)
#   - users_collection       : Comptes utilisateurs (hashés, rôles)
#   - devices_collection     : Configuration des dispositifs ESP32
#   - alerts_collection      : Historique des alertes générées
#   - interventions_collection : Logs des maintenances effectuées
#   - panel_config_collection : Configuration des panneaux solaires
#
# 🔄 CARACTÉRISTIQUES:
#   - Client asynchrone (motor) pour performances optimales
#   - Connexion unique partagée (pas de pooling complexe)
#   - Collections prêtes à l'emploi
#
# ⚙️ CONFIGURATION (.env):
#   - MONGO_URI : Chaîne de connexion MongoDB Atlas (ou local)
#   - DB_NAME   : Nom de la base de données
#
# 📦 UTILISATION TYPIQUE:
#   from database import surveillance_collection
#   data = await surveillance_collection.find_one({})
# ============================================================================

"""
CONNEXION MONGODB - PV MONITOR
===============================
Ce module gère la connexion à MongoDB et expose les collections
utilisées par l'application de manière asynchrone.

COLLECTIONS DISPONIBLES :
- surveillance : Stockage des mesures et analyses d'ensablement
- users : Comptes utilisateurs (hashés, rôles)
- devices : Configuration des dispositifs ESP32
- alerts : Historique des alertes générées
- interventions : Logs des maintenances effectuées

CARACTÉRISTIQUES :
- Client asynchrone (motor) pour performances optimales
- Connexion unique partagée dans toute l'application
- Collections typées pour faciliter l'accès

CONFIGURATION :
- MONGO_URI : Variable d'environnement (depuis .env)
- DB_NAME : Nom de la base de données (depuis .env)

UTILISATION :
from database import surveillance_collection
data = await surveillance_collection.find_one({})
"""

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Chargement des variables d'environnement depuis .env
load_dotenv()


# ============================================================================
# 📦 CONFIGURATION DEPUIS .env
# ============================================================================
MONGO_URI = os.getenv("MONGO_URI")
"""
URI de connexion MongoDB.
Format attendu (MongoDB Atlas):
    mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
Format local:
    mongodb://localhost:27017
⚠️ Doit être défini dans .env - pas de valeur par défaut
"""

DB_NAME = os.getenv("DB_NAME")
"""
Nom de la base de données.
Exemple: "pv_monitor_db" ou "pv_monitor"
⚠️ Doit être défini dans .env - pas de valeur par défaut
"""


# ============================================================================
# 🔌 CLIENT MONGODB ASYNCHRONE
# ============================================================================
# Client MongoDB asynchrone (Motor) - connexion unique partagée
client = AsyncIOMotorClient(MONGO_URI)

# Référence à la base de données
database = client[DB_NAME]


# ============================================================================
# 📁 COLLECTIONS PRINCIPALES
# ============================================================================
# Chaque collection correspond à une table dans MongoDB
# Les noms sont en minuscules et en anglais par convention

# 📊 COLLECTION SURVEILLANCE
# La plus importante - stocke toutes les mesures des panneaux
# Contient: timestamp, device_id, electrical_data, ai_analysis, media
surveillance_collection = database.get_collection("surveillance")

# 👤 COLLECTION UTILISATEURS
# Stocke les comptes utilisateurs de l'interface web
# Contient: email, password (hashé), name, role, created_at, active, verified
users_collection = database.get_collection("users")

# 📱 COLLECTION DEVICES
# Stocke la configuration des ESP32
# Contient: device_id, name, status, installation_date, last_heartbeat
devices_collection = database.get_collection("devices")

# ⚠️ COLLECTION ALERTES
# Stocke l'historique des alertes générées
# Contient: device_id, type, severity, title, message, timestamp, resolved
alerts_collection = database.get_collection("alerts")

# 🛠️ COLLECTION INTERVENTIONS
# Stocke les logs de maintenance (nettoyages, réparations, inspections)
# Contient: date, type, device_id, technician, cost, before_level, after_level
interventions_collection = database.get_collection("interventions")

# 📊 COLLECTION CONFIGURATION DES PANNEAUX
# Stocke les paramètres des panneaux solaires
# Contient: panel_type, panel_capacity_kw, panel_area_m2, panel_efficiency
panel_config_collection = database.get_collection("panel_config")