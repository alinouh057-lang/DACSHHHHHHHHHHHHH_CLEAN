# ============================================================================
# FICHIER: inference_engine.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   C'est le CŒUR de l'intelligence artificielle du projet PV Monitor !
#   Ce module charge le modèle hybride (ResNet50 + features classiques) et
#   analyse les images de panneaux solaires pour détecter l'ensablement.
#
# 🤖 ARCHITECTURE DU MODÈLE HYBRIDE:
#   - ResNet50 pré-entraîné pour les features visuelles profondes
#   - Branche classique pour 5 features manuelles (couleur, texture, etc.)
#   - Fusion des deux branches pour la classification finale
#
# 📊 FEATURES CLASSIQUES (5 descripteurs):
#   1. score_couleur   : Détection des zones bleues/noires (panneaux propres)
#   2. score_texture   : LBP + Gabor pour la rugosité
#   3. score_brillance : Luminosité et saturation
#   4. score_entropie  : Complexité locale (patchs 8x8)
#   5. score_fft       : Analyse fréquentielle (hautes fréquences)
#
# 🎯 SORTIES:
#   - soiling_percent : Valeur continue 0-100% (pondérée par probas)
#   - status : "Clean", "Warning", "Critical" (selon seuils config)
#   - confidence : Confiance du modèle (0-1)
#
# ⚡ OPTIMISATIONS:
#   - Cache LRU avec TTL (évite re-analyser les mêmes images)
#   - Inférence sur GPU si disponible (CUDA)
#   - Mode évaluation permanent (model.eval())
#   - Pré-filtre pour vérifier que l'image est bien un panneau
#
# 🔄 FUSION DES PRÉDICTIONS:
#   - Combine la sortie du modèle IA avec une analyse couleur classique
#   - Poids: modèle (model_conf) + analyse couleur (color_conf)
#   - Plus robuste que le modèle seul
#
# ============================================================================

"""
MOTEUR D'INFÉRENCE IA - PV MONITOR
===================================
Ce module gère toute la partie intelligence artificielle :
- Chargement du modèle hybride (ResNet50 + features classiques)
- Extraction des features manuelles (couleur, texture, etc.)
- Prédiction du niveau d'ensablement avec cache

ARCHITECTURE DU MODÈLE :
- ResNet50 pré-entraîné pour les features visuelles profondes
- Branche classique pour 5 features manuelles
- Fusion des deux branches pour la classification finale

FEATURES CLASSIQUES (5) :
- score_couleur : Détection des zones bleues/noires (panneaux propres)
- score_texture : LBP + Gabor pour la rugosité
- score_brillance : Luminosité et saturation
- score_entropie : Complexité locale (patchs 8x8)
- score_fft : Analyse fréquentielle (hautes fréquences)

SORTIES :
- soiling_percent : Valeur continue 0-100% (pondérée par probas)
- status : "Clean", "Warning", "Critical" (selon seuils config)
- confidence : Confiance du modèle (0-1)

OPTIMISATIONS :
- Cache LRU avec TTL (évite re-analyser les mêmes images)
- Inférence sur GPU si disponible
- Mode évaluation permanent
"""

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np
from PIL import Image
from skimage.feature import local_binary_pattern
from skimage.filters import gabor
from skimage import img_as_float
import os
import logging
from functools import lru_cache
import hashlib
import time
from collections import OrderedDict

from config import Config
from config_manager import get_config

# Configuration du logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Chemins et constantes depuis Config
MODEL_PATH = Config.MODEL_PATH                    # Chemin du modèle PyTorch
CLASSES = Config.CLASSES                          # ['Clean', 'Moderate', 'Critical']
CLASS_VALUES = Config.CLASS_VALUES                # [0, 50, 100]
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')  # GPU si dispo


# ============================================================================
# ⚡ CACHE POUR LES PRÉDICTIONS IA (LRU + TTL)
# ============================================================================

