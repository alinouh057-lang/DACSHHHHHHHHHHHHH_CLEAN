// app/(dashboard)/energie/components/VoltageCurrentChart.tsx
'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Gauge } from 'lucide-react';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';
import EmptyState from './EmptyState';

interface VoltageCurrentChartProps {
  data: Array<{
    time: string;
    volt: number;
    curr: number;
  }>;
  height?: number;
}

export default function VoltageCurrentChart({ data, height = 200 }: VoltageCurrentChartProps) {
  const hasNoData = data.length === 0 || data.every(d => d.volt === 0 && d.curr === 0);

  if (hasNoData) {
    return (
      <EmptyState
        icon={Gauge}
        title="Données non disponibles"
        message="Données de tension / courant non disponibles pour cette période"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis
          dataKey="time"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          padding={{ left: 10, right: 10 }}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          yAxisId="left"
          stroke={C.blue}
          tick={{ fontSize: 10 }}
          unit="V"
          domain={[0, 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={C.green}
          tick={{ fontSize: 10 }}
          unit="A"
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="volt"
          stroke={C.blue}
          strokeWidth={2}
          dot={false}
          name="Tension"
          unit="V"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="curr"
          stroke={C.green}
          strokeWidth={2}
          dot={false}
          name="Courant"
          unit="A"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}