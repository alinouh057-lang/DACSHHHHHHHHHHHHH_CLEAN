// components/EvolutionChart.tsx
'use client';
import { useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';

interface EvolutionChartProps {
  data: Array<{ time: string; soiling: number; confidence: number; date: string }>;
  onRefresh: () => void;
}

export default function EvolutionChart({ data, onRefresh }: EvolutionChartProps) {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
      marginBottom: 20,
    }}>
      {/* En-tête du graphique avec contrôles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber }} />
          <TrendingUp size={14} /> ÉVOLUTION DE L'ENSABLEMENT
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Bouton pour afficher/masquer la confiance */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: showComparison ? C.greenL : 'transparent',
              color: showComparison ? C.green : C.text2,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Afficher confiance
          </button>
          {/* Bouton de rafraîchissement */}
          <button
            onClick={onRefresh}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text2,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RefreshCw size={12} />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorSoiling" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.amber} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis 
            dataKey="time" 
            stroke={C.text3} 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="left"
            stroke={C.text3} 
            tick={{ fontSize: 10 }} 
            unit="%"
            domain={[0, 100]}
          />
          {showComparison && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={C.blue} 
              tick={{ fontSize: 10 }} 
              unit="%"
              domain={[0, 100]}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="soiling" 
            stroke={C.amber} 
            strokeWidth={2.5}
            fill="url(#colorSoiling)" 
            name="Ensablement" 
            unit="%" 
          />
          {showComparison && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="confidence" 
              stroke={C.blue} 
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="Confiance" 
              unit="%" 
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Légende des seuils */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: C.green }} />
          <span style={{ fontSize: 11, color: C.text2 }}>Clean (&lt;30%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: C.amber }} />
          <span style={{ fontSize: 11, color: C.text2 }}>Warning (30-60%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: C.red }} />
          <span style={{ fontSize: 11, color: C.text2 }}>Critical (&gt;60%)</span>
        </div>
      </div>
    </div>
  );
}