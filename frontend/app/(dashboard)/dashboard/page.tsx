// ============================================================================
// FICHIER: page.tsx (dashboard)
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   C'est la page principale du dashboard PV Monitor. Elle affiche toutes
//   les informations de surveillance des panneaux solaires en temps réel :
//   - KPIs (ensablement, puissance, perte, performance, production, température)
//   - Image de l'ESP32-CAM
//   - Jauge d'ensablement
//   - Télémétrie (tension, courant, irradiance, puissance)
//   - Zone d'upload pour analyse manuelle d'image
//   - Graphiques de puissance (réelle vs théorique)
//   - Graphique d'évolution de l'ensablement
//   - Statistiques globales
//   - Configuration des panneaux
//
// 🎨 COMPOSANTS UTILISÉS:
//   - KpiCard          : Cartes d'indicateurs clés
//   - SoilingGauge     : Jauge d'ensablement
//   - TelemetryItem    : Mesures de télémétrie
//   - UploadZone       : Zone de dépôt d'image
//   - TimeRangeSelector: Sélecteur de plage temporelle
//   - StatCard         : Cartes statistiques
//   - PowerChart       : Graphique de puissance
//   - SoilingChart     : Graphique d'ensablement
//
// 🔄 LOGIQUE MÉTIER:
//   - Calcul de la puissance théorique = Irradiance × Surface × Rendement
//   - Calcul de la perte = max(0, théorique - réelle)
//   - Calcul du Performance Ratio = (puissance_réelle / théorique) × 100
//   - Production journalière estimée = puissance_moyenne × 24h / 1000
//
// 🔐 GESTION DES ÉTATS:
//   - loading    : Affichage d'un spinner pendant le chargement initial
//   - connected  : Backend accessible ? (sinon affiche bannière d'erreur)
//   - esp32Online: ESP32 connecté ? (sinon affiche "En attente ESP32…")
//   - noData     : Aucune donnée disponible (fallbacks vers "--" ou 0)
//
// 🎯 INTERACTIONS UTILISATEUR:
//   - Sélection de la plage temporelle (24h, 7j, 30j, Tout)
//   - Upload d'image pour analyse IA manuelle
//   - Bouton "Réessayer" en cas d'erreur de connexion
//   - Rafraîchissement automatique (géré par RefreshContext)
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (nécessaire pour les hooks et les interactions)

import { useState } from 'react';
import {
  Sun,           // Icône soleil
  WifiOff,       // Icône wifi coupé
  RefreshCw,     // Icône actualiser
  Tag,           // Icône étiquette
  Zap,           // Icône éclair (puissance)
  TrendingDown,  // Icône tendance descendante (perte)
  Target,        // Icône cible (performance)
  Thermometer,   // Icône thermomètre
  Camera,        // Icône caméra
  Satellite,     // Icône satellite
  BarChart3,     // Icône graphique
  Activity,      // Icône activité
  TrendingUp,    // Icône tendance montante
  Search,        // Icône recherche
  Power,         // Icône puissance
  Plug,          // Icône prise
  Database,      // Icône base de données
  AlertTriangle, // Icône triangle alerte
} from 'lucide-react';
import { C } from '@/lib/colors';
import { statusColor, fmtDateTime } from '@/lib/api';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDashboardReset } from '@/contexts/DashboardContext';

// Composants de la page
import KpiCard from './components/KpiCard';
import SoilingGauge from './components/SoilingGauge';
import TelemetryItem from './components/TelemetryItem';
import UploadZone from './components/UploadZone';
import TimeRangeSelector from './components/TimeRangeSelector';
import StatCard from './components/StatCard';
import PowerChart from './components/PowerChart';
import SoilingChart from './components/SoilingChart';

// Hook personnalisé pour les données
import { useDashboardData } from './hooks/useDashboardData';

// ============================================================
// 2. COMPOSANT PRINCIPAL
// ============================================================

