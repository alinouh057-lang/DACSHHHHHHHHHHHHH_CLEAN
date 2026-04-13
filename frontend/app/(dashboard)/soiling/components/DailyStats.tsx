// components/DailyStats.tsx
'use client';
import { BarChart3 } from 'lucide-react';
import { C } from '@/lib/colors';

interface DailyStatsProps {
  avgSoiling: number;
  minSoiling: number;
  maxSoiling: number;
  stdDev: string;
}

export default function DailyStats({ avgSoiling, minSoiling, maxSoiling, stdDev }: DailyStatsProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
        <BarChart3 size={14} /> STATISTIQUES QUOTIDIENNES
      </div>

      {/* Grille de 4 indicateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {/* Moyenne */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Moyenne</div>
          <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: C.text }}>
            {avgSoiling.toFixed(1)}<span style={{ fontSize: 12, color: C.text3, marginLeft: 2 }}>%</span>
          </div>
        </div>
        {/* Minimum */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Minimum</div>
          <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: C.green }}>
            {minSoiling.toFixed(1)}<span style={{ fontSize: 12, color: C.text3, marginLeft: 2 }}>%</span>
          </div>
        </div>
        {/* Maximum */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Maximum</div>
          <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: C.red }}>
            {maxSoiling.toFixed(1)}<span style={{ fontSize: 12, color: C.text3, marginLeft: 2 }}>%</span>
          </div>
        </div>
        {/* Écart-type */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Écart-type</div>
          <div style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: C.amber }}>
            {stdDev}<span style={{ fontSize: 12, color: C.text3, marginLeft: 2 }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}