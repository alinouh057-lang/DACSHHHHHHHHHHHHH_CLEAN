// hooks/useMaintenanceData.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchHistory, fetchRecommendation, fetchInterventions, type Measurement, type Recommendation, type Intervention } from '@/lib/api';

export function useMaintenanceData(autoRefresh: boolean, refreshKey: number, setLastUpdate: (date: Date) => void) {
  const [historyData, setHistoryData] = useState<Measurement[]>([]);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loadingInterventions, setLoadingInterventions] = useState(false);
  const REFRESH_INTERVAL = 30_000;

  const loadInterventions = useCallback(async (filterStatus?: string) => {
    setLoadingInterventions(true);
    try {
      const data = await fetchInterventions(
        undefined,
        filterStatus === 'all' ? undefined : filterStatus
      );
      setInterventions(data);
    } catch (error) {
      console.error('❌ Erreur chargement interventions:', error);
    } finally {
      setLoadingInterventions(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([
        fetchHistory(0, 100),
        fetchRecommendation()
      ]);
      
      if (h && Array.isArray(h.data)) {
        setHistoryData(h.data);
      } else {
        setHistoryData([]);
      }
      
      if (r) setRec(r);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erreur chargement maintenance:', error);
      setHistoryData([]);
    }
  }, [setLastUpdate]);

  useEffect(() => { 
    load();
    loadInterventions();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        load();
        loadInterventions();
      }, REFRESH_INTERVAL);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [load, loadInterventions, autoRefresh]);

  useEffect(() => {
    if (refreshKey > 0) {
      load();
      loadInterventions();
    }
  }, [refreshKey, load, loadInterventions]);

  const refreshInterventions = useCallback((filterStatus?: string) => {
    loadInterventions(filterStatus);
  }, [loadInterventions]);

  return {
    historyData,
    rec,
    interventions,
    loadingInterventions,
    refreshInterventions,
  };
}