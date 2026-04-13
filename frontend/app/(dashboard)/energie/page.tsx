// ============================================================================
// FICHIER: page.tsx (energie)
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   C'est la page d'analyse énergétique du PV Monitor. Elle présente :
//   - 6 KPIs énergétiques (mesures, puissance moyenne, performance ratio, 
//     specific yield, perte totale, taux de dégradation)
//   - Graphique de puissance réelle vs théorique
//   - Graphique de tension et courant
//   - Tableau des pertes par niveau d'ensablement
//
// 🎨 COMPOSANTS UTILISÉS:
//   - KpiCard            : Cartes d'indicateurs clés (6 KPIs)
//   - TimeRangeSelector  : Sélecteur de plage temporelle (24h, 7j, 30j, Tout)
//   - PowerChart         : Graphique de puissance (réelle vs théorique)
//   - VoltageCurrentChart: Graphique de tension et courant
//   - LossTable          : Tableau des pertes par niveau d'ensablement
//   - Card               : Conteneur de carte avec style uniforme
//   - CardTitle          : Titre de carte avec icône
//
// 🔄 LOGIQUE MÉTIER:
//   - Récupération des données énergétiques via le hook useEnergyData
//   - Calcul des KPIs : puissance moyenne, performance ratio, specific yield,
//     perte totale, taux de dégradation
//   - Filtrage des données selon la plage temporelle sélectionnée
//   - Rafraîchissement automatique ou manuel des données
//
// 🔐 GESTION DES ÉTATS:
//   - loading    : Affichage d'un spinner pendant le chargement des données
//   - timeRange  : Plage temporelle sélectionnée par l'utilisateur
//   - chartData  : Données transformées pour les graphiques
//   - n          : Nombre total de mesures
//   - avgP       : Puissance moyenne (W)
//   - performanceRatio : Ratio de performance (%)
//   - specificYield    : Rendement spécifique (kWh/kWp)
//   - totalLoss        : Perte totale (kWh)
//   - degradationRate  : Taux de dégradation annuel (%/an)
//
// 🎯 INTERACTIONS UTILISATEUR:
//   - Sélection de la plage temporelle (24h, 7j, 30j, Tout)
//   - Rafraîchissement automatique (géré par RefreshContext)
//   - Visualisation des graphiques interactifs
//   - Consultation du tableau des pertes détaillées
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (nécessaire pour les hooks et les interactions)

import { useState } from 'react';
import {
  Zap,           // Icône éclair (énergie)
  Hash,          // Icône dièse (nombre de mesures)
  Target,        // Icône cible (performance ratio)
  Award,         // Icône trophée (specific yield)
  TrendingDown,  // Icône tendance descendante (perte)
  Percent,       // Icône pourcentage (dégradation)
  TrendingUp,    // Icône tendance montante (puissance)
  Gauge,         // Icône jauge (tension/courant)
  ClipboardList, // Icône presse-papier (tableau des pertes)
} from 'lucide-react';
import { C } from '@/lib/colors';             // Palette de couleurs personnalisée
import { useRefresh } from '@/contexts/RefreshContext';        // Contexte de rafraîchissement auto
import { useDashboardReset } from '@/contexts/DashboardContext'; // Contexte de réinitialisation

// Composants de la page
import Card from './components/Card';                    // Conteneur de carte stylisé
import CardTitle from './components/CardTitle';          // Titre de carte avec icône
import KpiCard from './components/KpiCard';              // Carte d'indicateur clé
import TimeRangeSelector from './components/TimeRangeSelector'; // Sélecteur de période
import PowerChart from './components/PowerChart';        // Graphique de puissance
import VoltageCurrentChart from './components/VoltageCurrentChart'; // Graphique V & I
import LossTable from './components/LossTable';          // Tableau des pertes

// Hook personnalisé pour les données énergétiques
import { useEnergyData } from './hooks/useEnergyData';

// ============================================================
// 2. COMPOSANT PRINCIPAL
// ============================================================

