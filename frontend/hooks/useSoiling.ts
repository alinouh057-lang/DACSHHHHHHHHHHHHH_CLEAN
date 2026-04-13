// frontend/hooks/useSoiling.ts
'use client';

/**
 * ============================================================
 * HOOK USESOILING - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère toutes les données liées à
 * l'ensablement des panneaux solaires.
 * 
 * Fonctionnalités :
 * - Historique des mesures d'ensablement
 * - Recommandations de nettoyage
 * - Prédictions futures
 * - Calculs de tendance
 * - Alertes de nettoyage
 * 
 * Données gérées :
 * - Historique (30 derniers jours par défaut)
 * - Recommandation actuelle (avec urgence)
 * - Prédiction (7 jours par défaut)
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchSoilingHistory, 
  fetchCleaningRecommendation,
  fetchSoilingPrediction,
  type SoilingHistoryResponse,
  type CleaningRecommendation,
  type SoilingPrediction
} from '@/lib/api';
import { useDevice } from '@/contexts/DeviceContext';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface de retour du hook useSoiling
 */
interface UseSoilingReturn {
  // ==========================================================
  // DONNÉES
  // ==========================================================
  history: SoilingHistoryResponse | null;        // Historique des mesures
  recommendation: CleaningRecommendation | null; // Recommandation de nettoyage
  prediction: SoilingPrediction | null;          // Prédictions futures
  
  // ==========================================================
  // ÉTATS
  // ==========================================================
  loading: boolean;                                // Chargement global
  loadingHistory: boolean;                         // Chargement historique
  loadingRecommendation: boolean;                  // Chargement recommandation
  loadingPrediction: boolean;                      // Chargement prédiction
  error: string | null;                            // Message d'erreur
  
  // ==========================================================
  // ACTIONS
  // ==========================================================
  refreshHistory: (days?: number) => Promise<void>;      // Recharge l'historique
  refreshRecommendation: () => Promise<void>;            // Recharge la recommandation
  refreshPrediction: (days?: number) => Promise<void>;   // Recharge la prédiction
  refreshAll: () => Promise<void>;                        // Recharge tout
  
