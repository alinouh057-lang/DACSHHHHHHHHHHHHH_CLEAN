// components/StepPassword.tsx
'use client';
import { useState } from 'react';
import { User, Lock, Eye, EyeOff, UserPlus, Loader } from 'lucide-react';
import { C } from '@/lib/colors';

interface StepPasswordProps {
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function StepPassword({
  name,
  setName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  onSubmit,
}: StepPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {/* Champ : Nom complet */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>
          Nom complet
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
          <User size={18} color={C.text3} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
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

      {/* Champ : Mot de passe */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>
          Mot de passe
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={18} color={C.text3} /> : <Eye size={18} color={C.text3} />}
          </button>
        </div>
      </div>

      {/* Champ : Confirmation du mot de passe */}
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
        {loading ? <Loader size={18} className="spin" /> : <UserPlus size={18} />}
        {loading ? 'Création...' : 'Créer mon compte'}
      </button>
    </div>
  );
}