export default function EnergiePage() {
  // ============================================================
  // 2.1 CONTEXTS ET ÉTATS
  // ============================================================
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();  // Rafraîchissement auto
  const { isReset, clearResetFlag } = useDashboardReset();          // Réinitialisation du dashboard
  const [timeRange, setTimeRange] = useState('all');                // Plage temporelle sélectionnée

  // Réinitialisation du dashboard (si demandée par un autre composant)
  if (isReset) {
    clearResetFlag();
  }

  // ============================================================
  // 2.2 HOOK DE CHARGEMENT DES DONNÉES ÉNERGÉTIQUES
  // ============================================================
  const {
    loading,          // Chargement en cours ? (booléen)
    chartData,        // Données transformées pour les graphiques (tableau)
    n,                // Nombre total de mesures (entier)
    avgP,             // Puissance moyenne (W) (nombre)
    performanceRatio, // Ratio de performance (%) (nombre)
    specificYield,    // Rendement spécifique (kWh/kWp) (nombre)
    totalLoss,        // Perte totale (kWh) (nombre)
    degradationRate,  // Taux de dégradation (%/an) (nombre)
  } = useEnergyData({
    autoRefresh,      // Activer le rafraîchissement automatique ?
    refreshKey,       // Clé de déclenchement du rafraîchissement
    timeRange,        // Plage temporelle filtrée
    setLastUpdate,    // Fonction pour mettre à jour l'horodatage
  });

  // ============================================================
  // 2.3 RENDU : ÉTAT DE CHARGEMENT
  // ============================================================
  // Affiche un spinner animé pendant le chargement initial des données
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
        {/* Spinner CSS animé */}
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
        <span style={{ color: C.text3, fontSize: 13 }}>Chargement des données énergétiques…</span>
      </div>
    );
  }

  // ============================================================
  // 2.4 RENDU : PAGE PRINCIPALE
  // ============================================================
  return (
    <div>
      {/* ======================================================== */}
      {/* EN-TÊTE DE LA PAGE */}
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
          {/* Titre de la page avec icône Zap (éclair) */}
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
            <Zap size={24} color={C.blue} />
            Analyse Énergétique
          </h1>
          {/* Sélecteur de plage temporelle (24h, 7j, 30j, Tout) */}
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6 CARTES KPI ÉNERGÉTIQUES
      /*======================================================== */
      {/* Affichage en grille de 6 colonnes pour les indicateurs clés */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* 1. Nombre de mesures : Total des points de données collectés */}
        <KpiCard icon={Hash} label="MESURES" value={String(n)} unit="" accentColor={C.green} />
        {/* 2. Puissance moyenne : Moyenne de la puissance produite (en Watts) */}
        <KpiCard icon={Zap} label="PUISSANCE MOY." value={avgP.toFixed(1)} unit="W" accentColor={C.blue} />
        {/* 3. Performance Ratio : Efficacité du système (%) */}
        <KpiCard
          icon={Target}
          label="PERFORMANCE RATIO"
          value={performanceRatio.toFixed(1)}
          unit="%"
          accentColor={C.purple}
        />
        {/* 4. Specific Yield : Rendement spécifique (production par kWc installé) */}
        <KpiCard
          icon={Award}
          label="SPECIFIC YIELD"
          value={specificYield.toFixed(2)}
          unit="kWh/kWp"
          accentColor={C.purple}
        />
        {/* 5. Perte totale : Énergie perdue due à l'ensablement et autres facteurs */}
        <KpiCard
          icon={TrendingDown}
          label="PERTE TOTALE"
          value={totalLoss.toFixed(2)}
          unit="kWh"
          accentColor={C.red}
        />
        {/* 6. Taux de dégradation : Perte de performance annuelle estimée */}
        <KpiCard
          icon={Percent}
          label="DÉGRADATION"
          value={degradationRate.toFixed(1)}
          unit="%/an"
          accentColor={C.amber}
        />
      </div>

      {/* ======================================================== */}
      {/* GRAPHIQUE : PUISSANCE RÉELLE VS THÉORIQUE
      /*======================================================== */}
      {/* Compare la puissance réellement produite avec la puissance théorique attendue */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle icon={TrendingUp} text="Puissance réelle vs théorique" />
          <PowerChart data={chartData} loading={loading} height={280} />
        </Card>
      </div>

      {/* ======================================================== */}
      {/* GRAPHIQUE : TENSION & COURANT
      /*======================================================== */}
      {/* Affiche l'évolution de la tension (V) et du courant (A) dans le temps */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle icon={Gauge} text="Tension & Courant" dot={C.blue} />
          <VoltageCurrentChart data={chartData} height={200} />
        </Card>
      </div>

      {/* ======================================================== */}
      {/* TABLEAU : PERTES PAR NIVEAU D'ENSABLEMENT
      /*======================================================== */}
      {/* Détaille les pertes énergétiques classées par niveau d'ensablement (Clean, Low, Medium, High) */}
      <Card>
        <CardTitle icon={ClipboardList} text="Pertes par niveau d'ensablement" />
        <LossTable />
      </Card>
    </div>
  );
}