  // ==========================================================
  // STATISTIQUES CALCULÉES
  // ==========================================================
  currentSoiling: number;                          // Niveau actuel d'ensablement
  currentStatus: string;                            // Statut actuel
  trend: 'up' | 'down' | 'stable';                  // Tendance
  needsCleaning: boolean;                            // Nettoyage nécessaire ?
  cleaningUrgency: 'low' | 'medium' | 'high' | 'immediate' | null; // Urgence
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook pour gérer les données d'ensablement
 * @param deviceId - ID du dispositif (optionnel, filtre)
 * @param autoLoad - Chargement automatique au montage (défaut: true)
 * @returns Toutes les données et fonctions pour l'ensablement
 */
export function useSoiling(deviceId?: string, autoLoad: boolean = true): UseSoilingReturn {
  // ==========================================================
  // CONTEXTES
  // ==========================================================
  const { selectedDevice } = useDevice(); // Dispositif sélectionné globalement
  const effectiveDeviceId = deviceId || selectedDevice || undefined; // ID effectif

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [history, setHistory] = useState<SoilingHistoryResponse | null>(null); // Historique
  const [recommendation, setRecommendation] = useState<CleaningRecommendation | null>(null); // Recommandation
  const [prediction, setPrediction] = useState<SoilingPrediction | null>(null); // Prédiction
  
  const [loadingHistory, setLoadingHistory] = useState(false); // Chargement historique
  const [loadingRecommendation, setLoadingRecommendation] = useState(false); // Chargement recommandation
  const [loadingPrediction, setLoadingPrediction] = useState(false); // Chargement prédiction
  const [error, setError] = useState<string | null>(null); // Message d'erreur

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Recharge l'historique d'ensablement
   * @param days - Nombre de jours à charger (défaut: 30)
   */
  const refreshHistory = useCallback(async (days: number = 30) => {
    if (!effectiveDeviceId) {
      setHistory(null);
      return;
    }
    
    setLoadingHistory(true);
    setError(null);
    
    try {
      const data = await fetchSoilingHistory(effectiveDeviceId, days);
      setHistory(data);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error('❌ useSoiling - refreshHistory:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge la recommandation de nettoyage
   */
  const refreshRecommendation = useCallback(async () => {
    if (!effectiveDeviceId) {
      setRecommendation(null);
      return;
    }
    
    setLoadingRecommendation(true);
    setError(null);
    
    try {
      const data = await fetchCleaningRecommendation(effectiveDeviceId);
      setRecommendation(data);
    } catch (err) {
      setError('Erreur lors du chargement de la recommandation');
      console.error('❌ useSoiling - refreshRecommendation:', err);
    } finally {
      setLoadingRecommendation(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge la prédiction d'ensablement
   * @param days - Nombre de jours de prédiction (défaut: 7)
   */
  const refreshPrediction = useCallback(async (days: number = 7) => {
    if (!effectiveDeviceId) {
      setPrediction(null);
      return;
    }
    
    setLoadingPrediction(true);
    setError(null);
    
    try {
      const data = await fetchSoilingPrediction(effectiveDeviceId, days);
      setPrediction(data);
    } catch (err) {
      setError('Erreur lors du chargement de la prédiction');
      console.error('❌ useSoiling - refreshPrediction:', err);
    } finally {
      setLoadingPrediction(false);
    }
  }, [effectiveDeviceId]);

  /**
   * Recharge toutes les données (historique + recommandation + prédiction)
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshHistory(),
      refreshRecommendation(),
      refreshPrediction()
    ]);
  }, [refreshHistory, refreshRecommendation, refreshPrediction]);

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Chargement automatique au montage (si autoLoad = true)
   * Se relance quand le dispositif change
   */
  useEffect(() => {
    if (autoLoad && effectiveDeviceId) {
      refreshAll();
    }
  }, [autoLoad, effectiveDeviceId, refreshAll]);

  // ==========================================================
  // STATISTIQUES CALCULÉES
  // ==========================================================

  /**
   * Niveau d'ensablement actuel
   * Priorité : recommandation > dernier point historique
   */
  const currentSoiling = recommendation?.current_soiling ?? 
                         history?.data[history.data.length - 1]?.soiling_level ?? 
                         0;
  
  /**
   * Statut actuel
   * Priorité : recommandation > dernier point historique
   */
  const currentStatus = recommendation?.status ?? 
                        history?.data[history.data.length - 1]?.status ?? 
                        'Unknown';
  
  /**
   * Tendance de l'ensablement
   * - up : tendance > +0.1%/jour
   * - down : tendance < -0.1%/jour
   * - stable : entre -0.1 et +0.1
   */
  const trend = history?.trend 
    ? history.trend > 0.1 ? 'up' 
      : history.trend < -0.1 ? 'down' 
      : 'stable'
    : 'stable';
  
  /**
   * Indique si un nettoyage est nécessaire
   * Basé sur l'urgence de la recommandation ou le seuil de 30%
   */
  const needsCleaning = recommendation?.urgency === 'high' || 
                        recommendation?.urgency === 'immediate' ||
                        currentSoiling > 30;
  
  /**
   * Niveau d'urgence du nettoyage
   * null si pas de recommandation
   */
  const cleaningUrgency = recommendation?.urgency ?? null;

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    // Données
    history,
    recommendation,
    prediction,
    
    // États
    loading: loadingHistory || loadingRecommendation || loadingPrediction,
    loadingHistory,
    loadingRecommendation,
    loadingPrediction,
    error,
    
    // Actions
    refreshHistory,
    refreshRecommendation,
    refreshPrediction,
    refreshAll,
    
    // Statistiques calculées
    currentSoiling,
    currentStatus,
    trend,
    needsCleaning,
    cleaningUrgency,
  };
}