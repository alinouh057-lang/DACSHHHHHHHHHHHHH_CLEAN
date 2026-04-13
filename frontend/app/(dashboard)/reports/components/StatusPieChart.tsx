// components/StatusPieChart.tsx
'use client';
import { PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C } from '@/lib/colors';

interface StatusPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <PieChartIcon size={16} color={C.purple} />
        Répartition par statut
      </h2>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Légende détaillée avec les valeurs */}
      <div style={{ marginTop: 16 }}>
        {data.map(item => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.text2 }}>{item.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}