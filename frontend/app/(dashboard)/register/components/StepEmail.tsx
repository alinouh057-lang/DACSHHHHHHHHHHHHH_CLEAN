// components/StepEmail.tsx
'use client';
import Link from 'next/link';
import { Mail, Send, Loader } from 'lucide-react';
import { C } from '@/lib/colors';

interface StepEmailProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function StepEmail({ email, setEmail, loading, onSubmit }: StepEmailProps) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>
          Adresse email
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px',
          background: C.surface2,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
        }}>
          <Mail size={18} color={C.text3} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@email.com"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              color: C.text,
            }}
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          border: 'none',
          background: `linear-gradient(135deg, ${C.green}, ${C.green}DD)`,
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
        {loading ? 'Envoi...' : 'Envoyer le code'}
      </button>

      <p style={{
        marginTop: 20,
        fontSize: 12,
        color: C.text3,
        textAlign: 'center',
      }}>
        Déjà un compte ?{' '}
        <Link href="/login" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}