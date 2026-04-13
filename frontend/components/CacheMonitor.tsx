// frontend/components/CacheMonitor.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT CACHE MONITOR - PV MONITOR
 * ============================================================
 * Ce composant affiche les statistiques du cache IA et permet
 * de le vider manuellement. Il est utilisé pour surveiller
 * l'utilisation du cache et optimiser les performances.
 * 
 * Fonctionnalités :
 * - Affichage de l'utilisation du cache (taille / maxsize)
 * - Barre de progression visuelle
 * - Informations TTL et âge moyen
 * - Bouton de vidage du cache
 * - Rafraîchissement automatique toutes les 30 secondes
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';
import { getCacheStats, clearCache } from '@/lib/api';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
/** */
export default function CacheMonitor() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [stats, setStats] = useState<any>(null);        // Statistiques du cache
  const [loading, setLoading] = useState(true);          // État de chargement initial
  const [clearing, setClearing] = useState(false);       // État de vidage du cache

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Charge les statistiques du cache depuis l'API
   */
  const loadStats = async () => {
    const data = await getCacheStats();
    if (data && data.status === 'ok') {
      setStats(data.cache_stats);
    }
    setLoading(false);
  };

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Charge les stats au montage et met en place un rafraîchissement
   * automatique toutes les 30 secondes
   */
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 1000); // Rafraîchir toutes les 30s
    return () => clearInterval(interval);
  }, []);

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Vide le cache manuellement
   * Désactive le bouton pendant l'opération et recharge les stats
   */
  const handleClearCache = async () => {
    setClearing(true);
    const success = await clearCache();
    if (success) {
      await loadStats();
    }
    setClearing(false);
  };

  // ==========================================================
  // RENDU CONDITIONNEL (ÉTATS DE CHARGEMENT)
  // ==========================================================

  // Affichage pendant le chargement initial
  if (loading) {
    return (
      <div style={{
        background: C.surface2,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 13,
        color: C.text3,
      }}>
        Chargement cache...
      </div>
    );
  }

  // Affichage si les stats ne sont pas disponibles
  if (!stats) {
    return (
      <div style={{
        background: C.surface2,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 13,
        color: C.text3,
      }}>
        Cache non disponible
      </div>
    );
  }

  // ==========================================================
  // CALCULS
  // ==========================================================

  /**
   * Pourcentage d'utilisation du cache
   */
  const usagePercent = (stats.size / stats.maxsize * 100).toFixed(1);

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================
  return (
    <div>
     {/* style={{
      background: C.surface2,
      borderRadius: 10,
      padding: '12px 16px',
      border: `1px solid ${C.border}`,
    }}*/}
    
      
 

      {/* ==================================================== */}
      {/* BARRE DE PROGRESSION D'UTILISATION */}
      {/* ==================================================== */}
     {/*  <div style={{
        height: 6,
        background: C.surface,
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          height: '100%',
          width: `${usagePercent}%`,
          // Rouge si > 80% d'utilisation, bleu sinon
          background: stats.size > stats.maxsize * 0.8 ? '#c0392b' : C.blue,
          borderRadius: 99,
          transition: 'width 0.3s ease',
        }} />
      </div>*/}

      {/* ==================================================== */}
      {/* INFORMATIONS SUPPLÉMENTAIRES */}
      {/* ==================================================== */}
    {/*   <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: C.text3,
        marginBottom: 8,
      }}>
        <span>TTL: {stats.ttl / 3600}h</span>
        <span>Âge moy: {(stats.avg_age_sec / 60).toFixed(0)} min</span>
      </div>*/}

      {/* ==================================================== */}
      {/* BOUTON DE VIDAGE DU CACHE */}
      {/* ==================================================== */}
     {/*  <button
        onClick={handleClearCache}
        disabled={clearing || stats.size === 0}
        style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: 6,
          border: `1px solid ${C.border}`,
          background: clearing ? C.surface2 : C.surface,
          color: stats.size === 0 ? C.text3 : C.text,
          cursor: clearing || stats.size === 0 ? 'not-allowed' : 'pointer',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {clearing ? '⏳ Vidage...' : '🗑️ Vider le cache'}
      </button>*/}
    </div>
  );
}