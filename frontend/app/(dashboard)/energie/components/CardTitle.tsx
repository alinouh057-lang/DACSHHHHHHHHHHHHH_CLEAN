// app/(dashboard)/energie/components/CardTitle.tsx
'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface CardTitleProps {
  dot?: string;
  icon: React.ElementType;
  text: string;
  right?: ReactNode;
}

export default function CardTitle({ dot = C.green, icon: Icon, text, right }: CardTitleProps) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        color: C.text3,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
        <Icon size={14} />
        {text}
      </div>
      {right}
    </div>
  );
}