class ModelCache:
    """
    Cache personnalisé pour les prédictions IA.
    
    Caractéristiques:
        - Limité à N entrées (LRU: Least Recently Used)
        - Expiration après T secondes (TTL: Time To Live)
        - Évite de re-analyser les mêmes images
    
    Utilité:
        - Si la même image est soumise plusieurs fois (ex: ESP32 qui envoie
          la même photo par erreur), le résultat est en cache
        - Gain de temps CPU considérable
    
    Politiques:
        - LRU: les entrées les moins récentes sont supprimées en premier
        - TTL: 1 heure par défaut (3600 secondes)
        - Taille max: 100 images
    """
    def __init__(self, maxsize=100, ttl=3600):  # 100 images max, 1 heure de vie
        self.maxsize = maxsize
        self.ttl = ttl  # time to live en secondes
        self.cache = OrderedDict()  # OrderedDict pour implémenter LRU
        self.timestamps = {}
        
    def _get_key(self, image_path):
        """
        Génère une clé unique basée sur le contenu de l'image (hash MD5).
        
        📥 ENTRÉE: chemin de l'image
        📤 SORTIE: hash MD5 (32 caractères hexadécimaux)
        """
        try:
            with open(image_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            logger.error(f"❌ Erreur lecture image pour cache: {e}")
            return None
    
    def get(self, image_path):
        """Récupère un résultat du cache s'il existe et n'est pas expiré"""
        key = self._get_key(image_path)
        if key is None:
            return None
        
        if key in self.cache:
            # Vérifier si le cache n'est pas expiré
            if time.time() - self.timestamps[key] < self.ttl:
                # Déplacer l'élément à la fin (récent) - politique LRU
                self.cache.move_to_end(key)
                logger.debug(f"🎯 Cache HIT - {os.path.basename(image_path)}")
                return self.cache[key]
            else:
                # Expiré, supprimer
                logger.debug(f"⏰ Cache EXPIRED - {os.path.basename(image_path)}")
                del self.cache[key]
                del self.timestamps[key]
        
        logger.debug(f"❌ Cache MISS - {os.path.basename(image_path)}")
        return None
    
    def set(self, image_path, value):
        """Ajoute un résultat au cache"""
        key = self._get_key(image_path)
        if key is None:
            return
        
        # Ajouter au cache
        self.cache[key] = value
        self.timestamps[key] = time.time()
        
        # Déplacer à la fin (récent)
        self.cache.move_to_end(key)
        
        # Si trop d'éléments, supprimer le plus ancien (LRU)
        if len(self.cache) > self.maxsize:
            oldest_key, _ = self.cache.popitem(last=False)
            if oldest_key in self.timestamps:
                del self.timestamps[oldest_key]
            logger.debug(f"🗑️ Cache LRU - suppression de l'élément le plus ancien")
    
    def clear(self):
        """Vide le cache manuellement"""
        self.cache.clear()
        self.timestamps.clear()
        logger.info("🧹 Cache IA vidé manuellement")
    
    def stats(self):
        """Retourne des statistiques sur le cache"""
        current_time = time.time()
        ages = [current_time - ts for ts in self.timestamps.values()] if self.timestamps else []
        
        return {
            "size": len(self.cache),
            "maxsize": self.maxsize,
            "ttl": self.ttl,
            "usage_percent": round(len(self.cache) / self.maxsize * 100, 1) if self.maxsize > 0 else 0,
            "oldest_age_sec": round(max(ages), 1) if ages else 0,
            "newest_age_sec": round(min(ages), 1) if ages else 0,
            "avg_age_sec": round(sum(ages) / len(ages), 1) if ages else 0
        }

# Initialiser le cache global
model_cache = ModelCache(maxsize=100, ttl=3600)  # 100 images, 1 heure


# ============================================================================
# 🧠 DÉFINITION DU MODÈLE HYBRIDE
# ============================================================================

class HybridModel(nn.Module):
    """
    Modèle hybride combinant :
        - ResNet50 pour les features visuelles profondes
        - Une branche classique pour 5 features manuelles
        - Fusion des deux pour la classification finale
    
    Architecture:
        Entrée image (224x224x3) → ResNet50 → 2048 features
        Entrée classique (5) → Linear(5→64→128) → 128 features
        Fusion (2048+128=2176) → Linear(2176→512→256→num_classes)
    """
    def __init__(self, num_classes=5, num_classical=5):
        super().__init__()
        # ResNet50 sans la couche finale (extracteur de features)
        resnet = models.resnet50(weights=None)
        self.resnet_features = nn.Sequential(*list(resnet.children())[:-1])
        
        # Branche classique: 5 features → 64 → 128
        self.classical_branch = nn.Sequential(
            nn.Linear(num_classical, 64), nn.ReLU(), nn.BatchNorm1d(64), nn.Dropout(0.3),
            nn.Linear(64, 128),           nn.ReLU(), nn.BatchNorm1d(128),
        )
        
        # Fusion: 2048 (ResNet) + 128 (classique) = 2176 → classification
        self.fusion = nn.Sequential(
            nn.Linear(2048+128, 512), nn.ReLU(), nn.BatchNorm1d(512), nn.Dropout(0.4),
            nn.Linear(512, 256),      nn.ReLU(), nn.BatchNorm1d(256), nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, image, classical):
        """
        Passage avant (forward pass)
        
        📥 ENTRÉE:
            - image: tenseur (batch, 3, 224, 224) - image normalisée
            - classical: tenseur (batch, 5) - features classiques
        📤 SORTIE: logits (batch, num_classes)
        """
        rn = self.resnet_features(image).view(-1, 2048)
        cl = self.classical_branch(classical)
        return self.fusion(torch.cat([rn, cl], dim=1))


# ============================================================================
# 🎨 FEATURES CLASSIQUES (5 descripteurs)
# ============================================================================

def score_couleur(img_bgr):
    """
    Feature 1 : Analyse couleur
    
    Principe:
        - Panneaux propres → zones bleues (réflet du ciel) ou noires (cellules)
        - Panneaux sales → zones blanches/grises (poussière)
    
    Algorithme:
        1. Conversion en HSV et LAB
        2. Masques pour détecter bleu et noir (couleurs propres)
        3. Calcul du ratio de pixels propres
        4. Fusion avec la luminosité
    
    📤 SORTIE: float entre 0 (sale) et 1 (propre)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    total = img_bgr.shape[0] * img_bgr.shape[1]
    masque_bleu   = cv2.inRange(hsv, np.array([90,20,5]),  np.array([140,255,130]))
    masque_noir   = cv2.inRange(hsv, np.array([0,0,0]),    np.array([180,50,80]))
    masque_propre = cv2.bitwise_or(masque_bleu, masque_noir)
    luminosite    = np.mean(lab[:,:,0]) / 255.0
    ratio_propre  = cv2.countNonZero(masque_propre) / total
    return float(np.clip(luminosite*0.5 + (1-ratio_propre)*0.5, 0, 1))

def score_texture(img_bgr):
    """
    Feature 2 : Analyse texture
    
    Principe:
        - LBP (Local Binary Patterns) pour la rugosité
        - Filtres de Gabor pour les orientations
        - Plus de texture = plus sale
    
    📤 SORTIE: float entre 0 (texture lisse) et 1 (texture rugueuse)
    """
    gray    = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray_f  = img_as_float(gray)
    lbp     = local_binary_pattern(gray, P=8, R=1, method='uniform')
    lbp_std = np.std(lbp)
    gabor_responses = []
    for freq in [0.1, 0.3, 0.5]:
        for theta in [0, np.pi/4, np.pi/2]:
            real, _ = gabor(gray_f, frequency=freq, theta=theta)
            gabor_responses.append(np.mean(np.abs(real)))
    lbp_norm   = 1 - np.clip(lbp_std / 10.0, 0, 1)
    gabor_norm = 1 - np.clip(np.mean(gabor_responses) / 0.1, 0, 1)
    return float(np.clip(lbp_norm*0.5 + gabor_norm*0.5, 0, 1))

def score_brillance(img_bgr):
    """
    Feature 3 : Brillance et reflets
    
    Principe:
        - Valeur V (HSV) pour la luminosité
        - Saturation S pour l'intensité des couleurs
        - Reflets (pixels >220) caractéristiques des zones sales
    
    📤 SORTIE: float entre 0 (terne) et 1 (brillant)
    """
    hsv  = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    V    = hsv[:,:,2].astype(float) / 255.0
    S    = hsv[:,:,1].astype(float) / 255.0
    _, reflets = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
    ratio_reflets = cv2.countNonZero(reflets) / gray.size
    return float(np.clip(np.mean(V)*0.4 + (1-np.mean(S))*0.4 - ratio_reflets*0.2, 0, 1))

def score_entropie(img_bgr):
    """
    Feature 4 : Entropie locale (patchs 8x8)
    
    Principe:
        - Mesure le désordre/détail dans l'image
        - Plus d'entropie = plus de détails = plus sale
        - Calcul sur des patchs 8x8 pixels
    
    📤 SORTIE: float entre 0 (faible entropie) et 1 (forte entropie)
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    entropies, bloc = [], 8
    for i in range(0, h-bloc, bloc):
        for j in range(0, w-bloc, bloc):
            patch = gray[i:i+bloc, j:j+bloc]
            p = cv2.calcHist([patch],[0],None,[256],[0,256]).flatten()
            p = p / (p.sum()+1e-10)
            p = p[p>0]
            entropies.append(-np.sum(p * np.log2(p+1e-10)))
    return float(1 - np.clip(np.mean(entropies) / 8.0, 0, 1))

def score_fft(img_bgr):
    """
    Feature 5 : Analyse fréquentielle (FFT)
    
    Principe:
        - Les hautes fréquences correspondent aux détails fins (poussière)
        - Les basses fréquences correspondent aux grandes surfaces
        - Transformée de Fourier rapide (FFT)
    
    📤 SORTIE: float entre 0 (basses fréquences) et 1 (hautes fréquences)
    """
    gray   = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    fshift = np.fft.fftshift(np.fft.fft2(gray))
    mag    = 20 * np.log(np.abs(fshift) + 1)
    h, w   = mag.shape
    mask   = np.zeros((h,w), np.uint8)
    cv2.circle(mask, (w//2,h//2), min(h,w)//4, 255, -1)
    mask  = cv2.bitwise_not(mask)
    ratio = np.mean(mag[mask>0]) / (np.mean(mag)+1e-10)
    return float(np.clip(1 - ratio/1.5, 0, 1))

def extract_classical_features(img_bgr):
    """
    Extraction des 5 features classiques.
    
    📥 ENTRÉE: image BGR (OpenCV)
    📤 SORTIE: numpy array de 5 float (features normalisés entre 0 et 1)
    """
    img = cv2.resize(img_bgr, (224, 224))
    return np.array([
        score_couleur(img), score_texture(img),
        score_brillance(img), score_entropie(img), score_fft(img)
    ], dtype=np.float32)


# ============================================================================
# 🆕 FONCTION D'ANALYSE COULEUR AVEC GRIS (poussière)
# ============================================================================

def compute_clean_score(img_bgr,
                        lower_blue=(90,20,5), upper_blue=(140,255,130),
                        lower_black=(0,0,0), upper_black=(180,50,80),
                        lower_orange=(5,50,50), upper_orange=(25,255,200),
                        lower_dust=(0,0,50), upper_dust=(180,50,255)):
    """
    Calcule les ratios de pixels :
        - propre (bleu + noir)
        - poussière (gris terne)
        - sable (orange)
    
    Retourne les trois ratios et un score de propreté normalisé.
    
    📥 ENTRÉE: image BGR (OpenCV)
    📤 SORTIE: (clean_ratio, dust_ratio, orange_ratio, clean_score)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    mask_blue = cv2.inRange(hsv, np.array(lower_blue), np.array(upper_blue))
    mask_black = cv2.inRange(hsv, np.array(lower_black), np.array(upper_black))
    mask_orange = cv2.inRange(hsv, np.array(lower_orange), np.array(upper_orange))
    mask_dust = cv2.inRange(hsv, np.array(lower_dust), np.array(upper_dust))

    total_pixels = img_bgr.shape[0] * img_bgr.shape[1]
    clean_pixels = cv2.countNonZero(mask_blue) + cv2.countNonZero(mask_black)
    dust_pixels = cv2.countNonZero(mask_dust)
    orange_pixels = cv2.countNonZero(mask_orange)

    clean_ratio = clean_pixels / total_pixels
    dust_ratio = dust_pixels / total_pixels
    orange_ratio = orange_pixels / total_pixels

    # Score de propreté (1 = très propre)
    clean_score = clean_ratio * (1 - (dust_ratio + orange_ratio))

    return clean_ratio, dust_ratio, orange_ratio, clean_score


# ============================================================================
# 🆕 PRÉ‑FILTRE : VÉRIFICATION QUE C'EST UN PANNEAU
# ============================================================================

def is_panel_image(img_bgr, 
                   blue_lower=(90,20,5), blue_upper=(140,255,130),
                   black_lower=(0,0,0), black_upper=(180,50,80),
                   gray_lower=(0,0,50), gray_upper=(180,50,255),
                   sand_lower=(5,50,50), sand_upper=(25,255,200),  # orange/rouge
                   min_panel_ratio=0.03,      # seuil minimal de couleurs panneau
                   min_sand_ratio=0.2):       # seuil pour considérer un encrassement massif
    """
    Vérifie si l'image correspond à un panneau solaire.
    
    Retourne True si :
        - le ratio de couleurs panneau (bleu+noir+gris) >= min_panel_ratio, OU
        - le ratio de couleurs sable (orange/rouge) >= min_sand_ratio
        (permet de reconnaître un panneau recouvert de sable)
    
    Utilité: éviter de traiter des images qui ne sont pas des panneaux
             (ex: photos de ciel, bâtiments, etc.)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    mask_blue = cv2.inRange(hsv, np.array(blue_lower), np.array(blue_upper))
    mask_black = cv2.inRange(hsv, np.array(black_lower), np.array(black_upper))
    mask_gray = cv2.inRange(hsv, np.array(gray_lower), np.array(gray_upper))
    mask_sand = cv2.inRange(hsv, np.array(sand_lower), np.array(sand_upper))
    
    panel_mask = cv2.bitwise_or(mask_blue, mask_black)
    panel_mask = cv2.bitwise_or(panel_mask, mask_gray)
    
    total_pixels = img_bgr.shape[0] * img_bgr.shape[1]
    panel_ratio = cv2.countNonZero(panel_mask) / total_pixels
    sand_ratio = cv2.countNonZero(mask_sand) / total_pixels
    
    # Accepte l'image si elle a suffisamment de couleurs panneau,
    # ou si elle est très recouverte de sable (peut être un panneau sale)
    return panel_ratio >= min_panel_ratio or sand_ratio >= min_sand_ratio


# ============================================================================
# 📥 CHARGEMENT DU MODÈLE
# ============================================================================

logger.info(f'🔧 Chargement modèle IA sur {DEVICE}...')
model = HybridModel(num_classes=len(CLASSES)).to(DEVICE)
model.eval()  # Mode évaluation (désactive dropout, batch norm en mode inference)

# Chargement des poids du modèle
if os.path.exists(MODEL_PATH):
    try:
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        
        # Vérifier la structure du checkpoint
        if 'model_state_dict' in ckpt:
            model.load_state_dict(ckpt['model_state_dict'])
            accuracy = ckpt.get('accuracy', 'N/A')
        else:
            # Si c'est directement les poids
            model.load_state_dict(ckpt)
            accuracy = 'N/A'
            
        logger.info(f'✅ Modèle chargé — Accuracy: {accuracy}%')
        
        # Test rapide avec un batch de taille 2 (pour éviter l'erreur BatchNorm)
        try:
            model.eval()
            with torch.no_grad():
                dummy_img = torch.randn(2, 3, 224, 224).to(DEVICE)
                dummy_feat = torch.randn(2, 5).to(DEVICE)
                test_out = model(dummy_img, dummy_feat)
            logger.info(f'✅ Test inférence OK - output shape: {test_out.shape}')
        except Exception as e:
            logger.warning(f"⚠️ Test inférence avec batch=2 échoué, mais le modèle peut quand même fonctionner: {e}")
            
            # Test avec batch=1 (peut générer un warning mais on l'ignore)
            try:
                model.eval()
                with torch.no_grad():
                    dummy_img = torch.randn(1, 3, 224, 224).to(DEVICE)
                    dummy_feat = torch.randn(1, 5).to(DEVICE)
                    test_out = model(dummy_img, dummy_feat)
                logger.info(f'✅ Test inférence batch=1 OK - output shape: {test_out.shape}')
            except Exception as e2:
                logger.error(f"❌ Test inférence complètement échoué: {e2}")
        
    except Exception as e:
        logger.error(f"❌ Erreur chargement modèle: {e}")
        logger.error("Vérifie que le fichier .pth n'est pas corrompu")
else:
    logger.warning(f"⚠️ Fichier modèle non trouvé à {MODEL_PATH}")

# S'assurer que le modèle est en mode évaluation
model.eval()

# Transformations pour l'image (mêmes que pour l'entraînement)
val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])  # Stats ImageNet
])

