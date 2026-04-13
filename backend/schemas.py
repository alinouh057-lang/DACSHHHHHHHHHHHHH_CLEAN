# ============================================================================
# FICHIER: schemas.py
# ============================================================================
# 📌 RÔLE DE CE FICHIER:
#   Ce fichier centralise TOUS les modèles de données (schémas Pydantic)
#   utilisés par l'API PV Monitor pour la validation, la sérialisation
#   et la désérialisation des données JSON.
#
# 🏗️ POURQUOI PYDANTIC?
#   - Validation automatique des types
#   - Sérialisation JSON native (model_dump(), model_dump_json())
#   - Documentation automatique pour Swagger (OpenAPI)
#   - Support des champs optionnels et valeurs par défaut
#
# 📋 CATÉGORIES DE SCHÉMAS:
#   1. INGESTION        - Données entrantes des ESP32
#   2. DEVICES          - Gestion des ESP32
#   3. ENSABLEMENT      - Analyses IA et recommandations
#   4. ALERTES          - Système d'alertes
#   5. PERFORMANCES     - KPIs énergétiques
#   6. MAINTENANCE      - Logs et planning
#   7. RAPPORTS         - Génération de rapports
#   8. AUTHENTIFICATION - Login, register, tokens
#   9. ADMINISTRATION   - Configuration, utilisateurs
#   10. EMAIL           - Vérification et reset password
#
# 🔧 UTILISATION TYPIQUE:
#   from schemas import Device, Alert, SoilingAnalysis
#   device = Device(device_id="esp2", name="ESP32 Zone A", ...)
#   json_data = device.model_dump_json()
#
# ============================================================================

"""
SCHÉMAS PYDANTIC - PV MONITOR
==============================
Ce fichier centralise tous les modèles de données (schémas)
utilisés par l'API pour la validation et la sérialisation.
"""

from pydantic import BaseModel, field_validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from fastapi import UploadFile


# ============================================================================
# MODÈLES EXISTANTS (conservés)
# ============================================================================

class IngestData(BaseModel):
    """
    Modèle pour l'ingestion des données des devices ESP32.
    Reçu en multipart/form-data via POST /api/v1/ingest.
    
    📥 UTILISATION:
        Les ESP32 envoient ce formulaire avec:
        - device_id (obligatoire)
        - voltage (optionnel, ESP32-ELEC)
        - current (optionnel, ESP32-ELEC)
        - temperature (optionnel, ESP32-ELEC)
        - irradiance (optionnel, calculé par le serveur)
        - image (optionnel, ESP32-CAM)
    """
    device_id: str
    voltage: Optional[float] = 0.0
    current: Optional[float] = 0.0 
    irradiance: Optional[float] = 0.0
    temperature: Optional[float] = None
    image: Optional[UploadFile] = None


class AnalyzeData(BaseModel):
    """
    Modèle pour l'analyse manuelle d'image.
    Reçu en multipart/form-data via POST /api/v1/analyze.
    
    📥 UTILISATION:
        Upload d'une image + device_id optionnel
    """
    device_id: Optional[str] = Field(default="manual", max_length=50)
    voltage: Optional[float] = Field(default=0.0, ge=0, le=50)
    current: Optional[float] = Field(default=0.0, ge=0, le=20)


class HeartbeatData(BaseModel):
    """
    Modèle pour le heartbeat des devices.
    Indique que le device ESP32 est toujours actif.
    
    📥 UTILISATION:
        Envoyé périodiquement par les ESP32 pour signaler leur présence.
    """
    device_id: str = Field(..., min_length=1, max_length=50)
    uptime: Optional[int] = Field(None, description="Uptime en secondes")


