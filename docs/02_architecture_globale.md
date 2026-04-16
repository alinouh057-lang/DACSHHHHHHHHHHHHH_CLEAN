# 02. Architecture Globale du Système

## 📋 Vue d'Ensemble

Ce document présente l'architecture complète de PV Monitor, depuis les capteurs hardware jusqu'à l'interface utilisateur web.

---

## 🏗️ Architecture en Couches

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Dashboard │  │  Historique │  │   Alertes   │             │
│  │    (Web)    │  │   (Web)     │  │   (Email)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE API (Backend)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FastAPI Server (main.py)                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Routeurs API (17 modules /api/v1/*)                     │  │
│  │  • ingest      • devices     • alerts    • soiling       │  │
│  │  • data        • performance • reports   • maintenance   │  │
│  │  • ... (13 autres)                                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Services Métier                                         │  │
│  │  • alert_service    • email_service                      │  │
│  │  • cleaning_service • irradiance_service                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Moteur IA (inference_engine.py)                         │  │
│  │  • Modèle hybride ResNet50 + features classiques         │  │
│  │  • Cache LRU (100 images, 1h TTL)                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Tâches Background                                       │  │
│  │  • alert_task      • cleanup_task    • offline_check     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Motor (Async MongoDB)
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE DONNÉES                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MongoDB Atlas                           │  │
│  │                                                          │  │
│  │  Collections:                                            │  │
│  │  • surveillance       → Mesures + analyses IA            │  │
│  │  • devices            → Configuration ESP32              │  │
│  │  • alerts             → Historique alertes               │  │
│  │  • interventions      → Logs maintenance                 │  │
│  │  • users              → Comptes utilisateurs             │  │
│  │  • panel_config       → Paramètres panneaux              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WiFi/Internet
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE HARDWARE                              │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │    ESP32-CAM        │      │   ESP32-ELEC        │         │
│  │  ┌───────────────┐  │      │  ┌───────────────┐  │         │
│  │  │ Caméra OV2640 │  │      │  │ Capteur V     │  │         │
│  │  │ Capture image │  │      │  │ Capteur A     │  │         │
│  │  │ JPEG 640x480  │  │      │  │ Capteur Temp  │  │         │
│  │  └───────────────┘  │      │  └───────────────┘  │         │
│  │                     │      │                     │         │
│  │  Envoie: Image      │      │  Envoie: V, A, °C   │         │
│  └─────────────────────┘      └─────────────────────┘         │
│           ↓                            ↓                        │
│        WiFi 2.4GHz                WiFi 2.4GHz                  │
│           └────────────┬───────────┘                           │
│                        ↓                                       │
│              ┌──────────────────┐                             │
│              │   Panneau Solaire│                             │
│              │   (1 panneau =   │                             │
│              │    2 ESP32)      │                             │
│              └──────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Données Complet

### Scénario: Nouvelle Mesure

```
1. [ESP32-CAM] Capture photo panneau
   ↓
2. [ESP32-CAM] Envoie POST /api/v1/ingest (image + device_id)
   ↓
3. [Backend] Reçoit image, stocke dans pending_data[device_id]
   ↓
4. [Timer] Démarre compte à rebours 5 secondes
   ↓
5. [ESP32-ELEC] Mesure V, A, température
   ↓
6. [ESP32-ELEC] Envoie POST /api/v1/ingest (données élec + device_id)
   ↓
7. [Backend] Reçoit données élec, fusionne avec image
   ↓
8. [Backend] Sauvegarde image sur disque (/storage/{device_id}_{timestamp}.jpg)
   ↓
9. [Backend] Analyse IA de l'image
   │
   ├─→ [Cache] Vérifie si image déjà analysée (MD5 hash)
   │   └─→ HIT: Retourne résultat cached (<10ms)
   │   └─→ MISS: Continue...
   │
   ├─→ [ResNet50] Extrait 2048 features visuelles
   │
   ├─→ [Features Classiques] Calcule 5 scores:
   │   • score_couleur (bleu/noir vs gris)
   │   • score_texture (LBP + Gabor)
   │   • score_brillance (reflets)
   │   • score_entropie (désordre local)
   │   • score_fft (hautes fréquences)
   │
   ├─→ [Fusion] Combine 2048 + 128 features
   │
   └─→ [Classification] Softmax → [P(Clean), P(Moderate), P(Critical)]
   ↓
10. [Backend] Calcule soiling_percent = P(Mod)*50 + P(Crit)*100
    ↓
11. [Backend] Récupère irradiance solaire (API météo)
    ↓
12. [Backend] Crée document MongoDB complet:
    {
      timestamp: ISODate(...),
      device_id: "esp32_cam_01",
      electrical_data: { voltage, current, power, irradiance },
      ai_analysis: { soiling_percent, status, confidence },
      media: { image_url, image_b64 },
      synchronized: true
    }
    ↓
13. [MongoDB] Insertion dans collection 'surveillance'
    ↓
14. [Alert Task] (tourne toutes les 60s) Vérifie seuils:
    │
    ├─→ soiling >= 60% ? → Alerte CRITICAL + Email
    ├─→ soiling >= 30% ? → Alerte WARNING + Email
    └─→ Vérifie cooldowns (30min W, 15min C)
    ↓
15. [Frontend] (polling 30s) Refresh dashboard
    └─→ Utilisateur voit nouvelle mesure !
```

---

## 📦 Composants Détaillés

### 1. Hardware (ESP32)

**ESP32-CAM:**
- Microcontrôleur: ESP32-S (dual-core 240MHz)
- Caméra: OV2640 (UXGA 1600x1200 max)
- WiFi: 802.11 b/g/n 2.4GHz
- Stockage: microSD card (optionnel)
- Alimentation: 5V USB ou panneau solaire
- Code: `/backend/esp32_cam_1.py` (exemple)

**ESP32-ELEC:**
- Microcontrôleur: ESP32 standard
- Capteurs:
  - Voltage: Diviseur résistif (0-25V → 0-3.3V ADC)
  - Courant: Capteur Hall ACS712 ou shunt
  - Température: DS18B20 ou DHT22
- WiFi: 802.11 b/g/n 2.4GHz
- Alimentation: 5V USB
- Code: `/backend/esp32_elec_1.py` (exemple)

**Communication ESP32 → Backend:**
```cpp
// Exemple code ESP32 (simplifié)
#include <WiFi.h>
#include <HTTPClient.h>

void sendToBackend(String deviceId, uint8_t* imageData, size_t imageSize) {
  WiFi.begin(SSID, PASSWORD);
  
  HTTPClient http;
  http.begin("http://api.pvmonitor.com/api/v1/ingest");
  http.addHeader("Authorization", "Bearer " + JWT_TOKEN);
  http.addHeader("Content-Type", "multipart/form-data");
  
  // Multipart form data avec image
  String boundary = "----WebKitFormBoundary" + random(1000000, 9999999);
  
  HTTPClient::Request request = http.post();
  request.field("device_id", deviceId);
  request.file("image", imageData, imageSize, "photo.jpg");
  
  int httpResponseCode = request.send();
  
  if (httpResponseCode == 200) {
    Serial.println("✅ Données envoyées avec succès");
  } else {
    Serial.println("❌ Erreur: " + String(httpResponseCode));
  }
}
```

---

### 2. Backend (FastAPI)

**Structure des Fichiers:**
```
backend/
├── main.py                 # Point d'entrée, CORS, lifespan
├── config.py               # Configuration statique (.env)
├── config_manager.py       # Configuration dynamique (JSON)
├── database.py             # Connexion MongoDB Motor
├── auth.py                 # Authentification JWT
├── schemas.py              # Modèles Pydantic
├── inference_engine.py     # Moteur IA (hybride)
├── weather.py              # API météo (irradiance)
│
├── routers/                # Endpoints API (17 modules)
│   ├── __init__.py         # Export liste routeurs
│   ├── ingest.py           # POST /api/v1/ingest ⭐
│   ├── devices.py          # CRUD devices
│   ├── alerts.py           # Gestion alertes
│   ├── soiling.py          # Analyses ensablement
│   ├── data.py             # History, stats, latest
│   ├── performance.py      # KPIs, rendements
│   ├── maintenance.py      # Logs maintenance
│   ├── interventions.py    # Interventions détaillées
│   ├── reports.py          # Génération rapports
│   ├── export.py           # Export JSON/CSV
│   ├── analyze.py          # Upload manuel image
│   ├── heartbeat.py        # Signaux vie ESP32
│   ├── storage.py          # Info stockage images
│   ├── cache.py            # Stats cache IA
│   ├── user.py             # Préférences utilisateur
│   ├── admin.py            # Admin (config, users)
│   └── auth_routes.py      # Login/Register
│
├── services/               # Logique métier
│   ├── alert_service.py    # Création/gestion alertes
│   ├── email_service.py    # Envoi emails SMTP
│   ├── cleaning_service.py # Calcul efficacité nettoyage
│   └── irradiance_service.py# Données solaires
│
├── tasks/                  # Tâches background
│   ├── alert_task.py       # Vérifie seuils (60s)
│   ├── cleanup_task.py     # Nettoie images (24h)
│   └── offline_check.py    # Détecte ESP offline (5min)
│
└── utils/                  # Utilitaires
    ├── validators.py       # Validation données
    └── constants.py        # Constantes globales
```

**Exemple Endpoint (simplifié):**
```python
# routers/ingest.py
from fastapi import APIRouter, Depends, File, UploadFile, Form
from database import surveillance_collection
from inference_engine import predict_soiling_level
from auth import verify_token

router = APIRouter(prefix="/api/v1", tags=["ingest"])

@router.post("/ingest")
async def ingest_data(
    device_id: str = Form(...),
    voltage: float = Form(default=0),
    current: float = Form(default=0),
    temperature: float = Form(default=None),
    image: UploadFile = File(None),
    token: dict = Depends(verify_token)
):
    # 1. Vérifier autorisation device
    if not await is_device_authorized(device_id):
        raise HTTPException(403, "Device non autorisé")
    
    # 2. Traiter image si présente
    ai_result = None
    if image:
        # Sauvegarder image
        image_path = save_image(image, device_id)
        
        # Analyser avec IA
        ai_result = await predict_soiling_level(image_path)
    
    # 3. Fusionner données
    document = {
        "timestamp": datetime.now(timezone.utc),
        "device_id": device_id,
        "electrical_data": {
            "voltage": voltage,
            "current": current,
            "power": voltage * current
        },
        "ai_analysis": ai_result,
        "synchronized": image is not None
    }
    
    # 4. Sauvegarder MongoDB
    await surveillance_collection.insert_one(document)
    
    return {"status": "success", "document_id": str(inserted_id)}
```

---

### 3. Base de Données (MongoDB)

**Schéma Collection `surveillance`:**
```json
{
  "_id": ObjectId("..."),
  "timestamp": ISODate("2025-01-15T10:30:00Z"),
  "device_id": "esp32_cam_01",
  
  "electrical_data": {
    "voltage": 18.5,
    "current": 5.2,
    "power_output": 96.2,
    "irradiance": 850
  },
  
  "ai_analysis": {
    "soiling_percent": 45.3,
    "status": "Warning",
    "confidence": 0.87,
    "class_probs": {
      "Clean": 0.10,
      "Moderate": 0.70,
      "Critical": 0.20
    },
    "model_version": "hybrid_v1.0",
    "inference_time_ms": 1847
  },
  
  "media": {
    "image_url": "/storage/esp32_cam_01_1737024600.jpg",
    "image_b64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "file_size_kb": 145
  },
  
  "panel_config_used": {
    "area_m2": 1.6,
    "efficiency": 0.20,
    "tilt_angle": 30,
    "azimuth": 180
  },
  
  "synchronized": true,
  "weather_snapshot": {
    "temperature_ambient": 28.5,
    "humidity": 45,
    "wind_speed": 12
  }
}
```

**Index MongoDB:**
```javascript
// Optimisation requêtes
db.surveillance.createIndex({ "timestamp": -1 })
db.surveillance.createIndex({ "device_id": 1 })
db.surveillance.createIndex({ "device_id": 1, "timestamp": -1 })
db.surveillance.createIndex({ "ai_analysis.status": 1 })
```

---

### 4. Frontend (Next.js)

**Architecture Pages:**
```
frontend/app/
├── (dashboard)/              # Layout avec sidebar
│   ├── dashboard/            # Page d'accueil (KPIs)
│   │   └── page.tsx
│   ├── historique/           # Historique mesures
│   │   └── page.tsx
│   ├── alerts/               # Gestion alertes
│   │   └── page.tsx
│   ├── soiling/              # Analyse ensablement
│   │   └── page.tsx
│   ├── maintenance/          # Planning maintenance
│   │   └── page.tsx
│   ├── reports/              # Rapports
│   │   └── page.tsx
│   ├── energie/              # Production énergie
│   │   └── page.tsx
│   ├── admin/                # Administration
│   │   └── page.tsx
│   └── profile/              # Profil utilisateur
│       └── page.tsx
│
├── login/                    # Page connexion
│   └── page.tsx
├── register/                 # Page inscription
│   └── page.tsx
├── forgot-password/          # Réinitialisation mdp
│   └── page.tsx
└── layout.tsx                # Layout root
```

**Exemple Composant React:**
```typescript
// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchLatestData } from '@/lib/api';
import SoilingChart from '@/components/charts/SoilingChart';
import KPICard from '@/components/KPICard';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await fetchLatestData();
      setData(result);
      setLoading(false);
    }
    
    loadData();
    
    // Polling toutes les 30s
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard 
          title="Ensablement Moyen" 
          value={`${data.avgSoiling}%`}
          trend={data.soilingTrend}
        />
        <KPICard 
          title="Production Actuelle" 
          value={`${data.currentPower} W`}
        />
        <KPICard 
          title="Alertes Actives" 
          value={data.activeAlerts}
          variant={data.activeAlerts > 0 ? 'warning' : 'success'}
        />
        <KPICard 
          title="Devices En Ligne" 
          value={`${data.onlineDevices}/${data.totalDevices}`}
        />
      </div>

      {/* Chart */}
      <SoilingChart 
        data={data.history}
        period="7days"
      />
    </div>
  );
}
```

---

## 🔐 Sécurité et Authentification

### Flux JWT

```
1. Utilisateur → POST /api/v1/auth/login {email, password}
   ↓
