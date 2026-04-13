// components/KPICards.tsx
'use client';
import { C } from '@/lib/colors';

interface KPICardsProps {
  total: number;
  avgPower: number;
  avgSoiling: number;
  cleanPercentage: number;
}

export default function KPICards({ total, avgPower, avgSoiling, cleanPercentage }: KPICardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
      
      {/* Carte : Total mesures */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Total mesures</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{total || 0}</div>
      </div>

      {/* Carte : Puissance moyenne */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Puissance moyenne</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
          {avgPower?.toFixed(0) || 0} <span style={{ fontSize: 14, color: C.text2 }}>W</span>
        </div>
      </div>

      {/* Carte : Ensablement moyen */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Ensablement moyen</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
          {avgSoiling?.toFixed(1) || 0} <span style={{ fontSize: 14, color: C.text2 }}>%</span>
        </div>
      </div>

      {/* Carte : Taux de propreté */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>Taux de propreté</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
          {cleanPercentage}%
        </div>
      </div>
    </div>
  );
}