class AdminConfig(BaseModel):
    """
    Modèle pour la configuration générale (admin).
    Utilisé par l'interface admin pour modifier les paramètres.
    
    📥 CHAMPS:
        - seuil_warning    : Seuil d'alerte Warning (%)
        - seuil_critical   : Seuil d'alerte Critical (%)
        - retention_days   : Jours de conservation des images
        - cleanup_interval : Fréquence du nettoyage (heures)
    """
    seuil_warning: float = Field(..., ge=0, le=100)
    seuil_critical: float = Field(..., ge=0, le=100)
    retention_days: int = Field(..., ge=1, le=30)
    cleanup_interval: int = Field(..., ge=1, le=168)


class EmailConfig(BaseModel):
    """
    Modèle pour la configuration email.
    Utilisé par l'interface admin pour configurer les alertes email.
    
    📥 CHAMPS:
        - email_to      : Destinataire des alertes
        - email_from    : Expéditeur (optionnel, utilise Config par défaut)
        - smtp_host     : Serveur SMTP (optionnel)
        - smtp_port     : Port SMTP (optionnel)
        - smtp_password : Mot de passe SMTP (optionnel)
    
    🔒 SÉCURITÉ:
        Le mot de passe est stocké mais caché dans les réponses API.
    """
    email_to: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Email destinataire")
    email_from: Optional[str] = Field(None, description="Email expéditeur (optionnel)")
    smtp_host: Optional[str] = Field(None, description="Serveur SMTP")
    smtp_port: Optional[int] = Field(None, ge=1, le=65535, description="Port SMTP")
    smtp_password: Optional[str] = Field(None, description="Mot de passe SMTP")
    
    @field_validator('email_to')
    def validate_email(cls, v):
        """Validation simple de l'email (format)"""
        if not v or '@' not in v:
            raise ValueError('Email invalide')
        return v


class EmailConfigResponse(BaseModel):
    """
    Réponse de configuration email (SANS le mot de passe).
    Le mot de passe est caché pour des raisons de sécurité dans l'API.
    """
    email_to: str
    email_from: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    has_password: bool = False  # True si un mot de passe est configuré


# ============================================================================
# MODÈLES POUR LES DEVICES ESP32
# ============================================================================

class DeviceStatus(str, Enum):
    """Statuts possibles pour un device ESP32"""
    ACTIVE = "active"          # Device opérationnel
    MAINTENANCE = "maintenance" # En maintenance (ne reçoit pas de données)
    OFFLINE = "offline"        # Hors ligne (pas de heartbeat)
    ERROR = "error"            # En erreur


class Device(BaseModel):
    """
    Modèle complet d'un device (lecture).
    Utilisé pour les réponses GET /api/v1/devices.
    
    📤 SORTIE:
        - device_id        : Identifiant unique
        - name             : Nom descriptif
        - installation_date: Date d'installation
        - last_maintenance : Dernière maintenance (optionnel)
        - status           : active/maintenance/offline/error
        - last_heartbeat   : Dernier signal de vie (optionnel)
    """
    device_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    installation_date: datetime
    last_maintenance: Optional[datetime] = None
    status: DeviceStatus = DeviceStatus.ACTIVE
    last_heartbeat: Optional[datetime] = None


class DeviceCreate(BaseModel):
    """
    Modèle pour la création d'un device.
    Utilisé pour POST /api/v1/devices.
    
    📥 ENTRÉE:
        - device_id : Identifiant unique (obligatoire)
        - name      : Nom descriptif (obligatoire)
    """
    device_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)


class DeviceUpdate(BaseModel):
    """
    Modèle pour la mise à jour d'un device.
    Tous les champs sont optionnels.
    
    📥 ENTRÉE:
        - name            : Nouveau nom
        - location        : Emplacement
        - zone            : Zone géographique
        - status          : Nouveau statut
        - last_maintenance: Date de dernière maintenance
    """
    name: Optional[str] = None
    location: Optional[str] = None
    zone: Optional[str] = None
    status: Optional[DeviceStatus] = None
    last_maintenance: Optional[datetime] = None


# ============================================================================
# MODÈLES POUR L'ANALYSE D'ENSABLEMENT
# ============================================================================

