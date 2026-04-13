// components/LogoHeader.tsx
'use client';
import { Mail } from 'lucide-react';
import { C } from '@/lib/colors';

export default function LogoHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 30 }}>
      <div style={{
        width: 70,
        height: 70,
        background: `linear-gradient(135deg, ${C.green}, ${C.green}DD)`,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 15px',
        boxShadow: `0 10px 20px ${C.green}30`,
      }}>
        <Mail size={40} color="white" />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
        Mot de passe oublié ?
      </h1>
      <p style={{ fontSize: 14, color: C.text2, marginTop: 5 }}>
        Entrez votre email pour recevoir un lien de réinitialisation
      </p>
    </div>
  );
}