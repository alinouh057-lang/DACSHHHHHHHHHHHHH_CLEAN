// components/TimeRangeSelector.tsx
'use client';
import { C } from '@/lib/colors';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: '90d', label: '3 mois' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4, background: C.surface2, borderRadius: 6, padding: 2 }}>
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onChange(range.id)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            background: value === range.id ? C.green : 'transparent',
            color: value === range.id ? 'white' : C.text2,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}