2. Backend → Vérifie credentials (bcrypt)
   ↓
3. Backend → Génère JWT:
   {
     user_id: "abc123",
     email: "user@example.com",
     role: "admin",
     exp: 1737111000  // 24h
   }
   ↓
4. Backend → Signe avec SECRET_KEY → Token
   ↓
5. Frontend → Stocke token (localStorage)
   ↓
6. Requêtes suivantes → Header: Authorization: Bearer <token>
   ↓
7. Backend → Vérifie signature + expiration
   ↓
8. Si valide → Traite requête
   Si invalide → 401 Unauthorized
```

---

## 📊 Métriques de Performance

| Composant | Métrique | Cible | Réel |
|-----------|----------|-------|------|
| **API** | Latence moyenne | <100ms | ~50ms |
| **IA** | Temps inférence CPU | <3s | ~2s |
| **IA** | Temps inférence GPU | <1s | ~0.5s |
| **DB** | Écriture MongoDB | <50ms | ~20ms |
| **DB** | Lecture historique | <200ms | ~100ms |
| **Frontend** | First Paint | <2s | ~1.2s |
| **Cache** | Hit rate | >30% | ~40% |
| **ESP32** | Uptime | >99% | ~99.5% |

---

## 🎯 Prochaine Lecture

- **Backend** → [`03_backend_guide_complet.md`](./03_backend_guide_complet.md)
- **IA** → [`04_intelligence_artificielle.md`](./04_intelligence_artificielle.md)
- **Questions Jury** → [`09_qa_soutenance_jury.md`](./09_qa_soutenance_jury.md)
