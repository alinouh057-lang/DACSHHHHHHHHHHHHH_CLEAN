// app/(dashboard)/energie/components/KpiCard.tsx
'use client';

import { C } from '@/lib/colors';

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accentColor: string;
}

export default function KpiCard({ icon: Icon, label, value, unit, accentColor }: KpiCardProps) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(13,82,52,.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: '14px 14px 0 0',
        }}
      />
      <div style={{ fontSize: 20, marginBottom: 10 }}>
        <Icon size={24} color={accentColor} />
      </div>
      <div>
        <span
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 26,
            fontWeight: 800,
            color: C.text,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{label}</div>
    </div>
  );
}