// components/StepCode.tsx
'use client';
import { useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { C } from '@/lib/colors';
import { isCodeComplete } from '../utils/registerUtils';

interface StepCodeProps {
  email: string;
  code: string[];
  setCode: (code: string[]) => void;
  loading: boolean;
  countdown: number;
  canResend: boolean;
  onVerify: () => void;
  onResend: () => void;
}

export default function StepCode({
  email,
  code,
  setCode,
  loading,
  countdown,
  canResend,
  onVerify,
  onResend,
}: StepCodeProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Réinitialiser les références
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, textAlign: 'center' }}>
        Un code a été envoyé à {email}
      </p>

      {/* Champs pour le code à 6 chiffres */}
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            style={{
              width: 45,
              height: 45,
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 600,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: digit ? C.greenL : C.surface2,
            }}
          />
        ))}
      </div>

      <button
        onClick={onVerify}
        disabled={loading || !isCodeComplete(code)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          border: 'none',
          background: isCodeComplete(code) ? C.green : C.surface2,
          color: isCodeComplete(code) ? 'white' : C.text2,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || !isCodeComplete(code) ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: 15,
        }}
      >
        {loading ? <Loader size={18} className="spin" /> : 'Vérifier le code'}
      </button>

      {/* Compte à rebours et bouton de renvoi */}
      <div style={{ textAlign: 'center' }}>
        {canResend ? (
          <button
            onClick={onResend}
            style={{
              background: 'none',
              border: 'none',
              color: C.green,
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Renvoyer le code
          </button>
        ) : (
          <span style={{ fontSize: 12, color: C.text3 }}>
            Code valide pendant {countdown} secondes
          </span>
        )}
      </div>
    </div>
  );
}