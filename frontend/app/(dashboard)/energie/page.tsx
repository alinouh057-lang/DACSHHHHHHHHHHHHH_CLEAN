// app/(dashboard)/energie/page.tsx
'use client';

import { useState } from 'react';
import { Zap, Hash, Target, Award, TrendingDown, Percent, TrendingUp, Gauge, ClipboardList } from 'lucide-react';
import { C } from '@/lib/colors';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDashboardReset } from '@/contexts/DashboardContext';

// Composants
import Card from './components/Card';
import CardTitle from './components/CardTitle';
import KpiCard from './components/KpiCard';
import TimeRangeSelector from './components/TimeRangeSelector';
import PowerChart from './components/PowerChart';
import VoltageCurrentChart from './components/VoltageCurrentChart';
import LossTable from './components/LossTable';

// Hook
import { useEnergyData } from './hooks/useEnergyData';

export default function EnergiePage() {
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();
  const { isReset, clearResetFlag } = useDashboardReset();
  const [timeRange, setTimeRange] = useState('all');

  if (isReset) {
    clearResetFlag();
  }

  const {
    loading,
    chartData,
    n,
    avgP,
    performanceRatio,
    specificYield,
    totalLoss,
    degradationRate,
  } = useEnergyData({
    autoRefresh,
    refreshKey,
    timeRange,
    setLastUpdate,
  });

  return (
    <div>
      {/* En-tête */}
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
            <Zap size={24} color={C.blue} />
            Analyse Énergétique
          </h1>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* 6 KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KpiCard icon={Hash} label="MESURES" value={String(n)} unit="" accentColor={C.green} />
        <KpiCard icon={Zap} label="PUISSANCE MOY." value={avgP.toFixed(1)} unit="W" accentColor={C.blue} />
        <KpiCard
          icon={Target}
          label="PERFORMANCE RATIO"
          value={performanceRatio.toFixed(1)}
          unit="%"
          accentColor={C.purple}
        />
        <KpiCard
          icon={Award}
          label="SPECIFIC YIELD"
          value={specificYield.toFixed(2)}
          unit="kWh/kWp"
          accentColor={C.purple}
        />
        <KpiCard
          icon={TrendingDown}
          label="PERTE TOTALE"
          value={totalLoss.toFixed(2)}
          unit="kWh"
          accentColor={C.red}
        />
        <KpiCard
          icon={Percent}
          label="DÉGRADATION"
          value={degradationRate.toFixed(1)}
          unit="%/an"
          accentColor={C.amber}
        />
      </div>

      {/* Graphique principal */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle icon={TrendingUp} text="Puissance réelle vs théorique" />
          <PowerChart data={chartData} loading={loading} height={280} />
        </Card>
      </div>

      {/* Graphique tension/courant */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle icon={Gauge} text="Tension & Courant" dot={C.blue} />
          <VoltageCurrentChart data={chartData} height={200} />
        </Card>
      </div>

      {/* Tableau des pertes */}
      <Card>
        <CardTitle icon={ClipboardList} text="Pertes par niveau d'ensablement" />
        <LossTable />
      </Card>
    </div>
  );
}
