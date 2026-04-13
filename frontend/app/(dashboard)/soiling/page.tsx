// app/(dashboard)/soiling/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Droplets, Clock } from 'lucide-react';
import { fmtDateTime, statusColor } from '@/lib/api';
import { C } from '@/lib/colors';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDevice } from '@/contexts/DeviceContext';

// Composants
import KpiCard from './components/KpiCard';
import SoilingGauge from './components/SoilingGauge';
import TimeRangeSelector from './components/TimeRangeSelector';
import EvolutionChart from './components/EvolutionChart';
import StatusDistribution from './components/StatusDistribution';
import DailyStats from './components/DailyStats';
import Recommendations from './components/Recommendations';

// Hooks et utils
import { useSoilingData } from './hooks/useSoilingData';
import { 
  prepareChartData, 
  calculateStatusCounts, 
  calculateSoilingStats, 
  calculateEconomicMetrics 
} from './utils/soilingUtils';

export default function SoilingPage() {
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();
  const { selectedDevice } = useDevice();
  
  const [timeRange, setTimeRange] = useState('30d');
  
  const { latest, historyData, stats, loading, panelConfig, refresh } = useSoilingData(
    autoRefresh, refreshKey, setLastUpdate
  );

  // Affichage du loader
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${C.greenL}`, borderTop: `3px solid ${C.green}`, animation: 'spin 1s linear infinite' }} />
      <span style={{ color: C.text3, fontSize: 13 }}>Chargement des données d'ensablement...</span>
    </div>
  );

  // Valeurs par défaut sécurisées
  const ai = latest?.ai_analysis ?? { soiling_level: 0, status: 'Clean', confidence: 0 };
  const ed = latest?.electrical_data ?? { power_output: 0, irradiance: 0 };

  // Calculs avancés
  const pth = (ed.irradiance || 0) * panelConfig.area * panelConfig.efficiency;
  const soilingRatio = pth > 0 ? ((pth - (ed.power_output || 0)) / pth) * 100 : 0;
  const powerLoss = pth - (ed.power_output || 0);  // Perte en Watts
  const energyLostToday = (powerLoss * 24) / 1000;  // Perte en kWh/jour
  //const energyLostToday = ((ai.soiling_level || 0) / 100) * pth * 24 / 1000;
  const energyPrice = 0.20;
  const cleaningCost = 50;
  
  const { roiValue, roiNum } = calculateEconomicMetrics(
     ai.soiling_level,
     pth,
     ed.power_output || 0,
     cleaningCost,
     energyPrice);
  
  // Préparation des données pour les graphiques
  const chartData = prepareChartData(historyData);
  const statusCounts = calculateStatusCounts(historyData);
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  const avgSoiling = stats?.averages?.avg_soiling || 0;
  const { minSoiling, maxSoiling, stdDev } = calculateSoilingStats(historyData, avgSoiling);

  return (
    <div>
      {/* EN-TÊTE DE LA PAGE */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={24} color={C.amber} />
            Analyse d'Ensablement
          </h1>
          {latest && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.surface2, padding: '4px 10px',
              borderRadius: 99, fontSize: 11, color: C.text2,
            }}>
              <Clock size={12} />
              Dernière mesure: {latest?.timestamp ? fmtDateTime(latest.timestamp) : ''}
            </div>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* KPIS - CARTES DE MÉTRIQUES (4 CARTES) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        
        {/* Carte 1 : Ensablement actuel */}
        <KpiCard icon={Droplets} label="ENSABLEMENT ACTUEL"
          value={ai.soiling_level?.toFixed(1) || '0'} unit="%"
          badge={ai.status || 'Clean'} accentColor={statusColor(ai.status || 'Clean')}
          subtext={`Confiance: ${((ai.confidence || 0) * 100).toFixed(0)}%`} />
        
        {/* Carte 2 : Soiling Ratio */}
        <KpiCard icon={Droplets} label="SOILING RATIO"
          value={soilingRatio.toFixed(1)} unit="%"
          badge="Perte" accentColor={soilingRatio > 20 ? C.red : C.amber}
          subtext="Par rapport à la théorie" />
        
        {/* Carte 3 : Perte énergétique */}
        <KpiCard icon={Droplets} label="PERTE ÉNERGÉTIQUE"
          value={energyLostToday.toFixed(2)} unit="kWh/jour"
          badge="Estimée" accentColor={C.purple}
          subtext={`Soit ${(energyLostToday * energyPrice).toFixed(2)} DT/jour`} />
        
        {/* Carte 4 : ROI Nettoyage */}
        <KpiCard icon={Droplets} label="ROI NETTOYAGE"
          value={roiValue} unit="DT/an"
          badge={roiNum > 0 ? 'Rentable' : 'Non rentable'}
          accentColor={roiNum > 0 ? C.green : C.red}
          subtext="Basé sur pertes annuelles estimées" />
      </div>

      {/* Jauge d'ensablement */}
      <div style={{ marginBottom: 20 }}>
        <SoilingGauge level={ai.soiling_level} status={ai.status} confidence={ai.confidence} />
      </div>

      {/* Graphique d'évolution */}
      <EvolutionChart data={chartData} onRefresh={refresh} />

      {/* STATISTIQUES AVANCÉES (2 COLONNES) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <StatusDistribution data={pieData} totalCount={historyData.length} />
        <DailyStats 
          avgSoiling={avgSoiling} 
          minSoiling={minSoiling} 
          maxSoiling={maxSoiling} 
          stdDev={stdDev} 
        />
      </div>

      {/* Recommandations de nettoyage */}
      <Recommendations 
        soilingLevel={ai.soiling_level} 
        pth={pth} 
        roiValue={roiValue} 
        roiNum={roiNum} 
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