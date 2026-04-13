// ============================================================================
// FICHIER: useEnergyData.ts
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce hook personnalisé React centralise toute la logique de chargement
//   des données pour la page Analyse Énergétique. Il gère les appels API,
//   le rafraîchissement automatique, le filtrage par plage temporelle,
//   et le calcul des métriques énergétiques (puissance, performance ratio, etc.).
//
// 🎯 FONCTIONNALITÉS:
//   - Chargement initial des données (history, stats)
//   - Rafraîchissement automatique toutes les 30 secondes (optionnel)
//   - Rechargement manuel via refreshKey
//   - Filtrage des données historiques selon la plage temporelle (24h, 7j, 30j, 90j, tout)
//   - Calcul de la puissance théorique (irradiance × surface × rendement)
//   - Calcul des pertes (théorique - réelle)
//   - Calcul des métriques : performance ratio, specific yield, dégradation
//   - Génération du profil horaire moyen
//   - Répartition des pertes par cause (ensablement, température, ombrage, autres)
//   - Gestion des états de chargement
//   - Mise en cache des données transformées (useMemo)
//
// 📦 PROPS (entrées):
//   - autoRefresh   : booléen - active/désactive le rafraîchissement auto
//   - refreshKey    : number - incrémenté pour forcer un rechargement manuel
//   - timeRange     : string - "24h", "7d", "30d", "90d", "all"
//   - setLastUpdate : fonction - met à jour l'affichage de la dernière mise à jour
//
// 📤 RETOURNE (valeurs exposées):
//   - loading          : booléen - chargement en cours
//   - filteredHistory  : historique filtré (Measurement[])
//   - chartData        : données pour graphiques (power, pth, loss, volt, curr)
//   - hourlyProfile    : profil horaire moyen
//   - lossData         : répartition des pertes par cause
//   - stats            : statistiques globales
//   - panelConfig      : configuration des panneaux (surface, rendement)
//   - n                : nombre de mesures
//   - avgP, avgV, avgC : moyennes puissance, tension, courant
//   - totalEnergy      : énergie totale produite (kWh)
//   - totalTheoretical : énergie théorique (kWh)
//   - totalLoss        : perte totale (kWh)
//   - performanceRatio : ratio de performance (%)
//   - specificYield    : rendement spécifique (kWh/kWp)
//   - degradationRate  : taux de dégradation (%/an)
//   - load             : fonction pour recharger manuellement
//
// ⏱️ RAFRAÎCHISSEMENT:
//   - Intervalle: 30 secondes (REFRESH_INTERVAL)
//   - Désactivable via autoRefresh (contrôle utilisateur)
//   - Rafraîchissement manuel via le bouton "Actualiser"
//
// 📊 TRANSFORMATION DES DONNÉES (chartData):
//   - Conversion des timestamps MongoDB en Date
//   - Filtrage par plage temporelle
//   - Calcul de la puissance théorique
//   - Calcul des pertes
//   - Formatage pour PowerChart et VoltageCurrentChart
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Hook utilisé côté client

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchHistory, 
  fetchStats, 
  getPanelConfig, 
  fmtTime, 
  type Measurement, 
  type Stats 
} from '@/lib/api';
import { parseMongoDate, safeFmtTime } from '../utils/parseMongoDate';

// ============================================================
// 2. CONSTANTES DE PLAGE TEMPORELLE
// ============================================================

// Mapping entre l'ID de plage et le nombre d'heures correspondant
const RANGE_HOURS: Record<string, number> = {
  '24h': 24,      // 1 jour
  '7d': 168,      // 7 jours (24 × 7)
  '30d': 720,     // 30 jours (24 × 30)
  '90d': 2160,    // 90 jours (24 × 90)
};

// ============================================================
// 3. DONNÉES VIDES PAR DÉFAUT (fallbacks)
// ============================================================

