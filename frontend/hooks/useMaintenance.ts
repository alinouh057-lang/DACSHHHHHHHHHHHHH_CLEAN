// frontend/hooks/useMaintenance.ts
'use client';

/**
 * ============================================================
 * HOOK USEMAINTENANCE - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère toute la logique de maintenance :
 * - Historique des interventions (logs)
 * - Planning prévisionnel (schedule)
 * - Statistiques (nettoyages, réparations, coûts)
 * - Alertes de maintenance (retards)
 * 
 * Fonctionnalités :
 * - Chargement automatique au montage
 * - Gestion par dispositif sélectionné
 * - Calculs statistiques avancés
 * - Indicateurs de retard (overdue)
 * - ROI des nettoyages
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchMaintenanceLogs,
  addMaintenanceLog,
  fetchMaintenanceSchedule,
  type MaintenanceLog,
  type MaintenanceSchedule
} from '@/lib/api';
import { useDevice } from '@/contexts/DeviceContext';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface de retour du hook useMaintenance
 */
interface UseMaintenanceReturn {
  // ==========================================================
  // DONNÉES
  // ==========================================================
  logs: MaintenanceLog[];                    // Historique des interventions
  schedule: MaintenanceSchedule | null;       // Planning prévisionnel
  
  // ==========================================================
  // ÉTATS
  // ==========================================================
  loading: boolean;                            // Chargement global
  loadingLogs: boolean;                         // Chargement des logs
  loadingSchedule: boolean;                      // Chargement du planning
  error: string | null;                          // Message d'erreur
  
  // ==========================================================
  // ACTIONS
  // ==========================================================
  refreshLogs: () => Promise<void>;             // Recharge les logs
  refreshSchedule: () => Promise<void>;          // Recharge le planning
  refreshAll: () => Promise<void>;               // Recharge tout
  addLog: (log: Partial<MaintenanceLog>) => Promise<MaintenanceLog | null>; // Ajoute une intervention
  
  // ==========================================================
  // STATISTIQUES
  // ==========================================================
  totalCleanings: number;                        // Nombre de nettoyages
  totalRepairs: number;                          // Nombre de réparations
  totalInspections: number;                      // Nombre d'inspections
  lastCleaningDate: Date | null;                 // Date du dernier nettoyage
  daysSinceLastCleaning: number;                 // Jours depuis dernier nettoyage
  cleaningCostTotal: number;                      // Coût total des nettoyages
  energyGainedTotal: number;                      // Énergie gagnée estimée (kWh)
  cleaningROI: number;                            // Retour sur investissement des nettoyages
  
