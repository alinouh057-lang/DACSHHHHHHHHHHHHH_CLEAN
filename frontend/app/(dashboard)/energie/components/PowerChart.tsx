// app/(dashboard)/energie/components/PowerChart.tsx
'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Zap } from 'lucide-react';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';
import LegendDot from './LegendDot';
import EmptyState from './EmptyState';

interface PowerChartProps {
  data: Array<{
    time: string;
    power: number;
    pth: number;
    loss: number;
  }>;
  loading?: boolean;
  height?: number;
}

export default function PowerChart({ data, loading = false, height = 280 }: PowerChartProps) {
  const hasNoData = data.length === 0 || data.every(d => d.power === 0 && d.pth === 0);

  if (hasNoData) {
    return (
      <EmptyState
        icon={Zap}
        title="Aucune donnée disponible"
        message={loading ? 'Chargement en cours…' : 'Aucune mesure dans la période sélectionnée'}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis
          dataKey="time"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          tickMargin={8}
        />
        <YAxis
          yAxisId="left"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          unit="W"
          domain={[0, 'auto']}
          tickMargin={8}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          content={() => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <LegendDot color={C.green} label="Réelle" />
              <LegendDot color={C.blue} label="Théorique" dashed />
              <LegendDot color={C.amber} label="Perte" />
            </div>
          )}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="loss"
          fill={C.amber}
          fillOpacity={0.3}
          stroke={C.amber}
          strokeWidth={1}
          name="Perte"
          unit="W"
          isAnimationActive={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="power"
          stroke={C.green}
          strokeWidth={2.5}
          dot={false}
          name="Puissance réelle"
          unit="W"
          isAnimationActive={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pth"
          stroke={C.blue}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Puissance théorique"
          unit="W"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}