"""
# ============================================================================
# 🔮 FONCTION DE PRÉDICTION PRINCIPALE (AVEC FUSION COULEUR ET PRÉ‑FILTRE)
# ============================================================================

def predict_soiling_level(image_path):
    """
"""
    Analyse une image et retourne le niveau d'ensablement.
    
    📥 ENTRÉE:
        image_path (str): Chemin vers l'image JPG
    
    📤 SORTIE:
        tuple: (soiling_percent, status, confidence)
            - soiling_percent : float (0-100%)
            - status : str ("Clean", "Warning", "Critical", "Error", "Unknown")
            - confidence : float (0-1)
    
    🔄 ALGORITHME COMPLET:
        1. Vérification du cache
        2. Lecture de l'image
        3. Pré-filtre (est-ce un panneau ?)
        4. Analyse couleur (pour fusion)
        5. Extraction des features classiques
        6. Inférence du modèle IA
        7. Fusion des deux prédictions
        8. Détermination du statut selon seuils
        9. Stockage en cache
        10. Retour du résultat
    
    💡 FUSION DES PRÉDICTIONS:
        - Modèle IA: basé sur deep learning
        - Analyse couleur: basée sur règles simples
        - Poids: confiance du modèle + confiance de l'analyse couleur
        - Plus robuste que le modèle seul
    """
