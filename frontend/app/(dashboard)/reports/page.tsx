'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { C } from '@/lib/colors';

// Composants
import DateRangeSelector from './components/DateRangeSelector';
import KPICards from './components/KPICards';
import EvolutionChart from './components/EvolutionChart';
import StatusPieChart from './components/StatusPieChart';
import LatestMeasuresTable from './components/LatestMeasuresTable';

// Hooks et utils
import { useReportsData } from './hooks/useReportsData';
import { 
  prepareExportData, 
  prepareChartData, 
  preparePieData 
} from './utils/reportsUtils';

export default function ReportsPage() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // ==========================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================
  const { stats, history, loading } = useReportsData();

  // ==========================================================
  // PRÉPARATION DES DONNÉES
  // ==========================================================
  const exportData = prepareExportData(history);
  const chartData = prepareChartData(stats);
  const pieData = preparePieData(stats);

  // Calcul du taux de propreté
  const cleanPercentage = stats?.total && stats?.distribution?.Clean
    ? ((stats.distribution.Clean / stats.total) * 100).toFixed(0)
    : '0';

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================

  // Affichage du loader
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          border: '3px solid var(--green-l)', 
          borderTopColor: 'var(--green)', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  return (
    <div>
      {/* ==================================================== */}
      {/* EN-TÊTE DE LA PAGE */}
      {/* ==================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={24} color={C.green} />
          Rapports & Analyses
        </h1>

        <div style={{ display: 'flex', gap: 12 }}>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* ==================================================== */}
      {/* KPIS - CARTES DE STATISTIQUES */}
      {/* ==================================================== */}
      <KPICards
        total={stats?.total || 0}
        avgPower={stats?.averages?.avg_power || 0}
        avgSoiling={stats?.averages?.avg_soiling || 0}
        cleanPercentage={parseFloat(cleanPercentage)}
      />

      {/* ==================================================== */}
      {/* GRAPHIQUES (2 colonnes) */}
      {/* ==================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <EvolutionChart data={chartData} />
        <StatusPieChart data={pieData} />
      </div>

      {/* ==================================================== */}
      {/* TABLEAU DES DERNIÈRES MESURES */}
      {/* ==================================================== */}
      <LatestMeasuresTable
        headers={exportData.headers}
        rows={exportData.rows}
        filename="dernieres_mesures"
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}