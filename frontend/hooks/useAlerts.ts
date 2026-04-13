// frontend/hooks/useAlerts.ts
'use client';

/**
 * ============================================================
 * HOOK USEALERTS - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère toute la logique des alertes :
 * - Chargement des alertes depuis l'API
 * - Filtrage par sévérité, statut, dispositif
 * - Actions sur les alertes (accuser, résoudre, supprimer)
 * - Statistiques (par type, par dispositif, temps de réponse)
 * - Rafraîchissement automatique périodique
 * 
 * Fonctionnalités :
 * - Chargement automatique au montage
 * - Rafraîchissement toutes les minutes
 * - Filtrage en temps réel
 * - Actions groupées (tout accuser, tout résoudre)
 * - Calculs statistiques
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================


import { useState, useEffect, useCallback } from 'react';
import { 
  fetchAlerts, 
  acknowledgeAlert, 
  resolveAlert,
  deleteAlert,
  type Alert 
} from '@/lib/api';
import { useDevice } from '@/contexts/DeviceContext';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface de retour du hook useAlerts
 */
interface UseAlertsReturn {
  // ==========================================================
  // DONNÉES FILTRÉES
  // ==========================================================
  alerts: Alert[];                       // Toutes les alertes
  activeAlerts: Alert[];                  // Alertes non résolues
  criticalAlerts: Alert[];                 // Alertes critiques
  warningAlerts: Alert[];                   // Alertes warning
  infoAlerts: Alert[];                      // Alertes info
  resolvedAlerts: Alert[];                   // Alertes résolues
  
  // ==========================================================
  // ÉTATS
  // ==========================================================
  loading: boolean;                          // État de chargement
  error: string | null;                      // Message d'erreur
  unacknowledgedCount: number;                // Nombre d'alertes non lues
  criticalCount: number;                      // Nombre d'alertes critiques
  
  // ==========================================================
  // ACTIONS
  // ==========================================================
  refreshAlerts: () => Promise<void>;        // Recharger les alertes
  markAsAcknowledged: (alertId: string) => Promise<boolean>; // Marquer comme lu
  markAsResolved: (alertId: string, notes?: string) => Promise<boolean>; // Résoudre
  removeAlert: (alertId: string) => Promise<boolean>; // Supprimer
  acknowledgeAll: () => Promise<void>;        // Tout marquer comme lu
  resolveAll: () => Promise<void>;            // Tout résoudre
  
  // ==========================================================
  // STATISTIQUES
  // ==========================================================
  alertsByType: Record<string, number>;       // Nombre d'alertes par type
  alertsByDevice: Record<string, number>;     // Nombre d'alertes par dispositif
  averageResponseTime: number;                  // Temps de réponse moyen (minutes)
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook pour gérer les alertes
 * @param deviceId - ID du dispositif (optionnel, filtre)
 * @param autoLoad - Chargement automatique au montage (défaut: true)
 * @param includeResolved - Inclure les alertes résolues (défaut: false)
 * @returns Toutes les données et fonctions pour gérer les alertes
 */
export function useAlerts(
  deviceId?: string, 
  autoLoad: boolean = true,
  includeResolved: boolean = false
): UseAlertsReturn {
  // ==========================================================
  // CONTEXTES
  // ==========================================================
  const { selectedDevice } = useDevice(); // Dispositif sélectionné globalement
  const effectiveDeviceId = deviceId || selectedDevice || undefined; // ID effectif

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [alerts, setAlerts] = useState<Alert[]>([]); // Liste des alertes
  const [loading, setLoading] = useState(false);     // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================



  // ==========================================================
  // ACTIONS SUR LES ALERTES INDIVIDUELLES
  // ==========================================================
/**
 * Recharge les alertes depuis l'API
 * Applique les filtres (dispositif, résolues)
 */
const refreshAlerts = useCallback(async () => {
  console.log(`🔍 [refreshAlerts] Début - includeResolved: ${includeResolved}`);
  setLoading(true);
  try {
    const data = await fetchAlerts(
      undefined,
      includeResolved ? true : false,
      effectiveDeviceId
    );
    console.log(`🔍 [refreshAlerts] ${data.length} alertes chargées`);
    console.log(`🔍 [refreshAlerts] Alertes résolues:`, data.filter(a => a.resolved).map(a => ({ id: a.id, resolved: a.resolved })));
    setAlerts(data);
  } catch (err) {
    setError('Erreur lors du chargement des alertes');
    console.error('❌ useAlerts - refreshAlerts:', err);
  } finally {
    setLoading(false);
  }
}, [effectiveDeviceId, includeResolved]);
  /**
   * Marque une alerte comme prise en compte (acknowledged)
   * @param alertId - ID de l'alerte
   * @returns true si succès, false sinon
   */
  const markAsAcknowledged = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const updated = await acknowledgeAlert(alertId, 'user');
      if (updated) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? updated : a
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ useAlerts - markAsAcknowledged:', err);
      return false;
    }
  }, []);

  /**
   * Marque une alerte comme résolue
   * @param alertId - ID de l'alerte
   * @param notes - Notes de résolution (optionnel)
   * @returns true si succès, false sinon
   */
