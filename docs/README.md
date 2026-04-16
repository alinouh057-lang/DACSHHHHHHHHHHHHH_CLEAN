# 📚 Documentation Complète - PV Monitor System
## Système de Surveillance Intelligente de Panneaux Solaires

> **Document destiné aux débutants et à la préparation de soutenance**

---

## 🎯 Table des Matières

Cette documentation est divisée en plusieurs fichiers pour faciliter la lecture :

1. **[01_introduction_et_contexte.md](./01_introduction_et_contexte.md)** 
   - Présentation du projet
   - Contexte et problématique
   - Objectifs du système

2. **[02_architecture_globale.md](./02_architecture_globale.md)**
   - Vue d'ensemble de l'architecture
   - Schéma des composants
   - Flux de données

3. **[03_backend_guide_complet.md](./03_backend_guide_complet.md)**
   - Architecture du backend (FastAPI)
   - Structure des dossiers
   - Fichiers principaux expliqués
   - API REST endpoints

4. **[04_intelligence_artificielle.md](./04_intelligence_artificielle.md)**
   - Modèle hybride (ResNet50 + features classiques)
   - Les 5 descripteurs manuels
   - Processus d'inférence
   - Cache et optimisations

5. **[05_collecte_donnees_esp32.md](./05_collecte_donnees_esp32.md)**
   - Système dual ESP32-CAM + ESP32-ELEC
   - Synchronisation des données
   - Endpoint d'ingestion
   - Gestion des devices

6. **[06_base_de_donnees_mongodb.md](./06_base_de_donnees_mongodb.md)**
   - Collections MongoDB
   - Structure des documents
   - Requêtes principales

7. **[07_frontend_interface_web.md](./07_frontend_interface_web.md)**
   - Architecture Next.js/React
   - Pages et composants
   - Internationalisation (i18n)
   - Visualisation des données

8. **[08_systeme_alertes_notifications.md](./08_systeme_alertes_notifications.md)**
   - Détection des seuils
   - Envoi d'emails
   - Tâches de fond
   - Cooldowns anti-spam

9. **[09_qa_soutenance_jury.md](./09_qa_soutenance_jury.md)**
   - Questions fréquentes du jury
   - Réponses détaillées
   - Justifications techniques
   - Démonstrations à préparer

10. **[10_installation_et_deploiement.md](./10_installation_et_deploiement.md)**
    - Prérequis système
    - Installation pas à pas
    - Configuration (.env)
    - Lancement du projet

11. **[11_securite_et_authentification.md](./11_securite_et_authentification.md)**
    - JWT et authentification
    - Rôles utilisateurs
    - Sécurité des API
    - Bonnes pratiques

12. **[12_performances_et_optimisation.md](./12_performances_et_optimisation.md)**
    - Optimisations implémentées
    - Cache LRU
    - GPU acceleration
    - Monitoring

---

## 🚀 Démarrage Rapide

### Pour commencer immédiatement :

1. **Lire l'introduction** → `docs/01_introduction_et_contexte.md`
2. **Comprendre l'architecture** → `docs/02_architecture_globale.md`
3. **Préparer la soutenance** → `docs/09_qa_soutenance_jury.md`

### Structure du projet :

```
/workspace
├── backend/                 # API FastAPI (Python)
│   ├── main.py             # Point d'entrée principal
│   ├── routers/            # Endpoints API (17 routeurs)
│   ├── services/           # Logique métier
│   ├── tasks/              # Tâches de fond
│   ├── inference_engine.py # IA (détection ensablement)
│   ├── database.py         # Connexion MongoDB
│   └── config.py           # Configuration
│
├── frontend/               # Interface Web (Next.js/React)
│   ├── app/               # Pages de l'application
│   ├── components/        # Composants réutilisables
│   ├── contexts/          # Contextes React
│   └── i18n/              # Traductions (i18n)
│
└── docs/                  # Documentation (ce dossier)
    ├── 01_*.md à 12_*.md  # Guides détaillés
    └── README.md          # Ce fichier
```

---

