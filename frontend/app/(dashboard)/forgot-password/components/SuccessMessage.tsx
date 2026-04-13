// components/SuccessMessage.tsx
'use client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface SuccessMessageProps {
  email: string;
}

export default function SuccessMessage({ email }: SuccessMessageProps) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={60} color={C.green} style={{ marginBottom: 20 }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.green, marginBottom: 15 }}>
        Email envoyé !
      </h2>
      <p style={{ color: C.text2, marginBottom: 10 }}>
        Si un compte existe avec l'adresse <strong>{email}</strong>,
        vous recevrez un email avec les instructions.
      </p>
      <p style={{ color: C.text3, fontSize: 13, marginTop: 20 }}>
        Le lien expirera dans 30 minutes.
      </p>
      <Link href="/login" style={{
        display: 'inline-block',
        marginTop: 20,
        color: C.green,
        textDecoration: 'none',
        fontWeight: 600,
      }}>
        Retour à la connexion
      </Link>
    </div>
  );
}