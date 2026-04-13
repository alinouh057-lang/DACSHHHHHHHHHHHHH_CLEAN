// components/ChartsSection.tsx
'use client';
import { Calendar, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';

interface ChartsSectionProps {
  chartData: Array<{ day: string; count: number; soiling: number; power: number }>;
  trendSoiling: string;
  trendPower: string;
}

export default function ChartsSection({ chartData, trendSoiling, trendPower }: ChartsSectionProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      {/* GRAPHIQUE : ANALYSES PAR JOUR */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
            <Calendar size={14} /> ANALYSES PAR JOUR
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: parseFloat(trendSoiling) > 0 ? C.red : C.green }}>
              {parseFloat(trendSoiling) > 0 ? '↗' : '↘'} {Math.abs(parseFloat(trendSoiling))}%
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" stroke={C.text3} tick={{ fontSize: 10 }} padding={{ left: 10, right: 10 }} />
            <YAxis yAxisId="l" stroke={C.green} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.amber} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="count" fill={C.green} name="Analyses" radius={[4,4,0,0]} />
            <Line yAxisId="r" type="monotone" dataKey="soiling" stroke={C.amber} strokeWidth={2} name="Ensablement moy." unit="%" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* GRAPHIQUE : PUISSANCE JOURNALIÈRE */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }} />
            <Zap size={14} /> PUISSANCE JOURNALIÈRE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: parseFloat(trendPower) > 0 ? C.green : C.red }}>
              {parseFloat(trendPower) > 0 ? '↗' : '↘'} {Math.abs(parseFloat(trendPower))}%
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" stroke={C.text3} tick={{ fontSize: 10 }} padding={{ left: 10, right: 10 }} />
            <YAxis stroke={C.text3} tick={{ fontSize: 10 }} unit="W" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="power" stroke={C.blue} strokeWidth={2} fill="url(#colorPower)" name="Puissance moy." unit="W" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}