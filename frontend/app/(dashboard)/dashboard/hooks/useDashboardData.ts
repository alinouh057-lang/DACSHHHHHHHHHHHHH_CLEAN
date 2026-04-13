// ============================================================================
// FICHIER: useDashboardData.ts
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce hook personnalisé React centralise toute la logique de chargement
//   des données pour le dashboard principal. Il gère les appels API,
//   le rafraîchissement automatique, le filtrage par plage temporelle,
//   et le calcul des données pour les graphiques.
//
// 🎯 FONCTIONNALITÉS:
//   - Chargement initial des données (latest, history, stats, heartbeat)
//   - Rafraîchissement automatique toutes les 30 secondes (optionnel)
//   - Rechargement manuel via refreshKey
//   - Filtrage des données historiques selon la plage temporelle (24h, 7j, 30j, tout)
//   - Calcul de la puissance théorique (irradiance × surface × rendement)
//   - Calcul des pertes (théorique - réelle)
//   - Gestion des états de chargement et de connexion
//   - Mise en cache des données transformées (useMemo)
//
// 📦 PROPS (entrées):
//   - autoRefresh   : booléen - active/désactive le rafraîchissement auto
//   - refreshKey    : number - incrémenté pour forcer un rechargement manuel
//   - timeRange     : string - "24h", "7d", "30d", "all"
//   - setLastUpdate : fonction - met à jour l'affichage de la dernière mise à jour
//
// 📤 RETOURNE (valeurs exposées):
//   - latest       : dernière mesure (Measurement)
//   - historyData  : historique complet (Measurement[])
//   - stats        : statistiques globales (Stats)
//   - uploadResult : résultat de l'analyse d'image manuelle
//   - setUploadResult : fonction pour mettre à jour le résultat
//   - loading      : booléen - chargement en cours
//   - connected    : booléen - backend accessible ?
//   - esp32Online  : booléen - au moins un ESP32 en ligne ?
//   - panelConfig  : configuration des panneaux (surface, rendement)
//   - chartData    : données transformées pour les graphiques
//   - load         : fonction pour recharger manuellement
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
//   - Formatage pour PowerChart et SoilingChart
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Hook utilisé côté client

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchLatest,
  fetchHistory,
  fetchStats,
  fetchHeartbeat,
  getPanelConfig,
  fmtTime,
  type Measurement,
  type Stats,
} from '@/lib/api';
import { parseMongoDate } from '../utils/parseMongoDate';

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface UseDashboardDataProps {
  autoRefresh: boolean;           // Rafraîchissement automatique actif ?
  refreshKey: number;             // Clé pour forcer le rechargement
  timeRange: string;              // Plage temporelle ("24h", "7d", "30d", "all")
  setLastUpdate: (date: Date) => void;  // Met à jour l'affichage de la dernière MAJ
}

// ============================================================
// 3. HOOK PRINCIPAL
// ============================================================

/**
 * Hook personnalisé pour la gestion des données du dashboard.
 * 
 * 📥 PROPS:
 *   - autoRefresh   : Activer le rafraîchissement automatique
 *   - refreshKey    : Incrémenté pour forcer un rechargement manuel
 *   - timeRange     : Plage temporelle pour filtrer l'historique
 *   - setLastUpdate : Callback pour la date de dernière mise à jour
 * 
 * 📤 RETOUR:
 *   - Toutes les données et états nécessaires au dashboard
 * 
 * 🔄 FLUX DE DONNÉES:
 *   1. Chargement initial au montage
 *   2. Rafraîchissement auto toutes les 30s (si autoRefresh = true)
 *   3. Rechargement manuel via refreshKey (bouton "Actualiser")
 *   4. Filtrage de l'historique selon timeRange
 *   5. Calcul des données transformées pour les graphiques (chartData)
 */