class SoilingStatus(str, Enum):
    """Statuts d'ensablement basés sur les seuils configurables"""
    CLEAN = "Clean"          # Panneau propre (< seuil_warning)
    WARNING = "Warning"      # Ensablement modéré (>= seuil_warning)
    CRITICAL = "Critical"    # Ensablement critique (>= seuil_critical)
    ERROR = "Error"          # Erreur d'analyse


class SoilingAnalysis(BaseModel):
    """
    Analyse complète d'une image - Retourné par l'IA après traitement.
    
    📤 SORTIE:
        - device_id               : Device concerné
        - timestamp               : Date de l'analyse
        - soiling_level           : Niveau d'ensablement (0-100%)
        - status                  : Clean/Warning/Critical
        - confidence              : Confiance de l'IA (0-1)
        - model_version           : Version du modèle IA
        - soiling_ratio           : SR = P_actuelle / P_théorique
        - cleaning_recommendation : Recommandation texte
        - estimated_loss_kwh      : Perte estimée (kWh)
        - roi_cleaning            : ROI du nettoyage (%)
        - image_url               : URL de l'image analysée
    """
    device_id: str
    timestamp: datetime
    soiling_level: float = Field(..., ge=0, le=100)
    status: SoilingStatus
    confidence: float = Field(..., ge=0, le=1)
    model_version: str
    soiling_ratio: Optional[float] = Field(None, ge=0, le=1, description="SR = P_actuelle / P_théorique")
    cleaning_recommendation: Optional[str] = None
    estimated_loss_kwh: Optional[float] = Field(None, ge=0)
    roi_cleaning: Optional[float] = Field(None, ge=0, description="ROI estimé du nettoyage en %")
    image_url: Optional[str] = None


class SoilingHistoryResponse(BaseModel):
    """
    Historique d'ensablement avec statistiques.
    
    📤 SORTIE:
        - device_id   : Device concerné
        - period_days : Période analysée (jours)
        - data        : Liste des points d'historique
        - min_soiling : Niveau minimum sur la période
        - max_soiling : Niveau maximum sur la période
        - avg_soiling : Niveau moyen sur la période
        - trend       : Tendance (régression linéaire)
    """
    device_id: str
    period_days: int
    data: List[SoilingAnalysis]
    min_soiling: float
    max_soiling: float
    avg_soiling: float
    trend: float


class CleaningRecommendation(BaseModel):
    """
    Recommandation de nettoyage avec calcul du ROI.
    
    📤 SORTIE:
        - device_id              : Device concerné
        - current_soiling        : Niveau actuel (%)
        - status                 : Clean/Warning/Critical
        - recommended_action     : Action recommandée
        - urgency                : low/high/immediate
        - estimated_loss_daily   : Perte journalière (kWh)
        - estimated_loss_monthly : Perte mensuelle (kWh)
        - estimated_loss_yearly  : Perte annuelle (kWh)
        - cleaning_cost_estimate : Coût estimé (DT)
        - roi_percentage         : ROI (%)
        - days_until_critical    : Jours avant seuil critique
        - weather_forecast       : Prévisions météo
    """
    device_id: str
    current_soiling: float
    status: SoilingStatus
    recommended_action: str
    urgency: str
    estimated_loss_daily: float
    estimated_loss_monthly: float
    estimated_loss_yearly: float
    cleaning_cost_estimate: Optional[float] = None
    roi_percentage: Optional[float] = None
    days_until_critical: Optional[int] = None
    weather_forecast: Optional[dict] = None


# ============================================================================
# MODÈLES POUR LES ALERTES
# ============================================================================

class AlertSeverity(str, Enum):
    """Niveaux de sévérité des alertes"""
    INFO = "info"          # Information simple
    WARNING = "warning"    # Alerte modérée (ensablement 30-60%)
    CRITICAL = "critical"  # Alerte critique (ensablement >60%)


