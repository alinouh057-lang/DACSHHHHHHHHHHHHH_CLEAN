// ============================================================================
// FICHIER: api.ts (frontend/lib/api.ts)
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce fichier est le CLIENT API central du frontend PV Monitor.
//   Il contient TOUS les appels API vers le backend, organisés par domaine
//   fonctionnel. C'est le seul fichier qui communique directement avec l'API.
//
// 🏗️ ARCHITECTURE:
//   - Configuration de base (API_BASE)
//   - Types et interfaces TypeScript (tous les modèles de données)
//   - Gestion du fuseau horaire
//   - Gestion du token JWT
//   - Fonction fetchWithAuth (ajoute automatiquement le token)
//   - Fonctions API par domaine (23 sections)
//   - Fonctions de parsing de dates
//   - Fonctions utilitaires (formatage, couleurs)
//
// 🔐 AUTHENTIFICATION:
//   - Les tokens JWT sont stockés dans localStorage
//   - fetchWithAuth ajoute automatiquement le header Authorization
//   - Renouvellement automatique si token expiré (401)
//
// 📦 ORGANISATION PAR DOMAINE:
//   6.1  Email                 - Configuration et test email
//   6.2  Données principales   - latest, history, stats
//   6.3  Analyse d'image       - upload et analyse IA
//   6.4  Stockage              - info et export
//   6.5  Configuration admin   - paramètres généraux
//   6.6  Cache IA              - stats et vidage
//   6.7  Devices               - CRUD des ESP32
//   6.8  Soiling               - historique, recommandation, prédiction
//   6.9  Alertes               - liste, acknowledgement, résolution
//   6.10 Performances          - KPIs
//   6.11 Maintenance           - logs et planning
//   6.12 Rapports              - génération et téléchargement
//   6.13 Authentification      - login, register
//   6.14 Vérification email    - code à 6 chiffres
//   6.15 Mot de passe oublié   - reset
//   6.16 Gestion utilisateurs  - CRUD (admin)
//   6.17 Logs                  - consultation
//   6.18 Configuration         - export/import
//   6.19 API Keys              - génération et révocation
//   6.20 Profil                - activity logs, preferences
//   6.21 Interventions         - maintenance détaillée
//   6.22 Suppression données   - admin (delete-all, delete-old)
//   6.23 Configuration panneaux - paramètres des panneaux solaires
//
// ============================================================================

/**
 * ============================================================
 * CLIENT API - PV MONITOR
 * ============================================================
 * Ce fichier centralise tous les appels API vers le backend.
 * Organisation par sections :
 * 1. Configuration de base
 * 2. Types et interfaces (tous regroupés)
 * 3. Gestion du fuseau horaire
 * 4. Gestion du token JWT
 * 5. Fonction fetchWithAuth
 * 6. FONCTIONS API PAR DOMAINE
 *    6.1 Email
 *    6.2 Données principales (latest, history, stats)
 *    6.3 Analyse d'image
 *    6.4 Stockage
 *    6.5 Configuration admin
 *    6.6 Cache IA
 *    6.7 Devices
 *    6.8 Soiling (ensablement)
 *    6.9 Alertes
 *    6.10 Performances
 *    6.11 Maintenance
 *    6.12 Rapports
 *    6.13 Authentification utilisateurs
 *    6.14 Vérification email
 *    6.15 Mot de passe oublié
 *    6.16 Gestion des utilisateurs
 *    6.17 Logs
 *    6.18 Configuration (export/import)
 *    6.19 API Keys
 *    6.20 Profil (activity logs, preferences)
 *    6.21 Interventions de maintenance
 * 7. Fonctions de parsing de dates
 * 8. Fonctions utilitaires (formatage, couleurs)
 * ============================================================
 */

// ============================================================
// 1. CONFIGURATION DE BASE
// ============================================================

/**
 * URL de base de l'API backend.
 * - En développement: http://localhost:8000
 * - En production: variable d'environnement NEXT_PUBLIC_API_URL
 * 
 * 💡 Pour modifier: Vercel → Settings → Environment Variables
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('🚀 API_BASE =', API_BASE);

// ============================================================
// 2. TYPES ET INTERFACES
// ============================================================

// ============================================================
// 2.1 INTERFACES EXISTANTES
// ============================================================

/**
 * Mesure d'un panneau solaire.
 * 
 * 📤 SORTIE D'API:
 *   - _id            : Identifiant MongoDB
 *   - timestamp      : Date de la mesure
 *   - device_id      : Identifiant du device ESP32
 *   - electrical_data: Données électriques (V, A, W, irradiance)
 *   - ai_analysis    : Analyse IA (ensablement, statut, confiance)
 *   - media          : Image associée (URL et base64)
 *   - panel_config   : Configuration du panneau (optionnel)
 */
export interface Measurement {
  _id: string;
  timestamp: string;
  device_id: string;
  electrical_data: {
    voltage: number;
    current: number;
    power_output: number;
    irradiance: number;
    temperature: number;
  };
  ai_analysis: {
    soiling_level: number;
    status: string;
    confidence: number;
    model_version: string;
    soiling_ratio?: number;
  };
  media: {
    image_url: string;
    image_b64?: string;
  };
  panel_config?: {
    area: number;  
    efficiency: number;  
    power_rating?: number;
  };
}

/**
 * Statistiques globales.
 * 
 * 📤 SORTIE D'API:
 *   - total        : Nombre total de mesures
 *   - distribution : Répartition par statut (Clean/Warning/Critical)
 *   - averages     : Moyennes des métriques
 *   - daily        : Données journalières (30 jours)
 */
export interface Stats {
  total: number;
  distribution: Record<string, number>;
  averages: {
    avg_soiling: number;
    avg_power: number;
    avg_voltage: number;
    avg_current: number;
    avg_irradiance: number;
  };
  daily: Array<{
    day: string;
    count: number;
    avg_soiling: number;
    avg_power: number;
  }>;
}

