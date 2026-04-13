// components/ResetPasswordForm.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, Loader } from 'lucide-react';
import { C } from '@/lib/colors';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';
import { useResetPassword } from '../hooks/useResetPassword';

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleSubmit,
  } = useResetPassword();

  if (success) {
    return <SuccessMessage />;
  }

  return (
    <div style={{
      background: C.surface,
      borderRadius: 20,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      padding: 30,
      border: `1px solid ${C.border}`,
    }}>
      
      <form onSubmit={handleSubmit}>
        
        {/* Message d'erreur */}
        <ErrorMessage message={error} />

        {/* CHAMP : NOUVEAU MOT DE PASSE */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>
            Nouveau mot de passe
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
            <Lock size={18} color={C.text3} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                color: C.text,
              }}
            />
            {/* Bouton afficher/masquer */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={18} color={C.text3} /> : <Eye size={18} color={C.text3} />}
            </button>
          </div>
        </div>

        {/* CHAMP : CONFIRMATION */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>
            Confirmer le mot de passe
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
            <Lock size={18} color={C.text3} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* BOUTON DE SOUMISSION */}
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
          {loading ? <Loader size={18} className="spin" /> : 'Réinitialiser'}
        </button>

        {/* LIEN DE RETOUR VERS LA CONNEXION */}
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
    </div>
  );
}