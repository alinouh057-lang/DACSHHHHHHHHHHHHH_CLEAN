// components/StatusMessage.tsx
'use client';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface StatusMessageProps {
  message: { text: string; type: 'success' | 'error' } | null;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;
  
  return (
    <div style={{
      marginBottom: 20,
      padding: '12px 16px',
      borderRadius: 8,
      background: message.type === 'success' ? C.greenL : C.redL,
      color: message.type === 'success' ? C.green : C.red,
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    }}>
      {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message.text}
    </div>
  );
}