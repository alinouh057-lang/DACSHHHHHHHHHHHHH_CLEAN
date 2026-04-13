// components/RegisterLogo.tsx
'use client';
import { Mail, KeyRound, UserPlus } from 'lucide-react';
import { C } from '@/lib/colors';

type Step = 'email' | 'code' | 'password';

interface RegisterLogoProps {
  step: Step;
}

export default function RegisterLogo({ step }: RegisterLogoProps) {
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
        {step === 'email' && <Mail size={40} color="white" />}
        {step === 'code' && <KeyRound size={40} color="white" />}
        {step === 'password' && <UserPlus size={40} color="white" />}
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text }}>
        {step === 'email' && 'Créer un compte'}
        {step === 'code' && 'Vérification'}
        {step === 'password' && 'Finaliser'}
      </h1>
      <p style={{ fontSize: 14, color: C.text2, marginTop: 5 }}>
        {step === 'email' && 'Entrez votre email pour commencer'}
        {step === 'code' && `Un code a été envoyé`}
        {step === 'password' && 'Choisissez vos identifiants'}
      </p>
    </div>
  );
}