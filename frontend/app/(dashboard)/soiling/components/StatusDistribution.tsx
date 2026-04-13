// components/StatusDistribution.tsx
'use client';
import { PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '@/lib/colors';

const COLORS = {
  Clean: C.green,
  Warning: C.amber,
  Critical: C.red,
};

interface StatusDistributionProps {
  data: Array<{ name: string; value: number }>;
  totalCount: number;
}

export default function StatusDistribution({ data, totalCount }: StatusDistributionProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }} />
        <PieChartIcon size={14} /> DISTRIBUTION PAR STATUT
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Camembert */}
        <ResponsiveContainer width="60%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || C.text3} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Légende détaillée */}
        <div style={{ width: '35%' }}>
          {data.map((item, index) => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[item.name as keyof typeof COLORS] || C.text3 }} />
                <span style={{ fontSize: 12, color: C.text2 }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: C.text3 }}>Total mesures</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}