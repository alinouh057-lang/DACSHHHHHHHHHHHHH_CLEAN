// hooks/useHistoryData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchHistory, fetchStats, type Measurement, type Stats } from '@/lib/api';

export function useHistoryData(autoRefresh: boolean, refreshKey: number, setLastUpdate: (date: Date) => void) {
  const [historyData, setHistoryData] = useState<{
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
    data: Measurement[];
  }>({
    total: 0,
    skip: 0,
    limit: 20,
    has_more: false,
    data: []
  });
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const currentSkipRef = useRef(0);
  const REFRESH_INTERVAL = 30_000;

  const load = useCallback(async (skip: number) => {
    try {
      const [h, s] = await Promise.all([
        fetchHistory(skip, 100),
        fetchStats()
      ]);
      
      if (h && h.data) {
        setHistoryData(h);
        currentSkipRef.current = skip;
      } else {
        setHistoryData({
          total: 0,
          skip: skip,
          limit: 20,
          has_more: false,
          data: []
        });
        currentSkipRef.current = skip;
      }
      
      if (s) setStats(s);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
      setHistoryData({
        total: 0,
        skip: skip,
        limit: 20,
        has_more: false,
        data: []
      });
      currentSkipRef.current = skip;
    } finally {
      setLoading(false);
    }
  }, [setLastUpdate]);

  useEffect(() => { 
    load(0);
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        load(currentSkipRef.current);
      }, REFRESH_INTERVAL);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [load, autoRefresh]);

  useEffect(() => {
    if (refreshKey > 0) {
      load(currentSkipRef.current);
    }
  }, [refreshKey, load]);

  const loadPage = useCallback((skip: number) => {
    load(skip);
  }, [load]);

  return {
    historyData,
    stats,
    loading,
    loadPage,
    currentSkip: currentSkipRef.current,
  };
}