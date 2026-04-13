// components/EvolutionChart.tsx
'use client';
import { BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C } from '@/lib/colors';

interface EvolutionChartProps {
  data: Array<{ day: string; count: number; soiling: number; power: number }>;
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={16} color={C.blue} />
          Évolution de l'ensablement
        </h2>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" stroke={C.text2} />
            <YAxis stroke={C.text2} unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="soiling" stroke={C.amber} name="Ensablement" unit="%" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}