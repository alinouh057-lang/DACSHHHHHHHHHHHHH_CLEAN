// frontend/hooks/useLanguage.ts
'use client';

/**
 * ============================================================
 * HOOK USELANGUAGE - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère la sélection et la persistance
 * de la langue de l'interface utilisateur.
 * 
 * Fonctionnalités :
 * - Changement de langue avec i18next
 * - Persistance dans localStorage
 * - Synchronisation avec l'attribut lang du document HTML
 * - Récupération de la langue actuelle
 * - Liste des langues disponibles
 * 
 * Intégration :
 * - Utilise react-i18next pour la traduction
 * - Utilise i18n/config pour la liste des langues
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, defaultLanguage } from '@/i18n/config';

// ============================================================
// HOOK PRINCIPAL
// ============================================================
export function useLanguage() {
  // ==========================================================
  // HOOKS I18NEXT
  // ==========================================================
  const { i18n } = useTranslation(); // Instance i18n pour changer la langue

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage); // Langue actuelle

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Charge la langue sauvegardée dans localStorage au démarrage
   * Vérifie que la langue existe dans la liste des langues supportées
   */
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && languages.some(l => l.code === savedLang)) {
      changeLanguage(savedLang);
    }
  }, []); // Exécuté une seule fois au montage

  // ==========================================================
  // FONCTIONS DE GESTION DE LA LANGUE
  // ==========================================================

  /**
   * Change la langue de l'application
   * - Met à jour i18n
   * - Met à jour l'état local
   * - Sauvegarde dans localStorage
   * - Met à jour l'attribut lang de la balise HTML
   * 
   * @param langCode - Code de la langue (ex: 'fr', 'en', 'es')
   */
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);        // Change la langue dans i18n
    setCurrentLanguage(langCode);          // Met à jour l'état local
    localStorage.setItem('language', langCode); // Sauvegarde dans localStorage
    document.documentElement.lang = langCode;   // Met à jour l'attribut HTML
  };

  /**
   * Retourne l'objet complet de la langue actuelle
   * @returns L'objet langue avec code, nom et drapeau
   */
  const getCurrentLanguage = () => {
    return languages.find(l => l.code === currentLanguage) || languages[0];
  };

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    currentLanguage,                      // Code de la langue actuelle
    languages,                             // Liste des langues disponibles
    changeLanguage,                        // Fonction pour changer de langue
    getCurrentLanguage,                    // Fonction pour obtenir l'objet langue
    t: i18n.t,                             // Fonction de traduction (raccourci)
  };
}