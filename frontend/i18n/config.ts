// frontend/i18n/config.ts

/**
 * ============================================================
 * CONFIGURATION INTERNATIONALE - PV MONITOR
 * ============================================================
 * Ce fichier définit la configuration de base pour
 * l'internationalisation (i18n) de l'application.
 * 
 * Il exporte :
 * - La liste des langues supportées
 * - La langue par défaut
 * - Les espaces de noms (namespaces) pour les traductions
 * 
 * Les langues disponibles :
 * - 🇫🇷 Français (fr) - par défaut
 * - 🇬🇧 Anglais (en)
 * - 🇪🇸 Espagnol (es)
 * ============================================================
 */

// ============================================================
// LISTE DES LANGUES SUPPORTÉES
// ============================================================

/**
 * Tableau des langues disponibles dans l'application
 * Chaque langue est définie par :
 * - code : Identifiant utilisé dans i18n (fr, en, es)
 * - name : Nom affiché dans le sélecteur de langue
 * - flag : Drapeau pour l'affichage (emoji)
 */
export const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

// ============================================================
// LANGUE PAR DÉFAUT
// ============================================================

/**
 * Langue utilisée par défaut au premier lancement
 * Correspond au code 'fr' défini dans languages
 */
export const defaultLanguage = 'fr';

// ============================================================
// ESPACES DE NOMS (NAMESPACES)
// ============================================================

/**
 * Liste des espaces de noms utilisés pour organiser les traductions
 * Chaque namespace correspond à un fichier de traduction séparé
 * 
 * Organisation :
 * - common : Textes génériques (boutons, labels, etc.)
 * - dashboard : Page d'accueil
 * - energy : Page énergie
 * - history : Page historique
 * - maintenance : Page maintenance
 * - soiling : Page ensablement
 * - alerts : Page alertes
 * - reports : Page rapports
 * - admin : Page administration
 * - profile : Page profil
 * 
 * Cette organisation permet de :
 * - Charger les traductions à la demande (lazy loading)
 * - Éviter les conflits de noms
 * - Faciliter la maintenance
 */
export const namespaces = [
  'common',
  'dashboard',
  'energy',
  'history',
  'maintenance',
  'soiling',
  'alerts',
  'reports',
  'admin',
  'profile',
];