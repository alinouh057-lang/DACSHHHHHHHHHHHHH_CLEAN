// components/StatsCards.tsx
'use client';
import { Database, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Percent } from 'lucide-react';
import { C } from '@/lib/colors';

interface StatsCardsProps {
  total: number;
  cleanCount: number;
  warningCount: number;
  criticalCount: number;
  trendSoiling: string;
  cleanPercentage: number;
}

export default function StatsCards({
  total,
  cleanCount,
  warningCount,
  criticalCount,
  trendSoiling,
  cleanPercentage,
}: StatsCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 20 }}>
      {/* Total mesures */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.green}` }}>
        <Database size={20} color={C.green} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.green, marginTop: 8 }}>{total}</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Total mesures</div>
      </div>

      {/* Clean */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.green}` }}>
        <CheckCircle size={20} color={C.green} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.green, marginTop: 8 }}>{cleanCount}</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Clean</div>
      </div>

      {/* Warning */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.amber}` }}>
        <AlertTriangle size={20} color={C.amber} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.amber, marginTop: 8 }}>{warningCount}</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Warning</div>
      </div>

      {/* Critical */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.red}` }}>
        <AlertCircle size={20} color={C.red} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.red, marginTop: 8 }}>{criticalCount}</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Critical</div>
      </div>

      {/* Tendance ensablement */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.blue}` }}>
        <TrendingUp size={20} color={C.blue} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.blue, marginTop: 8 }}>{trendSoiling}%</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Tendance ensablement</div>
      </div>

      {/* Taux de propreté */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px', borderTop: `3px solid ${C.purple}` }}>
        <Percent size={20} color={C.purple} />
        <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800, color: C.purple, marginTop: 8 }}>{cleanPercentage}%</div>
        <div style={{ fontSize: 11, color: C.text3 }}>Taux de propreté</div>
      </div>
    </div>
  );
}