  // ==========================================================
  // ALERTES MAINTENANCE
  // ==========================================================
  cleaningOverdue: boolean;                       // Nettoyage en retard
  inspectionDue: boolean;                          // Inspection due
  nextAction: string;                              // Prochaine action recommandée
  nextActionDate: Date | null;                     // Date de la prochaine action
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook pour gérer la maintenance
 * @param deviceId - ID du dispositif (optionnel, filtre)
 * @param autoLoad - Chargement automatique au montage (défaut: true)
 * @returns Toutes les données et fonctions pour la maintenance
 */
export function useMaintenance(
  deviceId?: string,
  autoLoad: boolean = true
): UseMaintenanceReturn {
  // ==========================================================
  // CONTEXTES
  // ==========================================================
  const { selectedDevice } = useDevice(); // Dispositif sélectionné globalement
  const effectiveDeviceId = deviceId || selectedDevice || undefined; // ID effectif

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);         // Historique
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null); // Planning
  
  const [loadingLogs, setLoadingLogs] = useState(false);          // Chargement logs
  const [loadingSchedule, setLoadingSchedule] = useState(false);   // Chargement planning
  const [error, setError] = useState<string | null>(null);        // Message d'erreur

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Recharge l'historique des interventions
   */
  const refreshLogs = useCallback(async () => {
    if (!effectiveDeviceId) {
      setLogs([]);
      return;
    }
    
    setLoadingLogs(true);
    setError(null);
    
    try {
      const data = await fetchMaintenanceLogs(effectiveDeviceId, 100);
      setLogs(data);
    } catch (err) {
      setError('Erreur lors du chargement des logs de maintenance');
      console.error('❌ useMaintenance - refreshLogs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge le planning de maintenance
   */
  const refreshSchedule = useCallback(async () => {
    if (!effectiveDeviceId) {
      setSchedule(null);
      return;
    }
    
    setLoadingSchedule(true);
    setError(null);
    
    try {
      const data = await fetchMaintenanceSchedule(effectiveDeviceId);
      setSchedule(data);
    } catch (err) {
      setError('Erreur lors du chargement du planning');
      console.error('❌ useMaintenance - refreshSchedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge toutes les données (logs + planning)
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshLogs(),
      refreshSchedule()
    ]);
  }, [refreshLogs, refreshSchedule]);

  /**
   * Ajoute une nouvelle intervention
   * @param log - Données partielles de l'intervention
   * @returns L'intervention créée ou null si erreur
   */
  const addLog = useCallback(async (log: Partial<MaintenanceLog>): Promise<MaintenanceLog | null> => {
    if (!effectiveDeviceId) return null;
    
    try {
      const newLog = await addMaintenanceLog({
        ...log,
        device_id: effectiveDeviceId,
      });
      
      if (newLog) {
        setLogs(prev => [newLog, ...prev]); // Ajoute en tête de liste
        // Rafraîchir le planning car la maintenance peut l'affecter
        await refreshSchedule();
      }
      
      return newLog;
    } catch (err) {
      console.error('❌ useMaintenance - addLog:', err);
      return null;
    }
  }, [effectiveDeviceId, refreshSchedule]);

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Chargement automatique au montage (si autoLoad = true)
   */
  useEffect(() => {
    if (autoLoad && effectiveDeviceId) {
      refreshAll();
    }
  }, [autoLoad, effectiveDeviceId, refreshAll]);

  // ==========================================================
  // STATISTIQUES CALCULÉES
  // ==========================================================

  // Nombre d'interventions par type
  const totalCleanings = logs.filter(l => l.action === 'cleaning').length;
  const totalRepairs = logs.filter(l => l.action === 'repair').length;
  const totalInspections = logs.filter(l => l.action === 'inspection').length;
  
  // Dernier nettoyage
  const cleaningLogs = logs.filter(l => l.action === 'cleaning');
  const lastCleaningLog = cleaningLogs.length > 0 ? cleaningLogs[0] : null;
  const lastCleaningDate = lastCleaningLog ? new Date(lastCleaningLog.date) : null;
  
  // Jours depuis le dernier nettoyage
  const daysSinceLastCleaning = lastCleaningDate 
    ? Math.floor((new Date().getTime() - lastCleaningDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity; // Infinity si jamais nettoyé
  
  // Coût total des interventions
  const cleaningCostTotal = logs
    .filter(l => l.cost)
    .reduce((sum, l) => sum + (l.cost || 0), 0);
  
  // Énergie gagnée estimée totale
  const energyGainedTotal = logs
    .filter(l => l.energy_gained_estimate)
    .reduce((sum, l) => sum + (l.energy_gained_estimate || 0), 0);
  
  // Retour sur investissement des nettoyages (ROI)
  // Basé sur un prix de l'énergie de 0.15 DT/kWh
  const cleaningROI = cleaningCostTotal > 0 
    ? (energyGainedTotal * 0.15 / cleaningCostTotal) * 100  // 0.15 DT/kWh
    : 0;

  // ==========================================================
  // ALERTES MAINTENANCE
  // ==========================================================

  // Nettoyage en retard (date dépassée)
  const cleaningOverdue = schedule?.next_cleaning 
    ? new Date(schedule.next_cleaning) < new Date()
    : false;
  
  // Inspection en retard (date dépassée)
  const inspectionDue = schedule?.next_inspection
    ? new Date(schedule.next_inspection) < new Date()
    : false;

  /**
   * Détermine la prochaine action recommandée
   * Ordre de priorité :
   * 1. Nettoyage en retard
   * 2. Nettoyage programmé
   * 3. Inspection en retard
   * 4. Inspection programmée
   * 5. Aucune action
   */
  const nextAction = (() => {
    if (cleaningOverdue) return 'Nettoyage en retard !';
    if (schedule?.next_cleaning) return 'Nettoyage programmé';
    if (inspectionDue) return 'Inspection en retard';
    if (schedule?.next_inspection) return 'Inspection programmée';
    return 'Aucune action planifiée';
  })();

  /**
   * Date de la prochaine action
   */
  const nextActionDate = (() => {
    if (schedule?.next_cleaning) return new Date(schedule.next_cleaning);
    if (schedule?.next_inspection) return new Date(schedule.next_inspection);
    return null;
  })();

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    // Données
    logs,
    schedule,
    
    // États
    loading: loadingLogs || loadingSchedule,
    loadingLogs,
    loadingSchedule,
    error,
    
    // Actions
    refreshLogs,
    refreshSchedule,
    refreshAll,
    addLog,
    
    // Statistiques
    totalCleanings,
    totalRepairs,
    totalInspections,
    lastCleaningDate,
    daysSinceLastCleaning,
    cleaningCostTotal,
    energyGainedTotal,
    cleaningROI,
    
    // Alertes maintenance
    cleaningOverdue,
    inspectionDue,
    nextAction,
    nextActionDate,
  };
}