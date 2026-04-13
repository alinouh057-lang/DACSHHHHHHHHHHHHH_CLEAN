// frontend/hooks/usePerformance.ts
'use client';

/**
 * ============================================================
 * HOOK USEPERFORMANCE - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère les indicateurs de performance
 * énergétique de l'installation photovoltaïque.
 * 
 * Fonctionnalités :
 * - Chargement des KPIs de performance
 * - Chargement des statistiques globales
 * - Gestion de la période (jour, semaine, mois, année)
 * - Calculs dérivés (ratios, pourcentages)
 * - Comparaisons avec période précédente
 * - Données formatées pour les graphiques
 * 
 * Métriques calculées :
 * - Performance Ratio (PR) avec statut (excellent, bon, moyen, mauvais)
 * - Specific Yield (kWh/kWp)
 * - Capacity Factor
 * - Pertes par type (ensablement, température, autres)
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchPerformanceKPIs,
  fetchStats,
  type PerformanceKPIResponse,
  type Stats
} from '@/lib/api';
import { useDevice } from '@/contexts/DeviceContext';

// ============================================================
// TYPES
// ============================================================

/**
 * Type pour les périodes disponibles
 */
export type PeriodType = 'day' | 'week' | 'month' | 'year';

/**
 * Interface de retour du hook usePerformance
 */
interface UsePerformanceReturn {
  // ==========================================================
  // DONNÉES
  // ==========================================================
  kpis: PerformanceKPIResponse | null;     // KPIs détaillés
  stats: Stats | null;                       // Statistiques globales
  
  // ==========================================================
  // ÉTATS
  // ==========================================================
  loading: boolean;                           // Chargement global
  loadingKPIs: boolean;                        // Chargement des KPIs
  loadingStats: boolean;                        // Chargement des stats
  error: string | null;                         // Message d'erreur
  period: PeriodType;                            // Période actuelle
  
  // ==========================================================
  // ACTIONS
  // ==========================================================
  setPeriod: (period: PeriodType) => void;      // Change la période
  refreshKPIs: () => Promise<void>;              // Recharge les KPIs
  refreshStats: () => Promise<void>;             // Recharge les stats
  refreshAll: () => Promise<void>;                // Recharge tout
  
  // ==========================================================
  // VALEURS CALCULÉES
  // ==========================================================
  performanceRatio: number;                       // Performance Ratio (PR)
  performanceRatioStatus: 'excellent' | 'good' | 'average' | 'poor'; // Statut PR
  specificYield: number;                          // Rendement spécifique (kWh/kWp)
  capacityFactor: number;                          // Facteur de charge
  availability: number;                            // Disponibilité
  totalLosses: number;                             // Pertes totales (kWh)
  soilingLossPercentage: number;                    // % pertes par ensablement
  temperatureLossPercentage: number;                 // % pertes par température
  otherLossesPercentage: number;                      // % autres pertes
  
  // ==========================================================
  // COMPARAISONS
  // ==========================================================
  vsPreviousPeriod: {
    energy: number;      // Évolution production (%)
    pr: number;          // Évolution PR (%)
    soiling: number;     // Évolution ensablement (%)
  } | null;
  
  // ==========================================================
  // GRAPHIQUES
  // ==========================================================
  chartData: Array<{
    name: string;        // Nom de la perte
    value: number;       // Pourcentage
    fill: string;        // Couleur
  }>;
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook pour gérer les performances énergétiques
 * @param deviceId - ID du dispositif (optionnel, filtre)
 * @param initialPeriod - Période initiale (défaut: 'month')
 * @param autoLoad - Chargement automatique au montage (défaut: true)
 * @returns Toutes les données et fonctions pour les performances
 */
export function usePerformance(
  deviceId?: string,
  initialPeriod: PeriodType = 'month',
  autoLoad: boolean = true
): UsePerformanceReturn {
  // ==========================================================
  // CONTEXTES
  // ==========================================================
  const { selectedDevice } = useDevice(); // Dispositif sélectionné globalement
  const effectiveDeviceId = deviceId || selectedDevice || undefined; // ID effectif

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [kpis, setKpis] = useState<PerformanceKPIResponse | null>(null); // KPIs
  const [stats, setStats] = useState<Stats | null>(null);                // Statistiques
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);       // Période
  
  const [loadingKPIs, setLoadingKPIs] = useState(false); // Chargement KPIs
  const [loadingStats, setLoadingStats] = useState(false); // Chargement stats
  const [error, setError] = useState<string | null>(null); // Message d'erreur

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Recharge les KPIs de performance
   * Nécessite un dispositif sélectionné
   */
  const refreshKPIs = useCallback(async () => {
    if (!effectiveDeviceId) {
      setKpis(null);
      return;
    }
    
    setLoadingKPIs(true);
    setError(null);
    
    try {
      const data = await fetchPerformanceKPIs(effectiveDeviceId, period);
      setKpis(data);
    } catch (err) {
      setError('Erreur lors du chargement des KPIs');
      console.error('❌ usePerformance - refreshKPIs:', err);
    } finally {
      setLoadingKPIs(false);
    }
  }, [effectiveDeviceId, period]);

