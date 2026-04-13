// components/TypeBadge.tsx
'use client';
import { Activity } from 'lucide-react';
import { typeLabels, typeIcons } from '../constants/alertsConstants';
import { C } from '@/lib/colors';

interface TypeBadgeProps {
  type: string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span style={{
      background: C.surface2,
      color: C.text2,
      padding: '4px 8px',
      borderRadius: 4,
      fontSize: 10,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {typeIcons[type] || <Activity size={12} />}
      {typeLabels[type] || type}
    </span>
  );
}