/**
 * Informations de stockage des images.
 * 
 * 📤 SORTIE D'API:
 *   - total_images   : Nombre d'images stockées
 *   - total_size_mb  : Espace total occupé (Mo)
 *   - oldest_image   : Date de l'image la plus ancienne
 *   - newest_image   : Date de l'image la plus récente
 *   - retention_days : Jours de conservation configurés
 */
export interface StorageInfo {
  total_images: number;
  total_size_mb: number;
  oldest_image: string | null;
  newest_image: string | null;
  retention_days: number;
}

/**
 * Recommandation de nettoyage.
 * 
 * 📤 SORTIE D'API:
 *   - action            : Texte de l'action recommandée
 *   - priority          : low/high/critical
 *   - reason            : Explication détaillée
 *   - color             : Code couleur pour affichage
 *   - estimated_loss_kwh: Perte estimée (kWh)
 *   - roi_cleaning      : ROI du nettoyage (%)
 */
export interface Recommendation {
  action: string;
  priority: string;
  reason: string;
  color: string;
  estimated_loss_kwh?: number;
  roi_cleaning?: number;
}

// ============================================================
// 2.2 INTERFACES POUR LES DISPOSITIFS
// ============================================================

/**
 * Dispositif ESP32.
 * 
 * 📤 SORTIE D'API:
 *   - device_id         : Identifiant unique
 *   - name              : Nom descriptif
 *   - zone              : Zone géographique
 *   - installation_date : Date d'installation
 *   - last_maintenance  : Dernière maintenance (optionnel)
 *   - status            : active/maintenance/offline/error
 *   - last_heartbeat    : Dernier signal de vie (optionnel)
 */
export interface Device {
  device_id: string;
  name: string;
  zone: string;
  installation_date: string;
  last_maintenance?: string;
  status: 'active' | 'maintenance' | 'offline' | 'error';
  last_heartbeat?: string;
}

// ============================================================
// 2.3 INTERFACES POUR L'ENSABLEMENT
// ============================================================

/**
 * Point d'historique d'ensablement.
 */
export interface SoilingHistoryPoint {
  device_id: string;
  timestamp: string;
  soiling_level: number;
  status: string;
  confidence: number;
  image_url?: string;
}

/**
 * Réponse d'historique d'ensablement.
 * 
 * 📤 SORTIE D'API:
 *   - device_id   : Device concerné
 *   - period_days : Période analysée (jours)
 *   - data        : Liste des points d'historique
 *   - min_soiling : Niveau minimum
 *   - max_soiling : Niveau maximum
 *   - avg_soiling : Niveau moyen
 *   - trend       : Tendance (régression linéaire)
 */
export interface SoilingHistoryResponse {
  device_id: string;
  period_days: number;
  data: SoilingHistoryPoint[];
  min_soiling: number;
  max_soiling: number;
  avg_soiling: number;
  trend: number;
}

/**
 * Recommandation de nettoyage détaillée.
 * 
 * 📤 SORTIE D'API:
 *   - device_id              : Device concerné
 *   - current_soiling        : Niveau actuel (%)
 *   - status                 : Clean/Warning/Critical
 *   - recommended_action     : Action recommandée
 *   - urgency                : low/medium/high/immediate
 *   - estimated_loss_daily   : Perte journalière (kWh)
 *   - estimated_loss_monthly : Perte mensuelle (kWh)
 *   - estimated_loss_yearly  : Perte annuelle (kWh)
 *   - cleaning_cost_estimate : Coût estimé (DT)
 *   - roi_percentage         : ROI (%)
 *   - days_until_critical    : Jours avant seuil critique
 *   - weather_forecast       : Prévisions météo
 */
export interface CleaningRecommendation {
  device_id: string;
  current_soiling: number;
  status: string;
  recommended_action: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  estimated_loss_daily: number;
  estimated_loss_monthly: number;
  estimated_loss_yearly: number;
  cleaning_cost_estimate?: number;
  roi_percentage?: number;
  days_until_critical?: number;
  weather_forecast?: any;
}

/**
 * Prédiction d'ensablement.
 * 
 * 📤 SORTIE D'API:
 *   - device_id          : Device concerné
 *   - generated_at       : Date de génération
 *   - predictions        : Liste des prédictions par jour
 *   - next_cleaning_date : Date prévue du prochain nettoyage
 *   - confidence_level   : low/medium/high
 *   - model_version      : Version du modèle
 *   - features_used      : Caractéristiques utilisées
 */
export interface SoilingPrediction {
  device_id: string;
  generated_at: string;
  predictions: Array<{
    date: string;
    predicted_soiling: number;
    confidence: number;
  }>;
  next_cleaning_date?: string;
  confidence_level: 'low' | 'medium' | 'high';
  model_version: string;
  features_used: string[];
}

// ============================================================
// 2.4 INTERFACES POUR LES ALERTES
// ============================================================

/**
 * Alerte.
 * 
 * 📤 SORTIE D'API:
 *   - id                : Identifiant unique
 *   - device_id         : Device concerné
 *   - type              : soiling/power_drop/device_offline/...
 *   - severity          : info/warning/critical
 *   - title             : Titre court
 *   - message           : Description détaillée
 *   - value             : Valeur mesurée
 *   - threshold         : Seuil déclencheur
 *   - timestamp         : Date de création
 *   - acknowledged      : Prise en compte ?
 *   - acknowledged_by   : Qui a pris en compte
 *   - acknowledged_at   : Date de prise en compte
 *   - resolved          : Résolue ?
 *   - resolved_at       : Date de résolution
 *   - resolution_notes  : Notes de résolution
 */
export interface Alert {
  id: string;
  device_id: string;
  type: 'soiling' | 'power_drop' | 'device_offline' | 'low_production' | 'high_temperature' | 'communication_error' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
}

// ============================================================
// 2.5 INTERFACES POUR LES PERFORMANCES
// ============================================================

