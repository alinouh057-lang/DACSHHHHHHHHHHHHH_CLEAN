// components/KPICards.tsx
'use client';
import { Wrench, CheckCircle, Calendar, TrendingDown } from 'lucide-react';
import { C } from '@/lib/colors';

interface KPICardsProps {
  totalInterventions: number;
  completedCount: number;
  plannedCount: number;
  avgImprovement: number;
  loading: boolean;
}

export default function KPICards({ totalInterventions, completedCount, plannedCount, avgImprovement, loading }: KPICardsProps) {
  const displayValue = (val: number) => loading ? '...' : val;
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
      {/* Carte 1 : Interventions totales */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 20px', borderTop: `3px solid ${C.blue}`,
      }}>
        <Wrench size={24} color={C.blue} />
        <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 800, color: C.blue, marginTop: 8 }}>
          {displayValue(totalInterventions)}
        </div>
        <div style={{ fontSize: 11, color: C.text3 }}>Interventions totales</div>
      </div>

      {/* Carte 2 : Interventions terminées */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 20px', borderTop: `3px solid ${C.green}`,
      }}>
        <CheckCircle size={24} color={C.green} />
        <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 800, color: C.green, marginTop: 8 }}>
          {displayValue(completedCount)}
        </div>
        <div style={{ fontSize: 11, color: C.text3 }}>Terminées</div>
      </div>

      {/* Carte 3 : Interventions planifiées */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 20px', borderTop: `3px solid ${C.amber}`,
      }}>
        <Calendar size={24} color={C.amber} />
        <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 800, color: C.amber, marginTop: 8 }}>
          {displayValue(plannedCount)}
        </div>
        <div style={{ fontSize: 11, color: C.text3 }}>Planifiées</div>
      </div>

      {/* Carte 4 : Amélioration moyenne */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 20px', borderTop: `3px solid ${C.purple}`,
      }}>
        <TrendingDown size={24} color={C.purple} />
        <div style={{ fontFamily: 'Sora', fontSize: 26, fontWeight: 800, color: C.purple, marginTop: 8 }}>
          {loading ? '...' : avgImprovement.toFixed(0)}%
        </div>
        <div style={{ fontSize: 11, color: C.text3 }}>Amélioration moyenne</div>
      </div>
    </div>
  );
}