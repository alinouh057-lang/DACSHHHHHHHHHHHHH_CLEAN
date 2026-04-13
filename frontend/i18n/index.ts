// frontend/i18n/index.ts
'use client';

/**
 * ============================================================
 * CONFIGURATION I18N - PV MONITOR
 * ============================================================
 * Ce fichier initialise la bibliothèque i18next pour la
 * gestion des langues dans l'application.
 * 
 * Il configure :
 * - Les ressources de traduction (fichiers JSON)
 * - Le détecteur de langue (localStorage, navigateur)
 * - La langue de fallback (français)
 * - Les espaces de noms (namespaces)
 * 
 * Dépendances :
 * - i18next : Bibliothèque principale
 * - react-i18next : Intégration React
 * - i18next-browser-languagedetector : Détection automatique
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ============================================================
// IMPORT DES TRADUCTIONS
// ============================================================

/**
 * Import des fichiers de traduction JSON
 * Chaque fichier contient les traductions pour une langue
 * 
 * Structure des fichiers :
 * - fr/common.json : Traductions françaises
 * - en/common.json : Traductions anglaises
 * - es/common.json : Traductions espagnoles
 */
import frTranslations from '../public/locales/fr/common.json';
import enTranslations from '../public/locales/en/common.json';
import esTranslations from '../public/locales/es/common.json';

// ============================================================
// RESSOURCES DE TRADUCTION
// ============================================================

/**
 * Objet regroupant toutes les ressources de traduction
 * Structure : { [langue]: { [namespace]: traductions } }
 * 
 * Actuellement, seul le namespace 'common' est utilisé,
 * mais la structure permet d'ajouter d'autres namespaces
 * facilement (dashboard, energy, etc.)
 */
const resources = {
  fr: { common: frTranslations },
  en: { common: enTranslations },
  es: { common: esTranslations },
};

// ============================================================
// INITIALISATION D'I18NEXT
// ============================================================

/**
 * Configuration et initialisation d'i18next
 * 
 * Ordre des plugins :
 * 1. LanguageDetector : Détecte la langue préférée de l'utilisateur
 * 2. initReactI18next : Intègre i18next avec React
 */
i18n
  .use(LanguageDetector)        // Détection automatique de la langue
  .use(initReactI18next)        // Intégration React
  .init({
    // ========================================================
    // RESSOURCES
    // ========================================================
    resources,                   // Fichiers de traduction
    
    // ========================================================
    // LANGUE DE FALLBACK
    // ========================================================
    fallbackLng: 'fr',           // Langue utilisée si la langue détectée n'est pas disponible
    
    // ========================================================
    // ESPACES DE NOMS (NAMESPACES)
    // ========================================================
    defaultNS: 'common',         // Namespace par défaut
    ns: ['common'],              // Liste des namespaces chargés
    
    // ========================================================
    // INTERPOLATION
    // ========================================================
    interpolation: {
      escapeValue: false,        // React protège déjà contre XSS
    },
    
    // ========================================================
    // DÉTECTION DE LA LANGUE
    // ========================================================
    detection: {
      order: ['localStorage', 'navigator'], // Ordre de détection
      caches: ['localStorage'],              // Où sauvegarder la préférence
    },
  });

// ============================================================
// EXPORT
// ============================================================
export default i18n;