/**
 * Métriques de performance.
 * 
 * 📤 SORTIE D'API:
 *   - device_id            : Device concerné
 *   - date                 : Date du calcul
 *   - energy_daily_kwh     : Énergie journalière
 *   - energy_monthly_kwh   : Énergie mensuelle
 *   - energy_yearly_kwh    : Énergie annuelle
 *   - performance_ratio    : Ratio de performance (0-1.2)
 *   - specific_yield       : Rendement spécifique (kWh/kWc)
 *   - capacity_factor      : Facteur de capacité (0-1)
 *   - availability         : Disponibilité (0-1)
 *   - soiling_loss_kwh     : Perte due à l'ensablement
 *   - temperature_loss_kwh : Perte due à la température
 *   - other_losses_kwh     : Autres pertes
 *   - degradation_rate     : Taux de dégradation (%/an)
 */
export interface PerformanceMetrics {
  device_id: string;
  date: string;
  energy_daily_kwh: number;
  energy_monthly_kwh: number;
  energy_yearly_kwh: number;
  performance_ratio: number;
  specific_yield: number;
  capacity_factor: number;
  availability: number;
  soiling_loss_kwh: number;
  temperature_loss_kwh: number;
  other_losses_kwh: number;
  degradation_rate?: number;
}

/**
 * Réponse KPIs de performance.
 */
export interface PerformanceKPIResponse {
  device_id: string;
  period: string;
  start_date: string;
  end_date: string;
  metrics: PerformanceMetrics;
  comparison_vs_previous?: Record<string, number>;
}

// ============================================================
// 2.6 INTERFACES POUR LA MAINTENANCE
// ============================================================

/**
 * Log de maintenance.
 */
export interface MaintenanceLog {
  id: string;
  device_id: string;
  action: 'cleaning' | 'repair' | 'inspection' | 'firmware_update' | 'calibration';
  date: string;
  description: string;
  operator: string;
  images: string[];
  cost?: number;
  energy_gained_estimate?: number;
  notes?: string;
}

/**
 * Planning de maintenance.
 */
export interface MaintenanceSchedule {
  device_id: string;
  next_cleaning?: string;
  next_inspection?: string;
  recommended_actions: string[];
  priority: 'low' | 'medium' | 'high';
}

// ============================================================
// 2.8 INTERFACES POUR L'AUTHENTIFICATION
// ============================================================

/**
 * Requête de login.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Utilisateur.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  last_login?: string;
  active: boolean;
  verified?: boolean;
}

/**
 * Réponse de login.
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  expires_in: number;
}

// ============================================================
// 2.9 INTERFACES POUR LES RAPPORTS
// ============================================================

/**
 * Requête de rapport.
 */
export interface ReportRequest {
  start_date: string;
  end_date: string;
  device_ids?: string[];
  include_soiling: boolean;
  include_performance: boolean;
  include_alerts: boolean;
  format: 'pdf' | 'excel' | 'csv' | 'json';
}

/**
 * Réponse de rapport.
 */
export interface ReportResponse {
  report_id: string;
  generated_at: string;
  download_url: string;
  size_bytes: number;
  expires_at: string;
}

// ============================================================
// 2.10 INTERFACES POUR LA VÉRIFICATION EMAIL
// ============================================================

export interface SendVerificationCodeResponse {
  status: string;
  message: string;
  email: string;
}

export interface VerifyCodeResponse {
  status: string;
  message: string;
  verified: boolean;
  temp_token?: string;
}

export interface CompleteRegistrationRequest {
  email: string;
  code: string;
  name: string;
  password: string;
}

// ============================================================
// 2.11 INTERFACES POUR LE PROFIL
// ============================================================

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  lastUsed: string;
  created: string;
  status: 'active' | 'inactive';
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  device: string;
  status: 'success' | 'warning' | 'error';
}

export interface UserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  language: string;
  timezone: string;
  twoFactorAuth: boolean;
}

// ============================================================
// 2.12 INTERFACES POUR LES INTERVENTIONS
// ============================================================

export interface Intervention {
  id: string;
  date: string;
  type: 'cleaning' | 'repair' | 'inspection' | 'other';
  device_id: string;
  technician: string;
  notes: string;
  cost: number;
  before_level: number;
  after_level: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// 2.13 INTERFACE POUR LES LOGS
// ============================================================

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  component: string;
  message: string;
}

// ============================================================
// 3. GESTION DU FUSEAU HORAIRE
// ============================================================

let userTimezone: string | null = null;

/**
 * Détecte le fuseau horaire du navigateur.
 * 
 * 📤 SORTIE: Nom IANA (ex: "Africa/Tunis", "Europe/Paris")
 * 
 * 💡 Utilisation de l'API Intl.DateTimeFormat du navigateur.
 */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('⚠️ Impossible de détecter le fuseau, utilisation de Africa/Tunis par défaut');
    return 'Africa/Tunis';
  }
}

/**
 * Initialise le fuseau horaire et l'envoie au backend.
 * 
 * 🔄 FONCTIONNEMENT:
 *   1. Détecte le fuseau du navigateur
 *   2. L'envoie au backend (POST /api/v1/user/timezone)
 *   3. Le backend stocke cette valeur pour formater les dates
 * 
 * 💡 Appelé au démarrage de l'application.
 */