export function useDashboardData({
  autoRefresh,
  refreshKey,
  timeRange,
  setLastUpdate,
}: UseDashboardDataProps) {
  // ============================================================
  // 4. ÉTATS
  // ============================================================
  const [latest, setLatest] = useState<Measurement | null>(null);      // Dernière mesure
  const [historyData, setHistoryData] = useState<Measurement[]>([]);   // Historique complet
  const [stats, setStats] = useState<Stats | null>(null);              // Statistiques
  const [uploadResult, setUploadResult] = useState<any>(null);         // Résultat upload image
  const [loading, setLoading] = useState(true);                        // Chargement en cours
  const [connected, setConnected] = useState(true);                    // Backend accessible ?
  const [esp32Online, setEsp32Online] = useState(false);               // ESP32 en ligne ?
  const [panelConfig, setPanelConfig] = useState({                     // Configuration panneaux
    area: 1.6,        // Surface par défaut (m²)
    efficiency: 0.20, // Rendement par défaut (20%)
  });

  // ============================================================
  // 5. CONSTANTES
  // ============================================================
  const REFRESH_INTERVAL = 30_000;  // 30 secondes entre chaque rafraîchissement auto

  // ============================================================
  // 6. CHARGEMENT DE LA CONFIGURATION DES PANNEAUX
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
  // 7. CHARGEMENT PRINCIPAL DES DONNÉES
  // ============================================================
  const load = useCallback(async () => {
    try {
      // Appels parallèles pour optimiser les performances
      const [l, h, s, hb] = await Promise.all([
        fetchLatest(),          // Dernière mesure
        fetchHistory(0, 0),     // Historique complet (limit=0 = tous)
        fetchStats(),           // Statistiques
        fetchHeartbeat(),       // Statut des ESP32
      ]);

      setLatest(l);

      // Vérifier que history a bien une propriété data
      if (h && Array.isArray(h.data)) {
        setHistoryData(h.data);
      } else {
        setHistoryData([]);
      }

      if (s) setStats(s);
      setEsp32Online(hb);
      setConnected(true);
      setLastUpdate(new Date());  // Met à jour l'affichage "Dernière mise à jour"
    } catch {
      setConnected(false);        // Backend inaccessible
      setHistoryData([]);
    } finally {
      setLoading(false);          // Fin du chargement initial
    }
  }, [setLastUpdate]);

  // ============================================================
  // 8. CHARGEMENT INITIAL ET RAFRAÎCHISSEMENT AUTOMATIQUE
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
  // 9. RECHARGEMENT MANUEL VIA refreshKey
  // ============================================================
  useEffect(() => {
    if (refreshKey > 0) load();  // Recharge quand refreshKey change
  }, [refreshKey, load]);

  // ============================================================
  // 10. TRANSFORMATION DES DONNÉES POUR LES GRAPHIQUES (useMemo)
  // ============================================================
  const chartData = useMemo(() => {
    // Pas de données → tableau vide
    if (!historyData || historyData.length === 0) return [];

    // ========================================================
    // 10.1 FILTRAGE PAR PLAGE TEMPORELLE
    // ========================================================
    let filtered = historyData;

    if (timeRange !== 'all') {
      // Correspondance entre l'ID de plage et le nombre d'heures
      const hoursMap: Record<string, number> = { 
        '24h': 24,    // 1 jour
        '7d': 168,    // 7 jours (24 × 7)
        '30d': 720    // 30 jours (24 × 30)
      };
      const hours = hoursMap[timeRange] ?? 24;
      const cutoff = new Date(Date.now() - hours * 3_600_000);  // Date limite

      // Garder uniquement les mesures après la date limite
      filtered = historyData.filter(d => {
        const date = parseMongoDate(d.timestamp);
        return date ? date >= cutoff : false;
      });
    }

    // ========================================================
    // 10.2 TRANSFORMATION ET CALCULS
    // ========================================================
    // Retourne les données formatées pour PowerChart et SoilingChart
    return filtered.map(d => {
      const power = d.electrical_data?.power_output || 0;
      const irradiance = d.electrical_data?.irradiance || 0;
      
      // Puissance théorique = Irradiance × Surface × Rendement
      const theoretical = irradiance * panelConfig.area * panelConfig.efficiency;

      return {
        time: fmtTime(d.timestamp),                                    // Heure formatée
        power: Number(power.toFixed(1)),                               // Puissance réelle (W)
        theoretical: Number(theoretical.toFixed(1)),                   // Puissance théorique (W)
        soiling: Number((d.ai_analysis?.soiling_level || 0).toFixed(1)), // Ensablement (%)
        loss: Number((Math.max(0, theoretical - power)).toFixed(1)),   // Perte (W)
      };
    }).reverse();  // Inverser l'ordre (plus récent en dernier pour l'affichage)
  }, [historyData, timeRange, panelConfig]);

  // ============================================================
  // 11. EXPOSITION DES DONNÉES ET FONCTIONS
  // ============================================================
  return {
    latest,
    historyData,
    stats,
    uploadResult,
    setUploadResult,
    loading,
    connected,
    esp32Online,
    panelConfig,
    chartData,
    load,  // Exposée pour permettre le rechargement manuel
  };
}