  /**
   * Recharge les statistiques globales
   */
  const refreshStats = useCallback(async () => {
    setLoadingStats(true);
    
    try {
      const data = await fetchStats(effectiveDeviceId);
      setStats(data);
    } catch (err) {
      console.error('❌ usePerformance - refreshStats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge toutes les données (KPIs + stats)
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshKPIs(),
      refreshStats()
    ]);
  }, [refreshKPIs, refreshStats]);

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Chargement automatique au montage (si autoLoad = true)
   * Se relance quand le dispositif ou la période change
   */
  useEffect(() => {
    if (autoLoad && effectiveDeviceId) {
      refreshAll();
    }
  }, [autoLoad, effectiveDeviceId, period, refreshAll]);

  /**
   * Rafraîchissement périodique toutes les 5 minutes
   */
  useEffect(() => {
    if (!autoLoad || !effectiveDeviceId) return;
    
    const interval = setInterval(refreshAll, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoLoad, effectiveDeviceId, refreshAll]);

  // ==========================================================
  // VALEURS CALCULÉES
  // ==========================================================

  // Performance Ratio (PR)
  const performanceRatio = kpis?.metrics.performance_ratio ?? 0;
  
  /**
   * Statut du Performance Ratio basé sur des seuils :
   * - excellent : ≥ 85%
   * - good : ≥ 75%
   * - average : ≥ 60%
   * - poor : < 60%
   */
  const performanceRatioStatus = (() => {
    if (performanceRatio >= 0.85) return 'excellent';
    if (performanceRatio >= 0.75) return 'good';
    if (performanceRatio >= 0.6) return 'average';
    return 'poor';
  })();

  // Autres métriques
  const specificYield = kpis?.metrics.specific_yield ?? 0;       // kWh/kWp
  const capacityFactor = kpis?.metrics.capacity_factor ?? 0;     // Facteur de charge
  const availability = kpis?.metrics.availability ?? 0;          // Disponibilité
  
  // Calcul des pertes totales
  const totalLosses = (kpis?.metrics.soiling_loss_kwh ?? 0) + 
                      (kpis?.metrics.temperature_loss_kwh ?? 0) + 
                      (kpis?.metrics.other_losses_kwh ?? 0);
  
  // Pourcentage des pertes par ensablement
  const soilingLossPercentage = totalLosses > 0 
    ? ((kpis?.metrics.soiling_loss_kwh ?? 0) / totalLosses) * 100 
    : 0;
  
  // Pourcentage des pertes par température
  const temperatureLossPercentage = totalLosses > 0 
    ? ((kpis?.metrics.temperature_loss_kwh ?? 0) / totalLosses) * 100 
    : 0;
  
  // Pourcentage des autres pertes
  const otherLossesPercentage = totalLosses > 0 
    ? ((kpis?.metrics.other_losses_kwh ?? 0) / totalLosses) * 100 
    : 0;

  // ==========================================================
  // DONNÉES POUR LES GRAPHIQUES
  // ==========================================================

  /**
   * Données formatées pour le graphique en camembert
   * Ne garde que les types de pertes avec une valeur > 0
   */
  const chartData = [
    { 
      name: 'Ensablement', 
      value: soilingLossPercentage, 
      fill: '#c47d0e' // Couleur ambre
    },
    { 
      name: 'Température', 
      value: temperatureLossPercentage, 
      fill: '#1565c0' // Couleur bleue
    },
    { 
      name: 'Autres', 
      value: otherLossesPercentage, 
      fill: '#7aaa88' // Couleur verte
    },
  ].filter(item => item.value > 0); // Filtre les valeurs nulles

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    // Données
    kpis,
    stats,
    
    // États
    loading: loadingKPIs || loadingStats,
    loadingKPIs,
    loadingStats,
    error,
    period,
    
    // Actions
    setPeriod,
    refreshKPIs,
    refreshStats,
    refreshAll,
    
    // Valeurs calculées
    performanceRatio,
    performanceRatioStatus,
    specificYield,
    capacityFactor,
    availability,
    totalLosses,
    soilingLossPercentage,
    temperatureLossPercentage,
    otherLossesPercentage,
    
    // Comparaisons
    vsPreviousPeriod: kpis?.comparison_vs_previous ? {
      energy: kpis.comparison_vs_previous.energy || 0,
      pr: kpis.comparison_vs_previous.pr || 0,
      soiling: kpis.comparison_vs_previous.soiling || 0,
    } : null,
    
    // Graphiques
    chartData,
  };
}