export async function initTimezone(): Promise<string> {
  if (userTimezone) return userTimezone;
  
  userTimezone = detectTimezone();
  console.log('🌍 Fuseau détecté:', userTimezone);
  
  try {
    await fetch(`${API_BASE}/api/v1/user/timezone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: userTimezone })
    });
  } catch (error) {
    console.warn('⚠️ Impossible d\'envoyer le fuseau au backend');
  }
  
  return userTimezone;
}

/**
 * Retourne le fuseau horaire actuel.
 */
export function getUserTimezone(): string {
  return userTimezone || 'Africa/Tunis';
}

// ============================================================
// 4. GESTION DU TOKEN JWT
// ============================================================

let authToken: string | null = null;

/**
 * Sauvegarde le token d'authentification.
 * 
 * 📥 ENTRÉE: token JWT
 * 🔄 EFFET: Stocke en mémoire et dans localStorage
 */
export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Récupère le token d'authentification.
 * 
 * 📤 SORTIE: token JWT ou null
 * 
 * 🔄 EFFET: Nettoie les tokens invalides (undefined, null, vide)
 */
export function getAuthToken(): string | null {
  if (authToken && authToken !== 'undefined' && authToken !== 'null') return authToken;
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'undefined' && token !== 'null' && token !== '') {
      authToken = token;
      return token;
    }
    localStorage.removeItem('auth_token');
    authToken = null;
  }
  return null;
}

/**
 * Enregistre le device dashboard pour les appels API.
 * 
 * 📥 ENTRÉE: deviceId (défaut: "dashboard")
 * 📤 SORTIE: True si succès, False sinon
 * 
 * 🔄 FONCTIONNEMENT:
 *   - Le frontend s'enregistre comme device "dashboard"
 *   - Reçoit un token JWT pour les appels API
 *   - Appelé automatiquement si token absent ou expiré
 */
export async function registerDevice(deviceId: string = 'dashboard'): Promise<boolean> {
  try {
    console.log('📤 [registerDevice] Device ID:', deviceId);
    
    const deviceData = {
      device_id: deviceId,
      secret_key: undefined,
      name: 'Dashboard Frontend',
      location: 'Browser Client'
    };
    
    const response = await fetch(`${API_BASE}/api/v1/auth/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    
    console.log('📥 [registerDevice] Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.access_token);
      console.log('✅ Device enregistré avec token:', data.access_token.substring(0, 20) + '...');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ [registerDevice] Erreur:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ [registerDevice] Exception:', error);
    return false;
  }
}

// ============================================================
// 5. FONCTION FETCH AVEC TOKEN
// ============================================================

/**
 * Effectue une requête fetch avec gestion automatique du token JWT.
 * 
 * 📥 ENTRÉE:
 *   - url     : URL de la requête
 *   - options : Options fetch standard
 * 
 * 📤 SORTIE: Response
 * 
 * 🔄 FONCTIONNEMENT:
 *   1. Ajoute le header Authorization: Bearer <token>
 *   2. Ajoute le header X-Timezone: <fuseau>
 *   3. Si réponse 401 (token expiré):
 *      - Tente de ré-enregistrer le device
 *      - Réessaie une fois avec le nouveau token
 * 
 * 💡 Utilisée par TOUTES les fonctions API ci-dessous.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-Timezone': getUserTimezone(),
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      console.warn('⚠️ Token expiré, tentative de ré-enregistrement...');
      const success = await registerDevice('dashboard');
      if (success) {
        const newToken = getAuthToken();
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'X-Timezone': getUserTimezone(),
        };
        return fetch(url, { ...options, headers: newHeaders });
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur réseau détaillée:', error);
    throw error;
  }
}

// ============================================================
// 6. FONCTIONS API PAR DOMAINE
// ============================================================

// ============================================================
// 6.1 EMAIL
// ============================================================

export async function getEmailConfig(): Promise<any> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/email-config`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateEmailConfig(config: any): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/email-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function testEmail(): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/test-email`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 6.2 DONNÉES PRINCIPALES (latest, history, stats)
// ============================================================

export async function fetchLatest(deviceId?: string): Promise<Measurement | null> {
  try {
    const url = deviceId 
      ? `${API_BASE}/api/v1/latest?device_id=${deviceId}`
      : `${API_BASE}/api/v1/latest`;
    const res = await fetchWithAuth(url);
    const data = await res.json();
    return data.status === 'ok' ? data.data : null;
  } catch {
    return null;
  }
}

export async function fetchAllHistory(): Promise<Measurement[]> {
  try {
    const firstPage = await fetchHistory(0, 1);
    const total = firstPage.total;
    if (total === 0) return [];
    const allData = await fetchHistory(0, total);
    return allData.data;
  } catch (error) {
    console.error('❌ Erreur fetchAllHistory:', error);
    return [];
  }
}

export async function fetchHistory(
  skip = 0, 
  limit = 20, 
  allData = false,
  deviceId?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
  data: Measurement[];
}> {
  try {
    let url = `${API_BASE}/api/v1/history?skip=${skip}&limit=${limit}`;
    if (allData) url += `&all_data=true`;
    if (deviceId) url += `&device_id=${deviceId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    const res = await fetchWithAuth(url);
    const data = await res.json();
    return data;
  } catch {
    return {
      total: 0,
      skip: 0,
      limit: 20,
      has_more: false,
      data: []
    };
  }
}

export async function fetchStats(deviceId?: string): Promise<Stats | null> {
  try {
    const url = deviceId 
      ? `${API_BASE}/api/v1/stats?device_id=${deviceId}`
      : `${API_BASE}/api/v1/stats`;
    const res = await fetchWithAuth(url);
    const data = await res.json();
    return data.status === 'ok' ? data : null;
  } catch {
    return null;
  }
}

export async function fetchRecommendation(deviceId?: string): Promise<Recommendation | null> {
  try {
    const url = deviceId 
      ? `${API_BASE}/api/v1/recommendation?device_id=${deviceId}`
      : `${API_BASE}/api/v1/recommendation`;
    const res = await fetchWithAuth(url);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchHeartbeat(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/heartbeat`);
    const data = await res.json();
    const devices = Object.values(data.devices) as any[];
    return devices.some(d => d.online);
  } catch {
    return false;
  }
}

// ============================================================
// 6.3 ANALYSE D'IMAGE
// ============================================================

export async function analyzeImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('device_id', 'manual');
  formData.append('voltage', '0');
  formData.append('current', '0');

  try {
    console.log('📤 [analyzeImage] Début - Fichier:', file.name, file.size, 'bytes');
    
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'X-Timezone': getUserTimezone(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    console.log('📥 [analyzeImage] Status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [analyzeImage] Erreur réponse:', errorText);
      return { 
        error: true, 
        status: res.status,
        message: `Erreur ${res.status}: ${res.statusText}` 
      };
    }
    
    const data = await res.json();
    console.log('✅ [analyzeImage] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [analyzeImage] Exception:', error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// ============================================================
// 6.4 STOCKAGE
// ============================================================

export async function fetchStorageInfo(): Promise<StorageInfo | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/storage/info`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function exportData(format: 'csv' | 'json'): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/export?format=${format}`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pv-data.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ============================================================
// 6.5 CONFIGURATION ADMIN
// ============================================================

export async function getAdminConfig(): Promise<any> {
  try {
    console.log('📤 [getAdminConfig] URL:', `${API_BASE}/api/v1/admin/config`);
    
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'X-Timezone': getUserTimezone(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/api/v1/admin/config`, {
      method: 'GET',
      headers,
    });
    
    console.log('📥 [getAdminConfig] Status:', res.status);
    
    if (!res.ok) {
      console.error('❌ [getAdminConfig] Erreur:', res.status, res.statusText);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [getAdminConfig] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [getAdminConfig] Exception:', error);
    return null;
  }
}

export async function updateConfig(config: any): Promise<boolean> {
  console.log('📤 [updateConfig] Début - Config:', config);
  
  try {
    const testRes = await fetch(`${API_BASE}/api/v1/heartbeat`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (!testRes.ok) {
      console.error('❌ [updateConfig] Backend inaccessible - heartbeat failed');
      return false;
    }
    console.log('✅ [updateConfig] Backend accessible');
  } catch (error) {
    console.error('❌ [updateConfig] Backend inaccessible - pas de réponse:', error);
    return false;
  }

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 [updateConfig] Token présent');
    }
    
    const res = await fetch(`${API_BASE}/api/v1/admin/config`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    });
    
    console.log('📥 [updateConfig] Status:', res.status, res.statusText);
    
    let responseData;
    try {
      responseData = await res.text();
      console.log('📥 [updateConfig] Réponse brute:', responseData);
    } catch {
      responseData = 'Impossible de lire la réponse';
    }
    
    if (!res.ok) {
      console.error('❌ [updateConfig] Erreur HTTP:', {
        status: res.status,
        statusText: res.statusText,
        body: responseData
      });
      return false;
    }
    
    try {
      const data = JSON.parse(responseData);
      console.log('✅ [updateConfig] Succès:', data);
    } catch {
      console.log('✅ [updateConfig] Succès (réponse non-JSON)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ [updateConfig] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.6 CACHE IA
// ============================================================

export async function getCacheStats(): Promise<any> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/ai/cache-stats`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/ai/clear-cache`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 6.7 GESTION DES DEVICES
// ============================================================

export async function fetchDevices(): Promise<Device[]> {
  try {
    console.log('📤 [fetchDevices] Début');
    
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'X-Timezone': getUserTimezone(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/api/v1/devices`, {
      method: 'GET',
      headers,
    });
    
    console.log('📥 [fetchDevices] Status:', res.status);
    
    if (!res.ok) {
      console.error('❌ [fetchDevices] Erreur:', res.status);
      return [];
    }
    
    const responseText = await res.text();
    if (!responseText) {
      console.log('📥 [fetchDevices] Réponse vide');
      return [];
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ [fetchDevices] Succès,', data.length || 0, 'devices');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('❌ [fetchDevices] Erreur parsing JSON:', e);
      return [];
    }
  } catch (error) {
    console.error('❌ [fetchDevices] Exception:', error);
    return [];
  }
}

export async function fetchDevice(deviceId: string): Promise<Device | null> {
  try {
    console.log('📤 [fetchDevice] Device ID:', deviceId);
    
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'X-Timezone': getUserTimezone(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/api/v1/devices/${deviceId}`, {
      method: 'GET',
      headers,
    });
    
    console.log('📥 [fetchDevice] Status:', res.status);
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [fetchDevice] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [fetchDevice] Exception:', error);
    return null;
  }
}

export async function addDevice(device: Partial<Device>): Promise<Device | null> {
  try {
    console.log('📤 [addDevice] Données reçues:', device);
    
    if (!device.device_id || String(device.device_id).trim() === '') {
      console.error('❌ [addDevice] device_id est requis');
      return null;
    }
    
    const deviceData = {
      device_id: String(device.device_id).trim(),
      name: device.name || String(device.device_id).trim(),
      location: "ESP32 Device",
      zone: "Zone A",
      panel_type: "Monocristallin",
      panel_capacity_kw: 3.0,
      panel_area_m2: 1.6,
      panel_efficiency: 0.20,
      status: device.status || 'active',
    };
    
    let token = getAuthToken();
    if (!token) {
      const registered = await registerDevice('dashboard');
      if (!registered) return null;
      token = getAuthToken();
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/devices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(deviceData),
    });
    
    console.log('📥 [addDevice] Status:', res.status, res.statusText);
    
    if (res.status === 401) {
      const registered = await registerDevice('dashboard');
      if (registered) return addDevice(device);
      return null;
    }
    
    const responseText = await res.text();
    if (!res.ok) {
      console.error('❌ [addDevice] Erreur:', responseText);
      return null;
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ [addDevice] Succès:', data);
      return data;
    } catch (e) {
      console.error('❌ [addDevice] Erreur parsing JSON:', e);
      return null;
    }
  } catch (error) {
    console.error('❌ [addDevice] Exception:', error);
    return null;
  }
}

export async function updateDevice(deviceId: string, updates: Partial<Device>): Promise<Device | null> {
  try {
    console.log('📤 [updateDevice] Device ID:', deviceId);
    
    let token = getAuthToken();
    if (!token) {
      const registered = await registerDevice('dashboard');
      if (!registered) return null;
      token = getAuthToken();
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/devices/${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    
    console.log('📥 [updateDevice] Status:', res.status, res.statusText);
    
    if (res.status === 401) {
      const registered = await registerDevice('dashboard');
      if (registered) return updateDevice(deviceId, updates);
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [updateDevice] Erreur:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [updateDevice] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [updateDevice] Exception:', error);
    return null;
  }
}

export async function deleteDevice(deviceId: string): Promise<boolean> {
  try {
    console.log('📤 [deleteDevice] Device ID:', deviceId);
    
    let token = getAuthToken();
    if (!token) {
      const registered = await registerDevice('dashboard');
      if (!registered) return false;
      token = getAuthToken();
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/devices/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE',
      headers,
    });
    
    console.log('📥 [deleteDevice] Status:', res.status);
    
    if (res.status === 401) {
      const registered = await registerDevice('dashboard');
      if (registered) {
        const newToken = getAuthToken();
        const newHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Timezone': getUserTimezone(),
          'Authorization': `Bearer ${newToken}`
        };
        const retryRes = await fetch(`${API_BASE}/api/v1/devices/${encodeURIComponent(deviceId)}`, {
          method: 'DELETE',
          headers: newHeaders,
        });
        if (retryRes.ok) return true;
      }
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [deleteDevice] Erreur:', errorText);
      return false;
    }
    
    console.log('✅ [deleteDevice] Succès');
    return true;
  } catch (error) {
    console.error('❌ [deleteDevice] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.8 ANALYSE ENSABLEMENT
// ============================================================

export async function fetchSoilingHistory(
  deviceId?: string,
  days: number = 30
): Promise<SoilingHistoryResponse | null> {
  try {
    let url = `${API_BASE}/api/v1/soiling/history?days=${days}`;
    if (deviceId) url += `&device_id=${deviceId}`;
    const res = await fetchWithAuth(url);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchCleaningRecommendation(deviceId: string): Promise<CleaningRecommendation | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/soiling/recommendation?device_id=${deviceId}`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSoilingPrediction(
  deviceId: string,
  days: number = 7
): Promise<SoilingPrediction | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/soiling/prediction?device_id=${deviceId}&days=${days}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================
// 6.9 ALERTES
// ============================================================

export async function fetchAlerts(
  severity?: string,
  resolved?: boolean,
  deviceId?: string,
  limit: number = 50
): Promise<Alert[]> {
  try {
    let url = `${API_BASE}/api/v1/alerts?limit=${limit}`;
    if (severity) url += `&severity=${severity}`;
    if (resolved !== undefined) url += `&resolved=${resolved}`;
    if (deviceId) url += `&device_id=${deviceId}`;
    const res = await fetchWithAuth(url);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchAlert(alertId: string): Promise<Alert | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${alertId}`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function acknowledgeAlert(alertId: string, acknowledgedBy: string = 'system'): Promise<Alert | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function resolveAlert(alertId: string, notes?: string): Promise<Alert | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes: notes }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${alertId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 6.10 PERFORMANCES
// ============================================================

export async function fetchPerformanceKPIs(
  deviceId?: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<PerformanceKPIResponse | null> {
  try {
    let url = `${API_BASE}/api/v1/performance/kpis?period=${period}`;
    if (deviceId) url += `&device_id=${deviceId}`;
    const res = await fetchWithAuth(url);
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================
// 6.11 MAINTENANCE
// ============================================================

export async function fetchMaintenanceLogs(
  deviceId?: string,
  limit: number = 50
): Promise<MaintenanceLog[]> {
  try {
    let url = `${API_BASE}/api/v1/maintenance/logs?limit=${limit}`;
    if (deviceId) url += `&device_id=${deviceId}`;
    const res = await fetchWithAuth(url);
    return await res.json();
  } catch {
    return [];
  }
}

export async function addMaintenanceLog(log: Partial<MaintenanceLog>): Promise<MaintenanceLog | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/maintenance/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchMaintenanceSchedule(deviceId: string): Promise<MaintenanceSchedule | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/maintenance/schedule/${deviceId}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================
// 6.12 RAPPORTS
// ============================================================

export async function generateReport(request: ReportRequest): Promise<ReportResponse | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/export/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function downloadReport(reportId: string): Promise<void> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/export/report/${reportId}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pv-report.${res.headers.get('content-type')?.includes('pdf') ? 'pdf' : 'csv'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('❌ Erreur téléchargement rapport:', error);
  }
}

// ============================================================
// 6.13 AUTHENTIFICATION UTILISATEURS
// ============================================================

export async function login(email: string, password: string): Promise<LoginResponse | null> {
  try {
    console.log('📤 [login] URL:', `${API_BASE}/api/v1/auth/login`);
    
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('📥 [login] Status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [login] Erreur:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [login] Succès');
    setAuthToken(data.access_token);
    return data;
  } catch (error) {
    console.error('❌ [login] Exception:', error);
    return null;
  }
}

// ============================================================
// 6.14 VÉRIFICATION EMAIL
// ============================================================

export async function sendVerificationCode(email: string): Promise<SendVerificationCodeResponse | null> {
  try {
    console.log('📤 [sendVerificationCode] Email:', email);
    
    const res = await fetch(`${API_BASE}/api/v1/auth/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    console.log('📥 [sendVerificationCode] Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ [sendVerificationCode] Succès:', data);
      return data;
    } else {
      const errorText = await res.text();
      console.log('❌ [sendVerificationCode] Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [sendVerificationCode] Exception:', error);
    return null;
  }
}

export async function verifyCode(email: string, code: string): Promise<VerifyCodeResponse | null> {
  try {
    console.log('📤 [verifyCode] Email:', email);
    
    const res = await fetch(`${API_BASE}/api/v1/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    
    console.log('📥 [verifyCode] Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errorText = await res.text();
      console.log('❌ [verifyCode] Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [verifyCode] Exception:', error);
    return null;
  }
}

export async function completeRegistration(
  email: string, 
  code: string, 
  name: string, 
  password: string,
  tempToken?: string
): Promise<LoginResponse | null> {
  try {
    console.log('📤 [completeRegistration] Email:', email);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tempToken) {
      headers['Authorization'] = `Bearer ${tempToken}`;
    }
    
    const res = await fetch(`${API_BASE}/api/v1/auth/complete-registration`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, code, name, password }),
    });
    
    console.log('📥 [completeRegistration] Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      setAuthToken(data.access_token);
      return data;
    } else {
      const errorText = await res.text();
      console.log('❌ [completeRegistration] Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [completeRegistration] Exception:', error);
    return null;
  }
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// ============================================================
// 6.15 MOT DE PASSE OUBLIÉ
// ============================================================

export async function forgotPassword(email: string): Promise<{ message: string; success: boolean } | null> {
  try {
    console.log('📤 [forgotPassword] Email:', email);
    
    const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    console.log('📥 [forgotPassword] Status:', res.status);
    
    if (res.ok) {
      return await res.json();
    } else {
      const errorText = await res.text();
      console.log('❌ [forgotPassword] Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [forgotPassword] Exception:', error);
    return null;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string; success: boolean } | null> {
  try {
    console.log('📤 [resetPassword] Token:', token.substring(0, 10) + '...');
    
    const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    
    console.log('📥 [resetPassword] Status:', res.status);
    
    if (res.ok) {
      return await res.json();
    } else {
      const errorText = await res.text();
      console.log('❌ [resetPassword] Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [resetPassword] Exception:', error);
    return null;
  }
}

// ============================================================
// 6.16 GESTION DES UTILISATEURS
// ============================================================

export async function fetchUsers(): Promise<User[]> {
  try {
    console.log('📤 [fetchUsers] Début');
    
    const token = getAuthToken();
    if (!token) {
      console.error('❌ [fetchUsers] Pas de token');
      return [];
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/users`, {
      method: 'GET',
      headers,
    });
    
    console.log('📥 [fetchUsers] Status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [fetchUsers] Erreur:', errorText);
      return [];
    }
    
    const data = await res.json();
    console.log('✅ [fetchUsers] Succès,', data.length, 'utilisateurs');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [fetchUsers] Exception:', error);
    return [];
  }
}

export async function addUser(user: Partial<User>): Promise<User | null> {
  try {
    console.log('📤 [addUser] Données:', user);
    
    const token = getAuthToken();
    if (!token) {
      console.error('❌ [addUser] Pas de token');
      return null;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(user),
    });
    
    console.log('📥 [addUser] Status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [addUser] Erreur:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [addUser] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [addUser] Exception:', error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    console.log('📤 [updateUser] User ID:', userId);
    
    const token = getAuthToken();
    if (!token) {
      console.error('❌ [updateUser] Pas de token');
      return null;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    
    console.log('📥 [updateUser] Status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [updateUser] Erreur:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('✅ [updateUser] Succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [updateUser] Exception:', error);
    return null;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    console.log('📤 [deleteUser] User ID:', userId);
    
    const token = getAuthToken();
    if (!token) {
      console.error('❌ [deleteUser] Pas de token');
      return false;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers,
    });
    
    console.log('📥 [deleteUser] Status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [deleteUser] Erreur:', errorText);
      return false;
    }
    
    console.log('✅ [deleteUser] Succès');
    return true;
  } catch (error) {
    console.error('❌ [deleteUser] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.17 LOGS
// ============================================================

export async function fetchLogs(level?: string): Promise<LogEntry[]> {
  try {
    let url = `${API_BASE}/api/v1/admin/logs`;
    if (level) url += `?level=${level}`;
    const res = await fetchWithAuth(url);
    if (res.ok) return await res.json();
    return [];
  } catch {
    return [];
  }
}

// ============================================================
// 6.18 CONFIGURATION (export/import)
// ============================================================

export async function exportConfig(): Promise<void> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/config/export`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pv-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  } catch (error) {
    console.error('❌ Erreur export config:', error);
  }
}

export async function importConfig(file: File): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/config/import`, {
      method: 'POST',
      body: formData,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 6.19 API KEYS
// ============================================================

export async function fetchApiKeys(): Promise<ApiKey[]> {
  try {
    console.log('📤 [fetchApiKeys] Début');
    
    const token = getAuthToken();
    if (!token) {
      console.error('❌ [fetchApiKeys] Pas de token');
      return [];
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/api-keys`, {
      method: 'GET',
      headers,
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [fetchApiKeys] Exception:', error);
    return [];
  }
}

export async function generateApiKey(name: string): Promise<ApiKey | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/api-keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name }),
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ [generateApiKey] Exception:', error);
    return null;
  }
}

export async function deleteApiKey(keyId: number): Promise<boolean> {
  try {
    const token = getAuthToken();
    if (!token) return false;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/api-keys/${keyId}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch (error) {
    console.error('❌ [deleteApiKey] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.20 PROFIL (activity logs, preferences)
// ============================================================

export async function fetchActivityLogs(limit: number = 20): Promise<ActivityLog[]> {
  try {
    const token = getAuthToken();
    if (!token) return [];
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/activity-logs?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [fetchActivityLogs] Exception:', error);
    return [];
  }
}

export async function updatePreferences(preferences: UserPreferences): Promise<boolean> {
  try {
    const token = getAuthToken();
    if (!token) return false;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/user/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(preferences),
    });
    
    if (!res.ok) return false;
    return true;
  } catch (error) {
    console.error('❌ [updatePreferences] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.21 INTERVENTIONS DE MAINTENANCE
// ============================================================

export async function fetchInterventions(
  deviceId?: string,
  status?: string,
  limit: number = 100
): Promise<Intervention[]> {
  try {
    const token = getAuthToken();
    if (!token) return [];
    
    let url = `${API_BASE}/api/v1/maintenance/interventions?limit=${limit}`;
    if (deviceId) url += `&device_id=${deviceId}`;
    if (status) url += `&status=${status}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [fetchInterventions] Exception:', error);
    return [];
  }
}

export async function createIntervention(intervention: Partial<Intervention>): Promise<Intervention | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/maintenance/interventions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(intervention),
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ [createIntervention] Exception:', error);
    return null;
  }
}

export async function updateIntervention(
  interventionId: string,
  updates: Partial<Intervention>
): Promise<Intervention | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/maintenance/interventions/${interventionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ [updateIntervention] Exception:', error);
    return null;
  }
}

export async function deleteIntervention(interventionId: string): Promise<boolean> {
  try {
    const token = getAuthToken();
    if (!token) return false;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/maintenance/interventions/${interventionId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!res.ok) return false;
    return true;
  } catch (error) {
    console.error('❌ [deleteIntervention] Exception:', error);
    return false;
  }
}

// ============================================================
// 6.22 SUPPRESSION DES DONNÉES (ADMIN)
// ============================================================

export async function deleteAllData(collection: string): Promise<{ status: string; message: string; deleted_count: number } | null> {
  try {
    console.log(`📤 [deleteAllData] Suppression collection: ${collection}`);
    
    const token = getAuthToken();
    if (!token) return null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/delete-all-data?collection=${collection}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ [deleteAllData] Exception:', error);
    return null;
  }
}

export async function deleteOldData(days: number): Promise<{ status: string; message: string; deleted_measurements: number; deleted_interventions: number } | null> {
  try {
    console.log(`📤 [deleteOldData] Suppression données > ${days} jours`);
    
    const token = getAuthToken();
    if (!token) return null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timezone': getUserTimezone(),
      'Authorization': `Bearer ${token}`
    };
    
    const res = await fetch(`${API_BASE}/api/v1/admin/delete-old-data?days=${days}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('❌ [deleteOldData] Exception:', error);
    return null;
  }
}

// ============================================================
// 6.23 CONFIGURATION DES PANNEAUX
// ============================================================

export async function getPanelConfig(): Promise<any> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/panel-config`);
    if (res.ok) return await res.json();
    return null;
  } catch (error) {
    console.error('❌ Erreur chargement config panneaux:', error);
    return null;
  }
}

export async function updatePanelConfig(config: any): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/panel-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (error) {
    console.error('❌ Erreur sauvegarde config panneaux:', error);
    return false;
  }
}

// ============================================================
// 7. FONCTIONS DE PARSING DE DATES 
// ============================================================

/**
 * Parse une date dans différents formats (MongoDB, ISO, français)
 * 
 * 📥 ENTRÉE: dateInput (Date, string, nombre, objet MongoDB)
 * 📤 SORTIE: Date ou null
 * 
 * 🔍 FORMATS SUPPORTÉS:
 *   - Objet Date JavaScript
 *   - Chaîne ISO (2026-04-11T15:30:00Z)
 *   - Timestamp Unix (secondes ou millisecondes)
 *   - Objet MongoDB { $date: ... }
 *   - Format français (11/04/2026 15:30)
 */
function parseDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  if (typeof dateInput === 'object' && dateInput !== null) {
    if (dateInput.$date) return parseDate(dateInput.$date);
    console.warn('⚠️ Objet date inattendu:', dateInput);
    return null;
  }
  
  if (typeof dateInput === 'number') {
    if (dateInput > 10000000000) {
      return new Date(dateInput);
    } else {
      return new Date(dateInput * 1000);
    }
  }
  
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed === '') return null;
    
    let dateStr = trimmed;
    if (!dateStr.includes('+') && !dateStr.includes('Z') && !dateStr.includes('-')) {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        dateStr = dateStr + 'Z';
      }
    }
    
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    
    if (trimmed.includes('-') && trimmed.includes(':')) {
      date = new Date(trimmed.replace(' ', 'T') + 'Z');
      if (!isNaN(date.getTime())) return date;
    }
    
    const frenchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
    if (frenchMatch) {
      const [_, day, month, year, hour, minute] = frenchMatch;
      date = new Date(Date.UTC(parseInt(year), parseInt(month)-1, parseInt(day), parseInt(hour), parseInt(minute)));
      if (!isNaN(date.getTime())) return date;
    }
    
    console.warn('⚠️ Format de chaîne non reconnu:', dateInput);
    return null;
  }
  
  console.warn('⚠️ Type de date non supporté:', typeof dateInput, dateInput);
  return null;
}

