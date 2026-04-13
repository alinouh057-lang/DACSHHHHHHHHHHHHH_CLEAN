// components/ErrorMessage.tsx
'use client';
import { AlertCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div style={{
      marginBottom: 20,
      padding: '12px',
      background: C.redL,
      color: C.red,
      borderRadius: 8,
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <AlertCircle size={16} />
      {message}
    </div>
  );
}