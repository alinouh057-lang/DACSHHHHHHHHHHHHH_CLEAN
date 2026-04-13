// app/(dashboard)/energie/components/EmptyState.tsx
'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div
      style={{
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.surface2,
        borderRadius: 10,
        color: C.text3,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Icon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>{message}</div>
      </div>
    </div>
  );
}