class AlertType(str, Enum):
    """Types d'alertes possibles"""
    SOILING = "soiling"                 # Ensablement
    POWER_DROP = "power_drop"           # Baisse de production
    DEVICE_OFFLINE = "device_offline"   # ESP32 hors ligne
    LOW_PRODUCTION = "low_production"   # Production anormalement basse
    HIGH_TEMPERATURE = "high_temperature" # Température élevée
    COMMUNICATION_ERROR = "communication_error" # Erreur de communication
    SYSTEM = "system"                   # Alerte système générique


class Alert(BaseModel):
    """
    Modèle complet d'une alerte.
    
    📤 SORTIE:
        - id                : Identifiant unique
        - device_id         : Device concerné
        - type              : Type d'alerte
        - severity          : Niveau de sévérité
        - title             : Titre court
        - message           : Description détaillée
        - value             : Valeur mesurée (ex: 65.2)
        - threshold         : Seuil déclencheur (ex: 60)
        - timestamp         : Date de création
        - acknowledged      : Prise en compte ?
        - acknowledged_by   : Qui a pris en compte
        - acknowledged_at   : Date de prise en compte
        - resolved          : Résolue ?
        - resolved_at       : Date de résolution
        - resolution_notes  : Notes de résolution
    """
    id: str
    device_id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    value: Optional[float] = None
    threshold: Optional[float] = None
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None


class AlertCreate(BaseModel):
    """Modèle pour créer une alerte (usage interne)"""
    device_id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    value: Optional[float] = None
    threshold: Optional[float] = None


class AlertAcknowledge(BaseModel):
    """Modèle pour accuser réception d'une alerte"""
    acknowledged_by: str = "system"


class AlertResolve(BaseModel):
    """Modèle pour résoudre une alerte"""
    resolution_notes: Optional[str] = None


class AlertConfig(BaseModel):
    """Configuration des alertes par type"""
    device_id: Optional[str] = None
    alert_type: AlertType
    enabled: bool = True
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    cooldown_minutes: int = Field(30, ge=0)
    notification_channels: List[str] = ["email"]


# ============================================================================
# MODÈLES POUR LES PERFORMANCES (KPIs)
# ============================================================================

class PerformanceMetrics(BaseModel):
    """
    Métriques de performance détaillées pour un panneau solaire.
    
    📤 SORTIE:
        - device_id            : Device concerné
        - date                 : Date du calcul
        - energy_daily_kwh     : Énergie journalière (kWh)
        - energy_monthly_kwh   : Énergie mensuelle (kWh)
        - energy_yearly_kwh    : Énergie annuelle (kWh)
        - performance_ratio    : Ratio de performance (0-1.2)
        - specific_yield       : Rendement spécifique (kWh/kWc)
        - capacity_factor      : Facteur de capacité (0-1)
        - availability         : Disponibilité (0-1)
        - soiling_loss_kwh     : Perte due à l'ensablement (kWh)
        - temperature_loss_kwh : Perte due à la température (kWh)
        - other_losses_kwh     : Autres pertes (kWh)
        - degradation_rate     : Taux de dégradation (%/an)
    """
    device_id: str
    date: datetime
    energy_daily_kwh: float
    energy_monthly_kwh: float
    energy_yearly_kwh: float
    performance_ratio: float = Field(..., ge=0, le=2)
    specific_yield: float = Field(..., ge=0)
    capacity_factor: float = Field(..., ge=0, le=1)
    availability: float = Field(..., ge=0, le=1)
    soiling_loss_kwh: float = Field(0, ge=0)
    temperature_loss_kwh: float = Field(0, ge=0)
    other_losses_kwh: float = Field(0, ge=0)
    degradation_rate: Optional[float] = None


class PerformanceKPIResponse(BaseModel):
    """KPIs de performance avec période associée"""
    device_id: str
    period: str  # day, week, month, year
    start_date: datetime
    end_date: datetime
    metrics: PerformanceMetrics
    comparison_vs_previous: Optional[dict] = None


# ============================================================================
# MODÈLES POUR LA MAINTENANCE
# ============================================================================

