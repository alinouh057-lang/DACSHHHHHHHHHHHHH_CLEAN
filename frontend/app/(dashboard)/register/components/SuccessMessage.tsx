// components/SuccessMessage.tsx
'use client';
import { CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

export default function SuccessMessage() {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <CheckCircle size={60} color={C.green} style={{ marginBottom: 20 }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.green, marginBottom: 10 }}>
        Compte créé !
      </h2>
      <p style={{ color: C.text2, marginBottom: 20 }}>
        Vous allez être redirigé...
      </p>
    </div>
  );
}