// components/SuccessMessage.tsx
'use client';
import { CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

export default function SuccessMessage() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={60} color={C.green} style={{ marginBottom: 20 }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.green, marginBottom: 15 }}>
        Mot de passe modifié !
      </h2>
      <p style={{ color: C.text2, marginBottom: 20 }}>
        Votre mot de passe a été réinitialisé avec succès.
      </p>
      <p style={{ color: C.text3, fontSize: 13 }}>
        Redirection vers la page de connexion...
      </p>
    </div>
  );
}