// frontend/hooks/useTheme.ts
'use client';

/**
 * ============================================================
 * HOOK USETHEME - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère le thème (clair/sombre) de l'application.
 * 
 * Fonctionnalités :
 * - Détection de la préférence système au démarrage
 * - Persistance dans localStorage
 * - Application des classes CSS au document
 * - Gestion de l'hydratation (mounted)
 * - Événement personnalisé pour les composants enfants
 * 
 * Ordre de priorité pour le thème initial :
 * 1. Thème sauvegardé dans localStorage
 * 2. Préférence système (prefers-color-scheme)
 * 3. Thème clair par défaut
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';

// ============================================================
// TYPES
// ============================================================

/**
 * Type pour le thème (clair ou sombre)
 */
type Theme = 'light' | 'dark';

// ============================================================
// HOOK PRINCIPAL
// ============================================================
export function useTheme() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [theme, setTheme] = useState<Theme>('light'); // Thème actuel
  const [mounted, setMounted] = useState(false);      // Indique si le composant est monté (hydratation)

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Initialisation du thème au montage du composant
   * Détermine le thème initial selon :
   * 1. localStorage (préférence sauvegardée)
   * 2. Préférence système
   * 3. Thème clair par défaut
   */
  useEffect(() => {
    setMounted(true);
    
    // ========================================================
    // ÉTAPE 1 : Vérifier les préférences sauvegardées
    // ========================================================
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // ========================================================
    // ÉTAPE 2 : Vérifier les préférences système
    // ========================================================
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // ========================================================
    // ÉTAPE 3 : Déterminer le thème initial
    // ========================================================
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // ==========================================================
  // FONCTIONS PRIVÉES
  // ==========================================================

  /**
   * Applique le thème au document HTML
   * - Ajoute/retire la classe 'dark' sur l'élément racine
   * - Définit l'attribut colorScheme
   * 
   * @param newTheme - Le thème à appliquer ('light' ou 'dark')
   */
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');           // Ajoute la classe 'dark' pour le CSS
      root.style.colorScheme = 'dark';      // Indique au navigateur que c'est sombre
    } else {
      root.classList.remove('dark');        // Retire la classe 'dark'
      root.style.colorScheme = 'light';     // Indique au navigateur que c'est clair
    }
  };

  // ==========================================================
  // FONCTIONS PUBLIQUES
  // ==========================================================

  /**
   * Bascule entre le thème clair et sombre
   * - Met à jour l'état
   * - Sauvegarde dans localStorage
   * - Applique le thème au document
   * - Déclenche un événement personnalisé
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Déclenche un événement personnalisé pour informer les autres composants
    window.dispatchEvent(new CustomEvent('themechange', { detail: newTheme }));
  };

  /**
   * Définit un thème spécifique
   * - Met à jour l'état
   * - Sauvegarde dans localStorage
   * - Applique le thème au document
   * - Déclenche un événement personnalisé
   * 
   * @param newTheme - Le thème à appliquer ('light' ou 'dark')
   */
  const setThemeManually = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: newTheme }));
  };

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    theme,               // Thème actuel ('light' ou 'dark')
    mounted,             // Indique si le composant est monté (utile pour l'hydratation)
    toggleTheme,         // Fonction pour basculer le thème
    setTheme: setThemeManually, // Fonction pour définir un thème spécifique
    isDark: theme === 'dark',   // true si thème sombre
    isLight: theme === 'light', // true si thème clair
  };
}