class MaintenanceAction(str, Enum):
    """Types d'actions de maintenance"""
    CLEANING = "cleaning"              # Nettoyage des panneaux
    REPAIR = "repair"                  # Réparation technique
    INSPECTION = "inspection"          # Inspection visuelle
    FIRMWARE_UPDATE = "firmware_update" # Mise à jour firmware ESP32
    CALIBRATION = "calibration"        # Calibrage des capteurs


class MaintenanceLog(BaseModel):
    """
    Journal d'une action de maintenance.
    
    📤 SORTIE:
        - id                     : Identifiant unique
        - device_id              : Device concerné
        - action                 : Type d'action
        - date                   : Date de l'intervention
        - description            : Description détaillée
        - operator               : Technicien
        - images                 : URLs des photos (optionnel)
        - cost                   : Coût (optionnel)
        - energy_gained_estimate : Énergie récupérée estimée (kWh)
        - notes                  : Notes supplémentaires (optionnel)
    """
    id: str
    device_id: str
    action: MaintenanceAction
    date: datetime
    description: str
    operator: str
    images: List[str] = []
    cost: Optional[float] = None
    energy_gained_estimate: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceLogCreate(BaseModel):
    """Création d'une entrée de maintenance (champs requis)"""
    device_id: str
    action: MaintenanceAction
    description: str
    operator: str
    images: Optional[List[str]] = []
    cost: Optional[float] = None
    energy_gained_estimate: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceSchedule(BaseModel):
    """Calendrier de maintenance prévisionnel"""
    device_id: str
    next_cleaning: Optional[datetime] = None
    next_inspection: Optional[datetime] = None
    recommended_actions: List[str] = []
    priority: str  # low, medium, high


# ============================================================================
# MODÈLES POUR LES RAPPORTS
# ============================================================================

class ReportFormat(str, Enum):
    """Formats d'export supportés"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class ReportRequest(BaseModel):
    """Demande de génération de rapport"""
    start_date: datetime
    end_date: datetime
    device_ids: Optional[List[str]] = None
    include_soiling: bool = True
    include_performance: bool = True
    include_alerts: bool = True
    format: ReportFormat = ReportFormat.PDF


class ReportResponse(BaseModel):
    """Réponse après génération de rapport"""
    report_id: str
    generated_at: datetime
    download_url: str
    size_bytes: int
    expires_at: datetime  # Expire après 7 jours


# ============================================================================
# MODÈLES POUR LES PRÉDICTIONS D'ENSABLEMENT
# ============================================================================

class SoilingPrediction(BaseModel):
    """
    Prédiction d'évolution de l'ensablement.
    
    📤 SORTIE:
        - device_id         : Device concerné
        - generated_at      : Date de génération
        - predictions       : Liste des prédictions par jour
        - next_cleaning_date: Date prévue du prochain nettoyage
        - confidence_level  : low/medium/high
        - model_version     : Version du modèle (LinearTrend_v1)
        - features_used     : Caractéristiques utilisées
    """
    device_id: str
    generated_at: datetime
    predictions: List[dict]  # [{date, predicted_soiling, confidence}]
    next_cleaning_date: Optional[datetime] = None
    confidence_level: str  # low, medium, high
    model_version: str
    features_used: List[str]


# ============================================================================
# MODÈLES POUR L'ADMINISTRATION
# ============================================================================

class UserRole(str, Enum):
    """Rôles utilisateur"""
    ADMIN = "admin"    # Tous droits
    USER = "user"      # Utilisateur standard
    VIEWER = "viewer"  # Lecture seule


class User(BaseModel):
    """Modèle utilisateur complet"""
    id: str
    username: str
    email: str
    role: UserRole
    created_at: datetime
    last_login: Optional[datetime] = None
    active: bool = True


class UserCreate(BaseModel):
    """
    Création d'utilisateur (admin ou registration).
    Supporte à la fois la création par admin et l'auto-inscription.
    """
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8)
    name: Optional[str] = None
    role: str = "viewer"


class UserUpdate(BaseModel):
    """Mise à jour d'utilisateur (admin)"""
    email: Optional[str] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None


