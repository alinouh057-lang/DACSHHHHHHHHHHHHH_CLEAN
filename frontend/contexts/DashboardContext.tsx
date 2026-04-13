// frontend/contexts/DashboardContext.tsx
'use client';

/**
 * ============================================================
 * CONTEXTE DE RÉINITIALISATION DU DASHBOARD - PV MONITOR
 * ============================================================
 * Ce contexte gère la réinitialisation locale de l'affichage
 * du dashboard. Il permet de remettre à zéro les données
 * affichées sans affecter la base de données.
 * 
 * Fonctionnalités :
 * - Déclenchement d'une réinitialisation
 * - Auto-nettoyage après 1 seconde
 * - Flag de réinitialisation pour les composants
 * 
 * Utilisation typique :
 * - Bouton "Réinitialiser" dans le dashboard
 * - Reset après une action utilisateur
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface du contexte de réinitialisation du dashboard
 */
interface DashboardContextType {
  /**
   * Déclenche la réinitialisation du dashboard
   * - Passe isReset à true
   * - Auto-nettoyage après 1 seconde
   */
  resetDashboard: () => void;
  
  /**
   * Flag indiquant qu'une réinitialisation est en cours
   * Les composants peuvent réagir à ce flag
   */
  isReset: boolean;
  
  /**
   * Permet de réinitialiser manuellement le flag
   * (sans attendre le timeout)
   */
  clearResetFlag: () => void;
}

// ============================================================
// CRÉATION DU CONTEXTE
// ============================================================
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// ============================================================
// PROVIDER DU CONTEXTE
// ============================================================

/**
 * Provider qui encapsule les composants ayant besoin
 * d'accéder à la fonction de réinitialisation
 */
export function DashboardProvider({ children }: { children: ReactNode }) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [isReset, setIsReset] = useState(false); // Flag de réinitialisation

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Déclenche une réinitialisation du dashboard
   * - Active le flag isReset
   * - Auto-nettoyage après 1 seconde (timeout)
   */
  const resetDashboard = () => {
    setIsReset(true);
    // Auto-clean after 1 second
    setTimeout(() => {
      setIsReset(false);
    }, 1000);
  };

  /**
   * Réinitialise manuellement le flag
   * (utilisé par les composants pour éviter d'attendre le timeout)
   */
  const clearResetFlag = () => {
    setIsReset(false);
  };

  // ==========================================================
  // VALEUR DU CONTEXTE
  // ==========================================================
  return (
    <DashboardContext.Provider value={{
      resetDashboard,
      isReset,
      clearResetFlag,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

// ============================================================
// HOOK PERSONNALISÉ POUR UTILISER LE CONTEXTE
// ============================================================

/**
 * Hook pour accéder au contexte de réinitialisation
 * @returns Le contexte avec resetDashboard, isReset et clearResetFlag
 * @throws Error si utilisé en dehors d'un DashboardProvider
 */
export function useDashboardReset() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardReset must be used within a DashboardProvider');
  }
  return context;
}