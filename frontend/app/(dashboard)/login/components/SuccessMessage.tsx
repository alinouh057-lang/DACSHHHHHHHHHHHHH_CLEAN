// components/SuccessMessage.tsx
'use client';
import { CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface SuccessMessageProps {
  redirectCountdown: number;
}

export default function SuccessMessage({ redirectCountdown }: SuccessMessageProps) {
  return (
    <div style={{
      marginBottom: 20,
      padding: '12px 16px',
      borderRadius: 8,
      background: C.greenL,
      color: C.green,
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={16} />
        Connexion réussie !
      </div>
      <span style={{
        background: C.green,
        color: 'white',
        padding: '2px 8px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
      }}>
        {redirectCountdown}s
      </span>
    </div>
  );
}