"""
    if not os.path.exists(MODEL_PATH):
        logger.error(f"❌ Modèle non trouvé: {MODEL_PATH}")
        return 0.0, "Model Missing", 0.0

    # ========================================================================
    # 1. VÉRIFICATION DU CACHE
    # ========================================================================
    cached_result = model_cache.get(image_path)
    if cached_result is not None:
        logger.info(f"🎯 Cache HIT - {os.path.basename(image_path)} -> {cached_result[0]}% ({cached_result[1]})")
        return cached_result

    try:
        # ====================================================================
        # 2. LECTURE DE L'IMAGE
        # ====================================================================
        bgr = cv2.imread(image_path)
        if bgr is None:
            logger.error(f"❌ Impossible de lire l'image: {image_path}")
            return 0.0, "Error", 0.0

        # ====================================================================
        # 3. PRÉ‑FILTRE : VÉRIFICATION QUE C'EST UN PANNEAU
        # ====================================================================
        if not is_panel_image(bgr):
            logger.warning(f"⚠️ Image {os.path.basename(image_path)} ne semble pas être un panneau solaire. Ignorée.")
            return 0.0, "Unknown", 0.0

        # ====================================================================
        # 4. ANALYSE COULEUR (POUR FUSION)
        # ====================================================================
        clean_ratio, dust_ratio, orange_ratio, _ = compute_clean_score(bgr)

        # Calcul du pourcentage de saleté (poids : gris = 0.5, orange = 1.0)
        total_dirt = dust_ratio * 0.5 + orange_ratio * 1.0
        total_surface = clean_ratio + dust_ratio + orange_ratio
        if total_surface > 0:
            color_percent = 100 * total_dirt / total_surface
        else:
            color_percent = 50.0

        coverage = total_surface
        color_conf = min(1.0, coverage * 2)   # plus la surface analysée est grande, plus fiable

        # ====================================================================
        # 5. INFÉRENCE DU MODÈLE IA
        # ====================================================================
        pil = Image.open(image_path).convert('RGB')
        classical = extract_classical_features(bgr)
        tensor_img = val_transform(pil).unsqueeze(0).to(DEVICE)
        tensor_feat = torch.tensor(classical).unsqueeze(0).to(DEVICE)

        start_time = time.time()
        with torch.no_grad():
            outputs = model(tensor_img, tensor_feat)
            probs = torch.softmax(outputs, dim=1)[0].cpu().numpy()
        inference_time = time.time() - start_time

        # Conversion probabilités → pourcentage
        pred_idx = int(probs.argmax())
        model_conf = float(probs[pred_idx])
        model_percent = sum(p * v for p, v in zip(probs, CLASS_VALUES))

        # ====================================================================
        # 6. FUSION DES DEUX PRÉDICTIONS
        # ====================================================================
        total_conf = model_conf + color_conf
        if total_conf > 0:
            final_percent = (model_conf * model_percent + color_conf * color_percent) / total_conf
        else:
            final_percent = 50.0
        final_confidence = max(model_conf, color_conf)   # confiance finale = la plus élevée des deux

        # ====================================================================
        # 7. DÉTERMINATION DU STATUT SELON SEUILS
        # ====================================================================
        config = get_config()
        seuil_warning = config.get("seuil_warning", Config.SEUIL_WARNING)
        seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)

        if final_percent < seuil_warning:
            status = "Clean"
        elif final_percent < seuil_critical:
            status = "Warning"
        else:
            status = "Critical"

        # ====================================================================
        # 8. STOCKAGE EN CACHE ET RETOUR
        # ====================================================================
        result = (round(float(final_percent), 1), status, round(float(final_confidence), 2))
        model_cache.set(image_path, result)

        logger.info(f"🧠 IA Result (fusion): {final_percent:.1f}% ({status}) - Conf: {final_confidence:.1%} "
                    f"(modèle: {model_percent:.1f}% @{model_conf:.1%}, "
                    f"couleur: {color_percent:.1f}% @{color_conf:.1%})")
        return result

    except Exception as e:
        logger.error(f"❌ Erreur IA: {e}")
        import traceback
        traceback.print_exc()
        return 0.0, "Error", 0.0

"""
# ============================================================================
# 🔮 FONCTION DE PRÉDICTION PRINCIPALE (VERSION MODÈLE SEUL 
# ============================================================================