// ============================================================
// 8. FONCTIONS UTILITAIRES (formatage, couleurs)
// ============================================================

/**
 * Formate une heure (HH:MM)
 */
export function fmtTime(iso: string): string {
  try {
    const date = parseDate(iso);
    if (!date) return '--:--';
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (e) {
    return '--:--';
  }
}

/**
 * Formate une date (JJ/MM/AAAA)
 */
export function fmtDate(iso: string): string {
  try {
    const date = parseDate(iso);
    if (!date) return '--/--/----';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '--/--/----';
  }
}

/**
 * Formate une date et une heure (JJ/MM/AAAA HH:MM)
 */
export function fmtDateTime(iso: string): string {
  try {
    const date = parseDate(iso);
    if (!date) return 'Date invalide';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return 'Date invalide';
  }
}

/**
 * Formate un jour (JJ/MM)
 */
export function fmtDay(dayStr: string): string {
  try {
    const date = parseDate(dayStr);
    if (!date) return '--/--';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  } catch {
    return '--/--';
  }
}

/**
 * Retourne la couleur associée à un statut d'ensablement.
 * 
 * 🎨 COULEURS:
 *   - Clean    : #1a7f4f (vert)
 *   - Warning  : #c47d0e (orange)
 *   - Critical : #c0392b (rouge)
 */
export function statusColor(status: string): string {
  switch (status) {
    case 'Clean': return '#1a7f4f';
    case 'Warning': return '#c47d0e';
    case 'Critical': return '#c0392b';
    default: return '#7aaa88';
  }
}

/**
 * Retourne la couleur de fond associée à un statut.
 */
export function statusBg(status: string): string {
  switch (status) {
    case 'Clean': return '#e4f3ea';
    case 'Warning': return '#fef3dc';
    case 'Critical': return '#fdecea';
    default: return '#edf4ed';
  }
}

/**
 * Retourne la couleur associée à une sévérité d'alerte.
 */
export function severityColor(severity: string): string {
  switch (severity) {
    case 'info': return '#1565c0';
    case 'warning': return '#c47d0e';
    case 'critical': return '#c0392b';
    default: return '#7aaa88';
  }
}

/**
 * Retourne la couleur associée à une urgence.
 */
export function urgencyColor(urgency: string): string {
  switch (urgency) {
    case 'low': return '#1a7f4f';
    case 'medium': return '#c47d0e';
    case 'high': return '#ef6c00';
    case 'immediate': return '#c0392b';
    default: return '#7aaa88';
  }
}