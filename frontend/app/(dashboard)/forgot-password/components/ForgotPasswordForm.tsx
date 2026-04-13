// components/ForgotPasswordForm.tsx
'use client';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, Loader, AlertCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ForgotPasswordForm({
  email,
  setEmail,
  loading,
  error,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={onSubmit}>
      
      {/* AFFICHAGE DES ERREURS */}
      {error && (
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
          {error}
        </div>
      )}

      {/* CHAMP EMAIL */}
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

      {/* BOUTON D'ENVOI */}
      <button
        type="submit"
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
          marginBottom: 20,
        }}
      >
        {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
        {loading ? 'Envoi...' : 'Envoyer le lien'}
      </button>

      {/* LIEN DE RETOUR */}
      <Link href="/login" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        color: C.text2,
        textDecoration: 'none',
        fontSize: 13,
      }}>
        <ArrowLeft size={14} />
        Retour à la connexion
      </Link>
    </form>
  );
}