def predict_soiling_level(image_path):
    """
    Analyse une image et retourne le niveau d'ensablement.
    
    📥 ENTRÉE:
        image_path (str): Chemin vers l'image JPG
    
    📤 SORTIE:
        tuple: (soiling_percent, status, confidence)
            - soiling_percent : float (0-100%)
            - status : str ("Clean", "Warning", "Critical", "Error", "Unknown")
            - confidence : float (0-1)
    
    🔄 ALGORITHME:
        1. Vérification du cache
        2. Lecture de l'image
        3. Extraction des features classiques
        4. Inférence du modèle IA
        5. Conversion probabilités → pourcentage (pondéré par CLASS_VALUES)
        6. Détermination du statut selon seuils
        7. Stockage en cache
        8. Retour du résultat
    """
    if not os.path.exists(MODEL_PATH):
        logger.error(f"❌ Modèle non trouvé: {MODEL_PATH}")
        return 0.0, "Model Missing", 0.0

    # ========================================================================
    # 1. VÉRIFICATION DU CACHE
    # ========================================================================
    cached_result = model_cache.get(image_path)
    if cached_result is not None:
        logger.info(f"🎯 Cache HIT - {os.path.basename(image_path)} -> {cached_result[0]}% ({cached_result[1]})")
        return cached_result

    try:
        # ====================================================================
        # 2. LECTURE DE L'IMAGE
        # ====================================================================
        bgr = cv2.imread(image_path)
        if bgr is None:
            logger.error(f"❌ Impossible de lire l'image: {image_path}")
            return 0.0, "Error", 0.0

        # ====================================================================
        # 3. EXTRACTION DES FEATURES CLASSIQUES
        # ====================================================================
        classical = extract_classical_features(bgr)

        # ====================================================================
        # 4. INFÉRENCE DU MODÈLE IA
        # ====================================================================
        pil = Image.open(image_path).convert('RGB')
        tensor_img = val_transform(pil).unsqueeze(0).to(DEVICE)
        tensor_feat = torch.tensor(classical).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(tensor_img, tensor_feat)
            probs = torch.softmax(outputs, dim=1)[0].cpu().numpy()

        # ====================================================================
        # 5. CONVERSION PROBABILITÉS → POURCENTAGE (comme test_model.py)
        # ====================================================================
        pred_idx = int(probs.argmax())
        confidence = float(probs[pred_idx])
        soiling_percent = sum(p * v for p, v in zip(probs, CLASS_VALUES))

        # ====================================================================
        # 6. DÉTERMINATION DU STATUT SELON SEUILS
        # ====================================================================
        config = get_config()
        seuil_warning = config.get("seuil_warning", Config.SEUIL_WARNING)
        seuil_critical = config.get("seuil_critical", Config.SEUIL_CRITICAL)

        if soiling_percent < seuil_warning:
            status = "Clean"
        elif soiling_percent < seuil_critical:
            status = "Warning"
        else:
            status = "Critical"

        # ====================================================================
        # 7. STOCKAGE EN CACHE ET RETOUR
        # ====================================================================
        result = (round(float(soiling_percent), 1), status, round(float(confidence), 2))
        model_cache.set(image_path, result)

        logger.info(f"🧠 IA Result: {soiling_percent:.1f}% ({status}) - Conf: {confidence:.1%} (classe: {CLASSES[pred_idx]})")
        return result

    except Exception as e:
        logger.error(f"❌ Erreur IA: {e}")
        import traceback
        traceback.print_exc()
        return 0.0, "Error", 0.0