class SystemLog(BaseModel):
    """Log système pour audit"""
    id: str
    timestamp: datetime
    level: str  # INFO, WARNING, ERROR
    component: str
    message: str
    details: Optional[dict] = None
    user: Optional[str] = None
    ip: Optional[str] = None


# ============================================================================
# CLASSES POUR L'AUTHENTIFICATION JWT
# ============================================================================

class TokenResponse(BaseModel):
    """
    Réponse avec token JWT.
    Supporte à la fois l'auth device (avec device_id) et l'auth user (sans).
    """
    access_token: str
    token_type: str = "bearer"
    device_id: Optional[str] = None
    role: Optional[UserRole] = None
    expires_in: int = 30 * 24 * 3600  # 30 jours par défaut


class DeviceRegister(BaseModel):
    """Enregistrement d'un device ESP32"""
    device_id: str = Field(..., min_length=1, max_length=50, description="Identifiant du dispositif")
    secret_key: Optional[str] = Field(None, description="Clé secrète pour les devices (optionnel)")
    name: Optional[str] = Field(None, description="Nom du dispositif")
    location: Optional[str] = Field(None, description="Emplacement")
    
    class Config:
        extra = "allow"  # Permet des champs supplémentaires (latitude, longitude, etc.)


class TokenData(BaseModel):
    """Contenu du token JWT (payload décodé)"""
    device_id: str
    role: Optional[UserRole] = None
    exp: Optional[datetime] = None


class LoginRequest(BaseModel):
    """Requête de login utilisateur"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Réponse de login avec token et infos utilisateur"""
    access_token: str
    token_type: str = "bearer"
    user: User
    expires_in: int


class UserResponse(BaseModel):
    """Réponse utilisateur pour les endpoints auth (GET /me)"""
    id: str
    email: str
    name: str
    role: str
    created_at: datetime
    active: bool
    verified: bool = False


# ============================================================================
# MODÈLES POUR LA CONFIGURATION DES PANNEAUX
# ============================================================================

class PanelConfig(BaseModel):
    """
    Configuration des panneaux solaires.
    Utilisé pour les calculs de puissance théorique et de performance.
    """
    panel_type: str = Field(default="monocristallin", description="Type de panneau")
    panel_capacity_kw: float = Field(default=3.0, ge=0, le=10, description="Puissance crête (kWc)")
    panel_area_m2: float = Field(default=1.6, ge=0, le=5, description="Surface du panneau (m²)")
    panel_efficiency: float = Field(default=0.20, ge=0, le=0.30, description="Rendement (%)")
    tilt_angle: int = Field(default=30, ge=0, le=90, description="Inclinaison (degrés)")
    azimuth: int = Field(default=180, ge=0, le=360, description="Orientation (degrés)")
    degradation_rate: float = Field(default=0.5, ge=0, le=2, description="Dégradation annuelle (%)")


class PanelConfigResponse(BaseModel):
    """Réponse de configuration des panneaux (sans les valeurs par défaut)"""
    panel_type: str
    panel_capacity_kw: float
    panel_area_m2: float
    panel_efficiency: float
    tilt_angle: int
    azimuth: int
    degradation_rate: float


# ============================================================================
# MODÈLES POUR LA VÉRIFICATION EMAIL (déplacés de auth_routes.py)
# ============================================================================

class EmailRequest(BaseModel):
    """Demande d'envoi de code de vérification"""
    email: str


class VerifyCodeRequest(BaseModel):
    """Vérification du code à 6 chiffres"""
    email: str
    code: str


class CompleteRegistrationRequest(BaseModel):
    """Finalisation de l'inscription (étape 3)"""
    email: str
    code: str
    password: str
    name: str


class ForgotPasswordRequest(BaseModel):
    """Demande de réinitialisation de mot de passe"""
    email: str


class ResetPasswordRequest(BaseModel):
    """Réinitialisation du mot de passe avec token"""
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    """Réponse après réinitialisation de mot de passe"""
    message: str
    success: bool