## 📊 Technologies Utilisées

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Backend** | FastAPI | Latest | API REST asynchrone |
| **Frontend** | Next.js | 16.1.6 | Framework React |
| **Base de données** | MongoDB | Atlas | Stockage NoSQL |
| **IA / Deep Learning** | PyTorch | Latest | Modèle hybride |
| **Traitement d'image** | OpenCV, Pillow | Latest | Analyse visuelle |
| **Features classiques** | scikit-image | Latest | LBP, Gabor, FFT |
| **Microcontrôleurs** | ESP32-CAM, ESP32-ELEC | - | Collecte données |
| **Authentification** | JWT | - | Sécurité API |
| **Email** | SMTP (Gmail) | - | Notifications |
| **Styling** | TailwindCSS | v4 | Interface utilisateur |
| **Graphiques** | Recharts | 3.8.0 | Visualisation |
| **Langues** | i18next | Latest | Internationalisation |

---

## 🔑 Concepts Clés à Comprendre

### 1. **Qu'est-ce que l'ensablement ?**
L'accumulation de poussière, sable et saleté sur les panneaux solaires, réduisant leur efficacité jusqu'à 30-40%.

### 2. **Pourquoi un modèle hybride ?**
Combinaison de :
- **Deep Learning** (ResNet50) : Capture des motifs complexes
- **Features classiques** (5 descripteurs) : Couleur, texture, brillance, entropie, FFT
→ Plus robuste qu'une seule approche

### 3. **Comment fonctionne la synchronisation ESP32 ?**
Deux devices par panneau :
- ESP32-CAM → Envoie l'image
- ESP32-ELEC → Envoie voltage/courant/température
- Le backend attend les deux (timer 5s) puis fusionne

### 4. **Système d'alertes intelligent**
- Seuils configurables (Warning: 30%, Critical: 60%)
- Cooldowns anti-spam (30min/15min)
- Notifications email automatiques

---

## 📖 Guide de Lecture pour Débutants

### Niveau 1 - Découverte (2-3 heures)
1. Lire `01_introduction_et_contexte.md`
2. Lire `02_architecture_globale.md`
3. Parcourir `09_qa_soutenance_jury.md` (questions seulement)

### Niveau 2 - Compréhension (5-6 heures)
1. Lire `03_backend_guide_complet.md`
2. Lire `04_intelligence_artificielle.md`
3. Lire `05_collecte_donnees_esp32.md`

### Niveau 3 - Maîtrise (10+ heures)
1. Tous les fichiers docs
2. Explorer le code source
3. Tester les APIs avec Postman/curl

---

## ❓ FAQ Rapide

**Q: Quel est le but principal du projet ?**  
R: Surveiller automatiquement l'état de propreté des panneaux solaires et alerter quand un nettoyage est nécessaire.

**Q: Comment l'IA détecte-t-elle l'ensablement ?**  
R: Via un modèle hybride qui analyse les images avec ResNet50 + 5 descripteurs manuels (couleur, texture, etc.).

**Q: Combien de types d'utilisateurs ?**  
R: 3 rôles : Admin (tout), Manager (supervision), User (consultation).

**Q: Quelle est la précision du modèle ?**  
R: [À compléter avec vos métriques réelles]

**Q: Comment installer le projet ?**  
R: Voir `10_installation_et_deploiement.md`

---

## 🎓 Préparation Soutenance

### Points Forts à Mettre en Avant

1. **Architecture innovante** : Dual ESP32 avec synchronisation intelligente
2. **Modèle hybride** : Combinaison DL + features classiques
3. **Système temps réel** : Tâches de fond, alertes automatiques
4. **Interface complète** : Dashboard, historiques, rapports
5. **Production-ready** : Auth JWT, logs, gestion erreurs, cache

### Démonstrations à Préparer

1. ✅ Login/Register utilisateur
2. ✅ Dashboard avec KPIs en temps réel
3. ✅ Historique des mesures avec graphiques
4. ✅ Système d'alertes (emails)
5. ✅ Upload manuel d'image pour analyse IA
6. ✅ Génération de rapports PDF/Excel
7. ✅ Interface multilingue (si démo)

---

## 📞 Contact et Ressources

- **Code Source** : `/workspace`
- **Documentation** : `/workspace/docs`
- **API Docs** : `http://localhost:8000/docs` (Swagger UI)
- **Frontend** : `http://localhost:3000`

---

**Prochaine étape** : Commencez par lire [`docs/01_introduction_et_contexte.md`](./01_introduction_et_contexte.md)

---

*Document généré pour faciliter la compréhension et la soutenance du projet PV Monitor*
