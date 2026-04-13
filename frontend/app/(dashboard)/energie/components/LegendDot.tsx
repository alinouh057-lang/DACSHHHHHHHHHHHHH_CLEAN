// app/(dashboard)/energie/components/LegendDot.tsx
'use client';

import { C } from '@/lib/colors';

interface LegendDotProps {
  color: string;
  label: string;
  dashed?: boolean;
}

export default function LegendDot({ color, label, dashed = false }: LegendDotProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          ...(dashed && { background: 'transparent', border: `1.5px dashed ${color}` }),
        }}
      />
      <span style={{ fontSize: 10, color: C.text2 }}>{label}</span>
    </div>
  );
}