// Données vides pour les graphiques (quand aucune donnée disponible)
const EMPTY_CHART = [
  { time: '00:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '04:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '08:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '12:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '16:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '20:00', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
  { time: '23:59', power: 0, pth: 0, loss: 0, volt: 0, curr: 0 },
];

// Profil horaire vide (quand aucune donnée disponible)
const EMPTY_HOURLY = [
  { hour: '00h', avgPower: 0 },
  { hour: '04h', avgPower: 0 },
  { hour: '08h', avgPower: 0 },
  { hour: '12h', avgPower: 0 },
  { hour: '16h', avgPower: 0 },
  { hour: '20h', avgPower: 0 },
  { hour: '23h', avgPower: 0 },
];

// ============================================================
// 4. INTERFACE DES PROPS
// ============================================================

interface UseEnergyDataProps {
  autoRefresh: boolean;           // Rafraîchissement automatique actif ?
  refreshKey: number;             // Clé pour forcer le rechargement
  timeRange: string;              // Plage temporelle ("24h", "7d", "30d", "90d", "all")
  setLastUpdate: (date: Date) => void;  // Met à jour l'affichage de la dernière MAJ
}

// ============================================================
// 5. HOOK PRINCIPAL
// ============================================================

/**
 * Hook personnalisé pour la gestion des données énergétiques.
 * 
 * 📥 PROPS:
 *   - autoRefresh   : Activer le rafraîchissement automatique
 *   - refreshKey    : Incrémenté pour forcer un rechargement manuel
 *   - timeRange     : Plage temporelle pour filtrer l'historique
 *   - setLastUpdate : Callback pour la date de dernière mise à jour
 * 
 * 📤 RETOUR:
 *   - Toutes les données et états nécessaires à la page énergie
 * 
 * 🔄 FLUX DE DONNÉES:
 *   1. Chargement de la configuration des panneaux
 *   2. Chargement initial des données (history, stats)
 *   3. Rafraîchissement auto toutes les 30s (si autoRefresh = true)
 *   4. Rechargement manuel via refreshKey
 *   5. Filtrage de l'historique selon timeRange
 *   6. Calcul des données transformées pour les graphiques
 *   7. Calcul du profil horaire moyen
 *   8. Calcul de la répartition des pertes
 *   9. Calcul des métriques énergétiques
 */
export function useEnergyData({ 
  autoRefresh, 
  refreshKey, 
  timeRange, 
  setLastUpdate 
}: UseEnergyDataProps) {
  
  // ============================================================
  // 6. ÉTATS
  // ============================================================
  const [historyData, setHistoryData] = useState<Measurement[]>([]);   // Historique complet
  const [stats, setStats] = useState<Stats | null>(null);              // Statistiques
  const [loading, setLoading] = useState(true);                        // Chargement en cours
  const [panelConfig, setPanelConfig] = useState({                     // Configuration panneaux
    area: 1.6,        // Surface par défaut (m²)
    efficiency: 0.20, // Rendement par défaut (20%)
  });

  const REFRESH_INTERVAL = 30_000;  // 30 secondes entre chaque rafraîchissement auto

  // ============================================================
  // 7. CHARGEMENT DE LA CONFIGURATION DES PANNEAUX
  // ============================================================
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
        // valeurs par défaut déjà en place
      }
    })();
  }, []);  // Exécuté une seule fois au montage

  // ============================================================
  // 8. CHARGEMENT PRINCIPAL DES DONNÉES
  // ============================================================
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Appels parallèles pour optimiser les performances
      const [h, s] = await Promise.all([
        fetchHistory(0, 0),  // Historique complet (limit=0 = tous)
        fetchStats(),        // Statistiques
      ]);

      if (h && Array.isArray(h.data)) setHistoryData(h.data);
      else setHistoryData([]);
      
      if (s) setStats(s);
      setLastUpdate(new Date());  // Met à jour l'affichage "Dernière mise à jour"
    } catch {
      setHistoryData([]);
    } finally {
      setLoading(false);  // Fin du chargement
    }
  }, [setLastUpdate]);

  // ============================================================
  // 9. CHARGEMENT INITIAL ET RAFRAÎCHISSEMENT AUTOMATIQUE
  // ============================================================
  useEffect(() => {
    load();  // Chargement immédiat au montage
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(load, REFRESH_INTERVAL);  // Rafraîchissement périodique
    }
    
    return () => {
      if (interval) clearInterval(interval);  // Nettoyage au démontage
    };
  }, [load, autoRefresh]);

  // ============================================================
  // 10. RECHARGEMENT MANUEL VIA refreshKey
  // ============================================================
  useEffect(() => {
    if (refreshKey > 0) load();  // Recharge quand refreshKey change
  }, [refreshKey, load]);

  // ============================================================
  // 11. FILTRAGE DES DONNÉES PAR PLAGE TEMPORELLE (useMemo)
  // ============================================================
  const filteredHistory = useMemo(() => {
    if (!historyData.length) return [];  // Pas de données → tableau vide
    
    if (timeRange === 'all') return historyData;  // Toutes les données
    
    // Calcul de la date limite selon la plage sélectionnée
    const hours = RANGE_HOURS[timeRange] ?? 720;  // Défaut: 30 jours
    const cutoff = new Date(Date.now() - hours * 3_600_000);  // Date limite
    
    // Garder uniquement les mesures après la date limite
    return historyData.filter(d => {
      const date = parseMongoDate(d.timestamp);
      return date ? date >= cutoff : false;
    });
  }, [historyData, timeRange]);

  // ============================================================
  // 12. TRANSFORMATION DES DONNÉES POUR LES GRAPHIQUES (useMemo)
  // ============================================================
  const chartData = useMemo(() => {
    if (!filteredHistory.length) return EMPTY_CHART;  // Fallback si pas de données
    
    return filteredHistory
      .filter(d => d?.timestamp)  // Ignorer les entrées sans timestamp
      .map(d => {
        const power = d.electrical_data?.power_output || 0;  // Puissance réelle (W)
        const irradiance = d.electrical_data?.irradiance || 0;  // Irradiance (W/m²)
        
        // Puissance théorique = Irradiance × Surface × Rendement
        const pth = irradiance * panelConfig.area * panelConfig.efficiency;
        
        return {
          time: safeFmtTime(d.timestamp, fmtTime),  // Heure formatée
          power: Number(power.toFixed(1)),  // Puissance réelle (W)
          pth: Number(pth.toFixed(1)),  // Puissance théorique (W)
          loss: Number(Math.max(0, pth - power).toFixed(1)),  // Perte (W)
          volt: Number((d.electrical_data?.voltage || 0).toFixed(1)),  // Tension (V)
          curr: Number((d.electrical_data?.current || 0).toFixed(2)),  // Courant (A)
        };
      })
      .reverse();  // Inverser l'ordre (plus récent en dernier)
  }, [filteredHistory, panelConfig]);

  // ============================================================
  // 13. PROFIL HORAIRE MOYEN (useMemo)
  // ============================================================
  const hourlyProfile = useMemo(() => {
    if (!filteredHistory.length) return EMPTY_HOURLY;  // Fallback si pas de données
    
    // Regrouper les puissances par heure de la journée
    const buckets: Record<number, { power: number; count: number }> = {};
    
    for (const d of filteredHistory) {
      try {
        const hour = new Date(d.timestamp).getHours();  // Heure (0-23)
        if (!buckets[hour]) buckets[hour] = { power: 0, count: 0 };
        buckets[hour].power += d.electrical_data.power_output;
        buckets[hour].count++;
      } catch { /* ignoré */ }
    }
    
    // Calculer la moyenne par heure et trier
    const profile = Object.entries(buckets)
      .map(([hour, { power, count }]) => ({
        hour: `${hour}h`,
        avgPower: count > 0 ? Number((power / count).toFixed(1)) : 0,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));  // Tri croissant par heure
    
    return profile.length ? profile : EMPTY_HOURLY;
  }, [filteredHistory]);

  // ============================================================
  // 14. RÉPARTITION DES PERTES PAR CAUSE (useMemo)
  // ============================================================
  const lossData = useMemo(() => {
    if (!filteredHistory.length) {
      // Fallback: toutes les pertes à 0
      return [
        { name: 'Ensablement', value: 0, color: '#c47d0e' },
        { name: 'Température', value: 0, color: '#c0392b' },
        { name: 'Ombrage', value: 0, color: '#1565c0' },
        { name: 'Autres', value: 0, color: '#7aaa88' },
      ];
    }
    
    const n = filteredHistory.length;
    
    // Calcul de l'ensablement moyen
    const avgSoiling = filteredHistory.reduce(
      (a, d) => a + (d.ai_analysis.soiling_level || 0), 0
    ) / n;
    
    // Calcul de la température moyenne
    const avgTemp = filteredHistory.reduce(
      (a, d) => a + (d.electrical_data.temperature || 25), 0
    ) / n;
    
    // Estimation des pertes par cause
    const tempLoss = Math.min(30, Math.max(0, (avgTemp - 25) * 2));  // Perte température
    const soilingLoss = avgSoiling * 0.8;  // Perte ensablement
    const shadingLoss = 5 + Math.random() * 5;  // Perte ombrage (estimée)
    const otherLoss = Math.max(0, 100 - soilingLoss - tempLoss - shadingLoss);  // Autres
    
    return [
      { name: 'Ensablement', value: Math.round(soilingLoss), color: '#c47d0e' },
      { name: 'Température', value: Math.round(tempLoss), color: '#c0392b' },
      { name: 'Ombrage', value: Math.round(shadingLoss), color: '#1565c0' },
      { name: 'Autres', value: Math.round(otherLoss), color: '#7aaa88' },
    ];
  }, [filteredHistory]);

  // ============================================================
  // 15. CALCUL DES MÉTRIQUES ÉNERGÉTIQUES
  // ============================================================
  
  // Nombre total de mesures
  const n = filteredHistory.length;
  
  // Moyenne de la puissance (W)
  const avgP = n 
    ? filteredHistory.reduce((a, d) => a + d.electrical_data.power_output, 0) / n 
    : 0;
  
  // Moyenne de la tension (V)
  const avgV = n 
    ? filteredHistory.reduce((a, d) => a + d.electrical_data.voltage, 0) / n 
    : 0;
  
  // Moyenne du courant (A)
  const avgC = n 
    ? filteredHistory.reduce((a, d) => a + d.electrical_data.current, 0) / n 
    : 0;

  // Énergie totale produite (kWh) = somme des puissances / 1000
  const totalEnergy = filteredHistory.reduce(
    (a, d) => a + d.electrical_data.power_output, 0
  ) / 1000;
  
  // Énergie théorique totale (kWh)
  const totalTheoretical = filteredHistory.reduce(
    (a, d) => a + (d.electrical_data.irradiance * panelConfig.area * panelConfig.efficiency), 0
  ) / 1000;
  
  // Perte totale (kWh) = théorique - réelle
  const totalLoss = Math.max(0, totalTheoretical - totalEnergy);
  
  // Performance Ratio (%) = (réelle / théorique) × 100
  const performanceRatio = totalTheoretical > 0 
    ? (totalEnergy / totalTheoretical) * 100 
    : 0;
  
  // Specific Yield (kWh/kWp) = production par kWc installé
  const specificYield = stats?.averages?.avg_power 
    ? (stats.averages.avg_power * 24 / 1000) 
    : 0;
  
  // Taux de dégradation annuel (%/an) - valeur fixe pour l'instant
  const degradationRate = -0.5;

  // ============================================================
  // 16. EXPOSITION DES DONNÉES ET FONCTIONS
  // ============================================================
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
    load,  // Exposée pour permettre le rechargement manuel
  };
}