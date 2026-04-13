# ============================================================
# INITIALISATION DE L'ADMINISTRATEUR - PV MONITOR
# ============================================================
# Ce module crée automatiquement le premier administrateur
# lors du premier démarrage de l'application si aucun utilisateur n'existe.
# ============================================================
# 
# 👤 FONCTIONNALITÉS :
# - Vérification de l'existence d'utilisateurs dans la base
# - Création automatique du premier admin si nécessaire
# - Configuration depuis les variables d'environnement
# - Création des index MongoDB nécessaires
# 
# 📧 VARIABLES D'ENVIRONNEMENT UTILISÉES :
# - ADMIN_EMAIL : Email de l'admin (défaut: admin@example.com)
# - ADMIN_PASSWORD : Mot de passe temporaire (défaut: Admin123!)
# - ADMIN_NAME : Nom de l'admin (défaut: Administrateur)
# 
# 🔐 SÉCURITÉ :
# - Mot de passe hashé avec bcrypt
# - Flag must_change_password pour forcer le changement à la première connexion
# - Index unique sur email pour éviter les doublons
# 
# 🚀 EXÉCUTION :
# - Appelé automatiquement au démarrage du serveur (main.py)
# - Peut être exécuté manuellement : python init_admin.py
# 
# ============================================================

from pymongo import MongoClient
import bcrypt
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
import logging

# ============================================================
# 📝 CONFIGURATION LOGGING
# ============================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

def init_admin():
    """
    Crée le premier administrateur si la base est vide
    Utilise les variables d'environnement pour l'email admin
    
    Returns:
        bool: True si succès, False sinon
    """
    try:
        # ============================================================
        # 🔌 CONNEXION À MONGODB
        # ============================================================
        # Connexion MongoDB Atlas
        mongo_uri = os.getenv('MONGO_URI')
        db_name = os.getenv('DB_NAME', 'pv_monitor_db')
        
        if not mongo_uri:
            logger.error("❌ MONGO_URI non définie dans .env")
            return False
        
        logger.info(f"📦 Connexion à MongoDB Atlas...")
        client = MongoClient(mongo_uri)
        
        # Tester la connexion
        client.admin.command('ping')
        logger.info("✅ Connexion MongoDB réussie")
        
        db = client[db_name]
        users_collection = db['users']
        
        # ============================================================
        # 👥 VÉRIFICATION DE L'EXISTENCE D'UTILISATEURS
        # ============================================================
        # Vérifier si des utilisateurs existent
        user_count = users_collection.count_documents({})
        logger.info(f"📊 Nombre d'utilisateurs existants: {user_count}")
        
        if user_count == 0:
            logger.info("👤 Aucun utilisateur trouvé, création du premier admin...")
            
            # Récupérer l'email admin depuis .env ou utiliser défaut
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
            admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!')
            admin_name = os.getenv('ADMIN_NAME', 'Administrateur')
            
            # ============================================================
            # 🔐 CRÉATION DU COMPTE ADMIN
            # ============================================================
            # Hasher le mot de passe
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), salt)
            
            # Créer l'utilisateur admin
            admin_user = {
                'email': admin_email,
                'password': hashed_password.decode('utf-8'),
                'name': admin_name,
                'role': 'admin',
                'created_at': datetime.now(timezone.utc),
                'active': True,
                'must_change_password': True  # Force changement au premier login
            }
            
            result = users_collection.insert_one(admin_user)
            
            if result.inserted_id:
                logger.info("✅ Premier administrateur créé avec succès !")
                logger.info(f"   📧 Email: {admin_email}")
                logger.info("   ⚠️  Mot de passe temporaire: Admin123!")
                logger.info("   🔑 À changer à la première connexion")
            else:
                logger.error("❌ Erreur lors de la création de l'admin")
                return False
        else:
            logger.info("✅ Des utilisateurs existent déjà, pas de création d'admin")
        
        # ============================================================
        # 🔧 CRÉATION DES INDEX MONGODB
        # ============================================================
        logger.info("🔧 Création des index...")
        users_collection.create_index('email', unique=True)
        logger.info("✅ Index email créé")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation: {e}")
        return False

# ============================================================
# 🚀 POINT D'ENTRÉE POUR EXÉCUTION MANUELLE
# ============================================================
if __name__ == "__main__":
    from datetime import datetime  # Import ici pour éviter les problèmes
    init_admin()