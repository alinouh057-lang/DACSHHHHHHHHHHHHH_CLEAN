// hooks/useSoilingData.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchLatest, fetchHistory, fetchStats, getPanelConfig, type Measurement, type Stats } from '@/lib/api';

export function useSoilingData(autoRefresh: boolean, refreshKey: number, setLastUpdate: (date: Date) => void) {
  const [latest, setLatest] = useState<Measurement | null>(null);
  const [historyData, setHistoryData] = useState<Measurement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelConfig, setPanelConfig] = useState({ area: 1.6, efficiency: 0.20 });
  const REFRESH_INTERVAL = 60_000;

  const load = useCallback(async () => {
    try {
      const [l, h, s] = await Promise.all([
        fetchLatest(),
        fetchHistory(0, 200),
        fetchStats()
      ]);
      
      setLatest(l);
      if (h && Array.isArray(h.data)) setHistoryData(h.data);
      if (s) setStats(s);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [setLastUpdate]);

  const loadPanelConfig = useCallback(async () => {
    try {
      const config = await getPanelConfig();
      if (config) {
        setPanelConfig({
          area: config.panel_area_m2 ?? 1.6,
          efficiency: config.panel_efficiency ?? 0.20
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement config panneaux:', error);
    }
  }, []);

  useEffect(() => { 
    load();
    loadPanelConfig();
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) interval = setInterval(load, REFRESH_INTERVAL);
    return () => { if (interval) clearInterval(interval); };
  }, [load, loadPanelConfig, autoRefresh]);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey, load]);

  return {
    latest,
    historyData,
    stats,
    loading,
    panelConfig,
    refresh: load,
  };
}