export default function DashboardPage() {
  // ============================================================
  // 2.1 CONTEXTS ET ÉTATS
  // ============================================================
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();  // Rafraîchissement auto
  const { isReset, clearResetFlag } = useDashboardReset();          // Réinitialisation du dashboard
  const [timeRange, setTimeRange] = useState('24h');                // Plage temporelle sélectionnée

  // Réinitialisation du dashboard (si demandée par un autre composant)
  if (isReset) {
    clearResetFlag();
  }

  // ============================================================
  // 2.2 HOOK DE CHARGEMENT DES DONNÉES
  // ============================================================
  const {
    latest,           // Dernière mesure
    uploadResult,     // Résultat de l'analyse manuelle
    setUploadResult,  // Fonction pour mettre à jour le résultat
    loading,          // Chargement en cours ?
    connected,        // Backend accessible ?
    esp32Online,      // Au moins un ESP32 en ligne ?
    panelConfig,      // Configuration des panneaux (surface, rendement)
    chartData,        // Données transformées pour les graphiques
    stats,            // Statistiques globales
    load,             // Fonction pour recharger manuellement
  } = useDashboardData({
    autoRefresh,
    refreshKey,
    timeRange,
    setLastUpdate,
  });

  // ============================================================
  // 2.3 FALLBACKS (valeurs par défaut si pas de données)
  // ============================================================
  
  // Analyse IA (dernière mesure ou valeurs par défaut)
  const ai = latest?.ai_analysis ?? {
    soiling_level: 0,
    status: 'Clean',
    confidence: 0,
    model_version: '—',
  };

  // Données électriques (dernière mesure ou valeurs par défaut)
  const ed = latest?.electrical_data ?? {
    voltage: 0,
    current: 0,
    power_output: 0,
    irradiance: 0,
    temperature: 0,
  };

  // Image base64 (dernière mesure)
  const b64 = latest?.media?.image_b64;
  
  // Flag indiquant si aucune donnée n'est disponible
  const noData = !esp32Online || !latest;

  // ============================================================
  // 2.4 CALCULS MÉTIER
  // ============================================================
  
  // Puissance théorique (W) = Irradiance × Surface × Rendement
  const theoreticalPower = (ed.irradiance || 0) * panelConfig.area * panelConfig.efficiency;
  
  // Perte de puissance (W) = max(0, théorique - réelle)
  const loss = Math.max(0, theoreticalPower - (ed.power_output || 0));
  
  // Couleur du statut (vert/orange/rouge)
  const statusColorValue = statusColor(ai.status || 'Clean');
  
  // Performance Ratio (%) = (puissance_réelle / théorique) × 100
  const performanceRatio = theoreticalPower > 0 
    ? ((ed.power_output || 0) / theoreticalPower) * 100 
    : 0;
  
  // Température (fallback 25°C si non disponible)
  const temperature = ed.temperature || 25;

  // Production journalière estimée (kWh) = puissance_moyenne × 24h / 1000
  const dailyProduction = stats?.averages?.avg_power 
    ? (stats.averages.avg_power || 0) * 24 / 1000 
    : 0;

  // Moyennes des métriques (pour les statistiques)
  const defaultAverages = {
    avg_power: 0, avg_soiling: 0, avg_voltage: 0,
    avg_current: 0, avg_irradiance: 0, avg_temperature: 0,
  };
  const averages = stats?.averages || defaultAverages;

  // Nombre total de mesures
  const totalMeasurements = stats?.total ?? 0;

  // ============================================================
  // 2.5 FONCTION DE FORMATAGE (gère l'état "noData")
  // ============================================================
  const fmt = (v: number, dec = 0) => {
    if (noData) return '--';
    if (typeof v !== 'number' || isNaN(v)) return '0';
    return v.toFixed(dec);
  };

  // ============================================================
  // 2.6 RENDU : ÉTAT DE CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Spinner CSS */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `3px solid ${C.greenL}`,
            borderTop: `3px solid ${C.green}`,
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ color: C.text3, fontSize: 13 }}>Connexion au backend…</span>
      </div>
    );
  }

  // ============================================================
  // 2.7 RENDU : PAGE PRINCIPALE
  // ============================================================
  return (
    <div>
      {/* ======================================================== */}
      {/* EN-TÊTE */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.text,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sun size={24} color={C.amber} />
            Dashboard PV
          </h1>
          {/* Badge "Live" si ESP32 connecté */}
          {esp32Online && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: C.greenL,
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 11,
                color: C.green,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: C.green,
                  animation: 'pulse-ring 1.5s ease-out infinite',
                }}
              />
              Live · {latest?.timestamp ? fmtDateTime(latest.timestamp) : ''}
            </div>
          )}
        </div>
        {/* Sélecteur de plage temporelle */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* ======================================================== */}
      {/* BANNIÈRE D'ERREUR (connexion perdue ou ESP32 offline) */}
      {/* ======================================================== */}
      {(!connected || noData) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderLeft: `4px solid ${C.amber}`,
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <WifiOff size={22} color={C.amber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: C.amber, fontSize: 14 }}>
              {!connected ? 'Backend inaccessible' : 'ESP32 non connecté'}
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>
              {!connected
                ? 'Impossible de joindre le serveur — vérifier que uvicorn tourne'
                : 'Carte hors tension ou WiFi perdu'}
            </div>
          </div>
          <button
            onClick={load}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${C.amber}`,
              background: C.amberL,
              color: C.amber,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RefreshCw size={12} />
            Réessayer
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6 CARTES KPI */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* 1. Ensablement IA */}
        <KpiCard
          icon={Tag}
          label="ENSABLEMENT IA"
          value={fmt(ai.soiling_level, 1)}
          unit={noData ? '' : '%'}
          badge={noData ? 'En attente' : ai.status || 'Clean'}
          accentColor={noData ? C.text3 : statusColorValue}
          delay="0s"
        />
        {/* 2. Puissance */}
        <KpiCard
          icon={Zap}
          label="PUISSANCE"
          value={fmt(ed.power_output)}
          unit={noData ? '' : 'W'}
          badge={noData ? 'En attente' : 'Réelle'}
          accentColor={noData ? C.text3 : C.blue}
          delay=".05s"
        />
        {/* 3. Perte */}
        <KpiCard
          icon={TrendingDown}
          label="PERTE"
          value={fmt(loss)}
          unit={noData ? '' : 'W'}
          badge={noData ? 'En attente' : 'Estimée'}
          accentColor={noData ? C.text3 : loss > 30 ? C.red : C.amber}
          delay=".10s"
        />
        {/* 4. Performance */}
        <KpiCard
          icon={Target}
          label="PERFORMANCE"
          value={noData ? '--' : performanceRatio.toFixed(0)}
          unit={noData ? '' : '%'}
          badge={noData ? 'En attente' : 'PR'}
          accentColor={noData ? C.text3 : performanceRatio > 80 ? C.green : C.amber}
          delay=".15s"
        />
        {/* 5. Production journalière */}
        <KpiCard
          icon={Sun}
          label="PROD. JOURNALIÈRE"
          value={noData ? '--' : dailyProduction.toFixed(1)}
          unit={noData ? '' : 'kWh'}
          badge={noData ? 'En attente' : 'Estimée'}
          accentColor={noData ? C.text3 : C.purple}
          delay=".20s"
        />
        {/* 6. Température */}
        <KpiCard
          icon={Thermometer}
          label="TEMPÉRATURE"
          value={noData ? '--' : temperature.toFixed(1)}
          unit="°C"
          badge={noData ? 'En attente' : 'Module'}
          accentColor={noData ? C.text3 : C.blue}
          delay=".25s"
        />
      </div>

      {/* ======================================================== */}
      {/* GRILLE PRINCIPALE (2 colonnes) */}
      {/* ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        
        {/* ==================================================== */}
        {/* COLONNE GAUCHE */}
        {/* ==================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* CARTE : IMAGE ESP32 + JAUGE */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            {/* Titre : Image ESP32 */}
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <Camera size={14} /> IMAGE ESP32
            </div>
            
            {/* Image ou placeholder */}
            {b64 ? (
              <img
                src={`data:image/jpeg;base64,${b64}`}
                alt="panneau"
                style={{ width: '100%', borderRadius: 9, objectFit: 'cover', maxHeight: 190 }}
              />
            ) : (
              <div
                style={{
                  background: C.surface2,
                  borderRadius: 9,
                  padding: '32px 14px',
                  textAlign: 'center',
                  color: C.text3,
                }}
              >
                <Satellite size={32} style={{ marginBottom: 6, opacity: 0.7 }} />
                <div style={{ fontSize: 13, fontWeight: 500 }}>En attente ESP32…</div>
              </div>
            )}
            
            {/* Séparateur */}
            <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
            
            {/* Titre : Jauge d'ensablement */}
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <BarChart3 size={14} /> NIVEAU ENSABLEMENT
            </div>
            
            {/* Jauge */}
            <SoilingGauge level={ai.soiling_level} status={ai.status} confidence={ai.confidence} />
          </div>

          {/* CARTE : TÉLÉMÉTRIE */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }} />
              <Activity size={14} /> TÉLÉMÉTRIE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <TelemetryItem icon={Zap} value={noData ? 0 : ed.voltage} unit="V" label="Tension" />
              <TelemetryItem icon={Plug} value={noData ? 0 : ed.current} unit="A" label="Courant" />
              <TelemetryItem icon={Sun} value={noData ? 0 : ed.irradiance} unit="W/m²" label="Irradiance" />
              <TelemetryItem icon={Power} value={noData ? 0 : ed.power_output} unit="W" label="Puissance" />
            </div>
          </div>

          {/* CARTE : ANALYSE MANUELLE (UPLOAD) */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <Search size={14} /> ANALYSE MANUELLE
            </div>
            
            {/* Zone d'upload */}
            <UploadZone onResult={setUploadResult} />
            
            {/* Résultat de l'analyse (si disponible) */}
            {uploadResult && (
              <div
                style={{
                  background: C.surface2,
                  borderRadius: 9,
                  padding: 11,
                  marginTop: 9,
                }}
              >
                <div
                  style={{
                    height: 3,
                    background: statusColor(uploadResult.status),
                    borderRadius: 2,
                    marginBottom: 8,
                  }}
                />
                {uploadResult.image_b64 && (
                  <img
                    src={`data:image/jpeg;base64,${uploadResult.image_b64}`}
                    alt="analyse"
                    style={{
                      width: '100%',
                      borderRadius: 7,
                      maxHeight: 130,
                      objectFit: 'cover',
                      marginBottom: 8,
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: 'Sora',
                    fontSize: 22,
                    fontWeight: 800,
                    color: statusColor(uploadResult.status),
                  }}
                >
                  {uploadResult.soiling_level?.toFixed(1)}%
                </span>
                <span style={{ fontSize: 13, color: C.text2, marginLeft: 6 }}>— {uploadResult.status}</span>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                  Confiance : {uploadResult.confidence?.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* COLONNE DROITE */}
        {/* ==================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* GRAPHIQUE : PUISSANCE (réelle vs théorique) */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={14} color={C.green} />
              PUISSANCE : RÉELLE vs THÉORIQUE
            </div>
            <PowerChart data={chartData} height={220} />
          </div>

          {/* GRAPHIQUE : ÉVOLUTION DE L'ENSABLEMENT */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingDown size={14} color={C.amber} />
              ÉVOLUTION DE L'ENSABLEMENT
            </div>
            <SoilingChart data={chartData} height={180} />
          </div>

          {/* STATISTIQUES GLOBALES */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.text3,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BarChart3 size={14} color={C.blue} />
              STATISTIQUES GLOBALES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <StatCard
                value={totalMeasurements}
                unit=""
                label="Mesures totales"
                color={C.green}
                icon={Database}
              />
              <StatCard
                value={averages.avg_power ?? 0}
                unit="W"
                label="Puissance moy."
                color={C.blue}
                icon={Zap}
                decimals={0}
              />
              <StatCard
                value={averages.avg_soiling ?? 0}
                unit="%"
                label="Ensablement moy."
                color={C.amber}
                icon={AlertTriangle}
                decimals={1}
              />
              <StatCard
                value={averages.avg_voltage ?? 0}
                unit="V"
                label="Tension moy."
                color={C.purple}
                icon={Activity}
                decimals={1}
              />
            </div>
          </div>

          {/* CONFIGURATION PANNEAUX + ANALYSE IA (2 colonnes) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Configuration des panneaux */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag size={16} color={C.green} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>Configuration Panneaux</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div>
                  <span style={{ color: C.text3 }}>Surface</span>
                  <br />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: C.text }}>
                    {panelConfig.area} m²
                  </span>
                </div>
                <div>
                  <span style={{ color: C.text3 }}>Rendement</span>
                  <br />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: C.text }}>
                    {(panelConfig.efficiency * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Analyse IA (pertes + performance) */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Search size={16} color={C.green} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>Analyse IA</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div>
                  <span style={{ color: C.text3 }}>Pertes estimées</span>
                  <br />
                  <span
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      color: loss > 10 ? C.red : C.text,
                    }}
                  >
                    {fmt(loss, 1)} W
                  </span>
                </div>
                <div>
                  <span style={{ color: C.text3 }}>Performance</span>
                  <br />
                  <span
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      color: performanceRatio > 80 ? C.green : C.amber,
                    }}
                  >
                    {performanceRatio.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STYLES CSS (animations) */}
      {/* ======================================================== */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .fade-up {
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}