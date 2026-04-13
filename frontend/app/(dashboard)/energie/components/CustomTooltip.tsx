// app/(dashboard)/energie/components/CustomTooltip.tsx
'use client';

import { C } from '@/lib/colors';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 12,
        boxShadow: '0 4px 16px rgba(13,82,52,.10)',
      }}
    >
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div
          key={`${p.name}-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2,
            color: p.color,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: <b>{p.value?.toFixed(1)}{p.unit}</b>
        </div>
      ))}
    </div>
  );
}