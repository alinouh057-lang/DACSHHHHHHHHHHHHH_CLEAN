// frontend/contexts/RefreshContext.tsx
'use client';

/**
 * ============================================================
 * CONTEXTE DE RAFRAÎCHISSEMENT - PV MONITOR
 * ============================================================
 * Ce contexte gère le rafraîchissement global des données
 * de l'application. Il permet de :
 * - Contrôler le mode auto-refresh (activé/désactivé)
 * - Suivre la date de dernière mise à jour
 * - Déclencher des rafraîchissements manuels
 * - Persister la préférence utilisateur dans localStorage
 * 
 * Fonctionnalités :
 * - Toggle auto-refresh avec persistance
 * - Horodatage de la dernière mise à jour
 * - Clé de rafraîchissement pour déclencher les rechargements
 * - Rafraîchissement manuel global
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface du contexte de rafraîchissement
 */
interface RefreshContextType {
  autoRefresh: boolean;                        // Mode auto-refresh activé/désactivé
  setAutoRefresh: (value: boolean) => void;    // Change le mode auto-refresh
  lastUpdate: Date | null;                      // Date de la dernière mise à jour
  setLastUpdate: (date: Date) => void;          // Met à jour la date de dernière mise à jour
  refreshKey: number;                            // Clé qui s'incrémente pour forcer les rechargements
  triggerRefresh: () => void;                    // Déclenche un rafraîchissement manuel global
}

// ============================================================
// CRÉATION DU CONTEXTE
// ============================================================
const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

// ============================================================
// PROVIDER DU CONTEXTE
// ============================================================
export function RefreshProvider({ children }: { children: ReactNode }) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [autoRefresh, setAutoRefresh] = useState(true);     // Mode auto-refresh (défaut: true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null); // Dernière mise à jour
  const [refreshKey, setRefreshKey] = useState(0);           // Clé pour forcer les rechargements

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Charge la préférence utilisateur depuis localStorage au démarrage
   * Permet de conserver le choix de l'utilisateur entre les sessions
   */
  useEffect(() => {
    const saved = localStorage.getItem('autoRefresh');
    if (saved !== null) {
      setAutoRefresh(saved === 'true');
    }
  }, []);

  /**
   * Sauvegarde la préférence dans localStorage à chaque changement
   */
  useEffect(() => {
    localStorage.setItem('autoRefresh', String(autoRefresh));
  }, [autoRefresh]);

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Déclenche un rafraîchissement manuel global
   * - Incrémente la clé de rafraîchissement
   * - Met à jour la date de dernière mise à jour
   * 
   * Les composants qui dépendent de refreshKey se re-rendront
   * automatiquement et rechargeront leurs données
   */
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastUpdate(new Date());
  };

  // ==========================================================
  // VALEUR DU CONTEXTE
  // ==========================================================
  return (
    <RefreshContext.Provider value={{
      autoRefresh,
      setAutoRefresh,
      lastUpdate,
      setLastUpdate,
      refreshKey,
      triggerRefresh,
    }}>
      {children}
    </RefreshContext.Provider>
  );
}

// ============================================================
// HOOK PERSONNALISÉ POUR UTILISER LE CONTEXTE
// ============================================================

/**
 * Hook pour accéder au contexte de rafraîchissement
 * @returns Le contexte avec toutes les données et fonctions
 * @throws Error si utilisé en dehors d'un RefreshProvider
 */
export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}