# ============================================================================
# 📊 FONCTIONS UTILITAIRES POUR LE CACHE
# ============================================================================

def get_cache_stats():
    """Retourne les statistiques du cache"""
    return model_cache.stats()

def clear_cache():
    """Vide le cache manuellement"""
    model_cache.clear()


# ============================================================================
# 🧪 TEST RAPIDE SI EXÉCUTÉ DIRECTEMENT
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TEST DU MODULE INFERENCE ENGINE")
    print("=" * 60)
    
    print(f"\n📁 Modèle: {MODEL_PATH}")
    print(f"📊 Classes: {CLASSES}")
    print(f"💻 Device: {DEVICE}")
    print(f"📦 Cache: {model_cache.stats()}")
    
    # Chercher une image de test
    import glob
    test_images = glob.glob("*.jpg") + glob.glob("storage/*.jpg")
    
    if test_images:
        test_img = test_images[0]
        print(f"\n🖼️  Test avec: {test_img}")
        result = predict_soiling_level(test_img)
        print(f"✅ Résultat: {result}")
        
        # Test du cache
        print(f"\n🔄 Second test (devrait venir du cache)...")
        result2 = predict_soiling_level(test_img)
        print(f"✅ Résultat: {result2}")
        
        print(f"\n📊 Stats cache: {get_cache_stats()}")
    else:
        print("❌ Aucune image trouvée pour le test")