const markAsResolved = useCallback(async (alertId: string, notes?: string): Promise<boolean> => {
  console.log(`🔍 [markAsResolved] Début - alertId: ${alertId}`);
  
  try {
    console.log(`🔍 [markAsResolved] Appel resolveAlert...`);
    const updated = await resolveAlert(alertId, notes);
    
    console.log(`🔍 [markAsResolved] Réponse resolveAlert:`, updated);
    
    if (updated) {
      console.log(`🔍 [markAsResolved] Succès, updated.resolved = ${updated.resolved}`);
      
      if (includeResolved) {
        setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      } else {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
      
      console.log(`🔍 [markAsResolved] Appel refreshAlerts...`);
      await refreshAlerts();
      console.log(`🔍 [markAsResolved] refreshAlerts terminé`);
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('❌ useAlerts - markAsResolved:', err);
    return false;
  }
}, [includeResolved, refreshAlerts]);
  /**
   * Supprime définitivement une alerte
   * @param alertId - ID de l'alerte
   * @returns true si succès, false sinon
   */
  const removeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const success = await deleteAlert(alertId);
      if (success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ useAlerts - removeAlert:', err);
      return false;
    }
  }, []);

  // ==========================================================
  // ACTIONS GROUPÉES
  // ==========================================================

  /**
   * Marque toutes les alertes non lues comme lues
   */
  const acknowledgeAll = useCallback(async () => {
    const unacknowledged = alerts.filter(a => !a.acknowledged && !a.resolved);
    for (const alert of unacknowledged) {
      await markAsAcknowledged(alert.id);
    }
  }, [alerts, markAsAcknowledged]);

  /**
   * Résout toutes les alertes non résolues
   */
  const resolveAll = useCallback(async () => {
    const unresolved = alerts.filter(a => !a.resolved);
    for (const alert of unresolved) {
      await markAsResolved(alert.id, 'Résolu en lot');
    }
  }, [alerts, markAsResolved]);

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Chargement automatique au montage (si autoLoad = true)
   */
  useEffect(() => {
    if (autoLoad) {
      refreshAlerts();
    }
  }, [autoLoad, refreshAlerts]);

  /**
   * Rafraîchissement périodique toutes les minutes
   */
  useEffect(() => {
    if (!autoLoad) return;
    
    const interval = setInterval(refreshAlerts, 60 * 1000); // 60 secondes
    return () => clearInterval(interval);
  }, [autoLoad, refreshAlerts]);

  // ==========================================================
  // FILTRAGE DES ALERTES
  // ==========================================================

  // Alertes actives (non résolues)
const activeAlerts = alerts.filter(a => a.resolved === false);  
  // Alertes résolues
const resolvedAlerts = alerts.filter(a => a.resolved === true);  
  // Alertes par sévérité
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved);
  const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.resolved);
  const infoAlerts = alerts.filter(a => a.severity === 'info' && !a.resolved);
  
  // Compteurs
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged && !a.resolved).length;
  const criticalCount = criticalAlerts.length;

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  /**
   * Nombre d'alertes par type
   */
  const alertsByType = alerts.reduce((acc, alert) => {
    if (!alert.resolved) {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  /**
   * Nombre d'alertes par dispositif
   */
  const alertsByDevice = alerts.reduce((acc, alert) => {
    if (!alert.resolved) {
      acc[alert.device_id] = (acc[alert.device_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  /**
   * Temps de réponse moyen (entre création et résolution)
   * Calculé en minutes
   */
  const averageResponseTime = (() => {
    const resolvedWithTimes = alerts.filter(a => a.resolved && a.resolved_at);
    if (resolvedWithTimes.length === 0) return 0;
    
    const totalMinutes = resolvedWithTimes.reduce((sum, alert) => {
      const created = new Date(alert.timestamp).getTime();
      const resolved = new Date(alert.resolved_at!).getTime();
      return sum + (resolved - created) / (1000 * 60); // Conversion en minutes
    }, 0);
    
    return Math.round(totalMinutes / resolvedWithTimes.length);
  })();

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    // Données
    alerts,
    activeAlerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    resolvedAlerts,
    
    // États
    loading,
    error,
    unacknowledgedCount,
    criticalCount,
    
    // Actions
    refreshAlerts,
    markAsAcknowledged,
    markAsResolved,
    removeAlert,
    acknowledgeAll,
    resolveAll,
    
    // Statistiques
    alertsByType,
    alertsByDevice,
    averageResponseTime,
  };
}