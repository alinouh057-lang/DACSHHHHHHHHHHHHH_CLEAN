// components/DateRangeSelector.tsx
'use client';
import { C } from '@/lib/colors';

interface DateRangeSelectorProps {
  value: '7d' | '30d' | '90d';
  onChange: (value: '7d' | '30d' | '90d') => void;
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: 'var(--surface)',
        color: C.text,
        fontSize: 13,
      }}
    >
      <option value="7d">7 derniers jours</option>
      <option value="30d">30 derniers jours</option>
      <option value="90d">3 derniers mois</option>
    </select>
  );
}