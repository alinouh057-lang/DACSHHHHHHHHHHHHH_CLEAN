// app/(dashboard)/energie/components/Card.tsx
'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: '0 1px 3px rgba(13,82,52,.06), 0 4px 16px rgba(13,82,52,.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}