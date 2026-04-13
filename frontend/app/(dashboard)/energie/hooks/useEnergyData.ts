// app/(dashboard)/energie/hooks/useEnergyData.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHistory, fetchStats, getPanelConfig, fmtTime, type Measurement, type Stats } from '@/lib/api';
import { parseMongoDate, safeFmtTime } from '../utils/parseMongoDate';

const RANGE_HOURS: Record<string, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
  '90d': 2160,
};

const EMPTY_CHART = [
  { time: '00:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '04:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '08:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '12:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '16:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '20:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '23:59', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
];

const EMPTY_HOURLY = [
  { hour: '00h', avgPower: 0 },
  { hour: '04h', avgPower: 0 },
  { hour: '08h', avgPower: 0 },
  { hour: '12h', avgPower: 0 },
  { hour: '16h', avgPower: 0 },
  { hour: '20h', avgPower: 0 },
  { hour: '23h', avgPower: 0 },
];

interface UseEnergyDataProps {
  autoRefresh: boolean;
  refreshKey: number;
  timeRange: string;
  setLastUpdate: (date: Date) => void;
}

export function useEnergyData({ autoRefresh, refreshKey, timeRange, setLastUpdate }: UseEnergyDataProps) {
  const [historyData, setHistoryData] = useState<Measurement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelConfig, setPanelConfig] = useState({ area: 1.6, efficiency: 0.20 });

  const REFRESH_INTERVAL = 30_000;

  // Chargement config panneaux
  useEffect(() => {
    (async () => {
      try {
        const config = await getPanelConfig();
        if (config) {
          setPanelConfig({
            area: config.panel_area_m2 ?? 1.6,
            efficiency: config.panel_efficiency ?? 0.20,
          });
        }
      } catch {
        // valeurs par défaut
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([fetchHistory(0, 0), fetchStats()]);
      if (h && Array.isArray(h.data)) setHistoryData(h.data);
      else setHistoryData([]);
      if (s) setStats(s);
      setLastUpdate(new Date());
    } catch {
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, [setLastUpdate]);

  useEffect(() => {
    load();
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) interval = setInterval(load, REFRESH_INTERVAL);
    return () => { if (interval) clearInterval(interval); };
  }, [load, autoRefresh]);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey, load]);

  // Données filtrées
  const filteredHistory = useMemo(() => {
    if (!historyData.length) return [];
    if (timeRange === 'all') return historyData;
    const hours = RANGE_HOURS[timeRange] ?? 720;
    const cutoff = new Date(Date.now() - hours * 3_600_000);
    return historyData.filter(d => {
      const date = parseMongoDate(d.timestamp);
      return date ? date >= cutoff : false;
    });
  }, [historyData, timeRange]);

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!filteredHistory.length) return EMPTY_CHART;
    return filteredHistory
      .filter(d => d?.timestamp)
      .map(d => {
        const power = d.electrical_data?.power_output || 0;
        const irradiance = d.electrical_data?.irradiance || 0;
        const pth = irradiance * panelConfig.area * panelConfig.efficiency;
        return {
          time: safeFmtTime(d.timestamp, fmtTime),
          power: Number(power.toFixed(1)),
          pth: Number(pth.toFixed(1)),
          loss: Number(Math.max(0, pth - power).toFixed(1)),
          volt: Number((d.electrical_data?.voltage || 0).toFixed(1)),
          curr: Number((d.electrical_data?.current || 0).toFixed(2)),
        };
      })
      .reverse();
  }, [filteredHistory, panelConfig]);

  // Profil horaire
  const hourlyProfile = useMemo(() => {
    if (!filteredHistory.length) return EMPTY_HOURLY;
    const buckets: Record<number, { power: number; count: number }> = {};
    for (const d of filteredHistory) {
      try {
        const hour = new Date(d.timestamp).getHours();
        if (!buckets[hour]) buckets[hour] = { power: 0, count: 0 };
        buckets[hour].power += d.electrical_data.power_output;
        buckets[hour].count++;
      } catch { /* ignoré */ }
    }
    const profile = Object.entries(buckets)
      .map(([hour, { power, count }]) => ({
        hour: `${hour}h`,
        avgPower: count > 0 ? Number((power / count).toFixed(1)) : 0,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    return profile.length ? profile : EMPTY_HOURLY;
  }, [filteredHistory]);

  // Répartition des pertes
  const lossData = useMemo(() => {
    if (!filteredHistory.length) {
      return [
        { name: 'Ensablement', value: 0, color: '#c47d0e' },
        { name: 'Température', value: 0, color: '#c0392b' },
        { name: 'Ombrage', value: 0, color: '#1565c0' },
        { name: 'Autres', value: 0, color: '#7aaa88' },
      ];
    }
    const n = filteredHistory.length;
    const avgSoiling = filteredHistory.reduce((a, d) => a + (d.ai_analysis.soiling_level || 0), 0) / n;
    const avgTemp = filteredHistory.reduce((a, d) => a + (d.electrical_data.temperature || 25), 0) / n;
    const tempLoss = Math.min(30, Math.max(0, (avgTemp - 25) * 2));
    const soilingLoss = avgSoiling * 0.8;
    const shadingLoss = 5 + Math.random() * 5;
    const otherLoss = Math.max(0, 100 - soilingLoss - tempLoss - shadingLoss);
    return [
      { name: 'Ensablement', value: Math.round(soilingLoss), color: '#c47d0e' },
      { name: 'Température', value: Math.round(tempLoss), color: '#c0392b' },
      { name: 'Ombrage', value: Math.round(shadingLoss), color: '#1565c0' },
      { name: 'Autres', value: Math.round(otherLoss), color: '#7aaa88' },
    ];
  }, [filteredHistory]);

  // Calculs des métriques
  const n = filteredHistory.length;
  const avgP = n ? filteredHistory.reduce((a, d) => a + d.electrical_data.power_output, 0) / n : 0;
  const avgV = n ? filteredHistory.reduce((a, d) => a + d.electrical_data.voltage, 0) / n : 0;
  const avgC = n ? filteredHistory.reduce((a, d) => a + d.electrical_data.current, 0) / n : 0;

  const totalEnergy = filteredHistory.reduce((a, d) => a + d.electrical_data.power_output, 0) / 1000;
  const totalTheoretical = filteredHistory.reduce(
    (a, d) => a + (d.electrical_data.irradiance * panelConfig.area * panelConfig.efficiency), 0
  ) / 1000;
  const totalLoss = Math.max(0, totalTheoretical - totalEnergy);
  const performanceRatio = totalTheoretical > 0 ? (totalEnergy / totalTheoretical) * 100 : 0;
  const specificYield = stats?.averages?.avg_power ? (stats.averages.avg_power * 24 / 1000) : 0;
  const degradationRate = -0.5;

  return {
    loading,
    filteredHistory,
    chartData,
    hourlyProfile,
    lossData,
    stats,
    panelConfig,
    n,
    avgP,
    avgV,
    avgC,
    totalEnergy,
    totalTheoretical,
    totalLoss,
    performanceRatio,
    specificYield,
    degradationRate,
    load,
  };
}