// components/BackButton.tsx
'use client';
import { ArrowLeft } from 'lucide-react';
import { C } from '@/lib/colors';

interface BackButtonProps {
  onBack: () => void;
}

export default function BackButton({ onBack }: BackButtonProps) {
  return (
    <button
      onClick={onBack}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        color: C.text2,
        fontSize: 12,
        marginBottom: 20,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <ArrowLeft size={14} />
      Retour
    </button>
  );
}