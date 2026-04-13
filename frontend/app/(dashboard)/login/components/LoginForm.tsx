// components/LoginForm.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  success: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  success,
  onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      
      {/* Champ EMAIL */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          fontSize: 12,
          color: C.text3,
          display: 'block',
          marginBottom: 6,
        }}>
          Email
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
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
            disabled={success}
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

      {/* Champ MOT DE PASSE */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          fontSize: 12,
          color: C.text3,
          display: 'block',
          marginBottom: 6,
        }}>
          Mot de passe
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
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
            disabled={success}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              color: C.text,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.text3,
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* OPTIONS DE CONNEXION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
      }}>
        {/* Checkbox "Se souvenir de moi" */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: 12, color: C.text2 }}>Se souvenir de moi</span>
        </label>
        
        {/* Lien "Mot de passe oublié" */}
        <Link
          href="/forgot-password"
          style={{
            fontSize: 12,
            color: C.green,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {/* BOUTON DE CONNEXION */}
      <button
        type="submit"
        disabled={loading || success}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          border: 'none',
          background: `linear-gradient(135deg, ${C.green}, ${C.green}DD)`,
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || success ? 'wait' : 'pointer',
          opacity: loading || success ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: `0 4px 10px ${C.green}40`,
        }}
      >
        {loading ? (
          <Loader size={18} className="spin" />
        ) : success ? (
          <CheckCircle size={18} />
        ) : (
          <LogIn size={18} />
        )}
        {loading ? 'Connexion...' : success ? 'Redirection...' : 'Se connecter'}
      </button>
    </form>
  );
}