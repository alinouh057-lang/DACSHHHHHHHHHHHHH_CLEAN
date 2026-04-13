// app/login/page.tsx
'use client';

/**
 * ============================================================
 * PAGE DE CONNEXION - PV MONITOR
 * ============================================================
 * Cette page permet aux utilisateurs de s'authentifier :
 * - Formulaire de connexion (email + mot de passe)
 * - Option "Se souvenir de moi"
 * - Gestion des erreurs de connexion
 * - Redirection après connexion réussie
 * - Lien vers mot de passe oublié et inscription
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import Link from 'next/link';
import { C } from '@/lib/colors';

// Composants
import LogoHeader from './components/LogoHeader';
import LoginForm from './components/LoginForm';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';

// Hook
import { useLogin } from './hooks/useLogin';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function LoginPage() {
  // ==========================================================
  // HOOK
  // ==========================================================
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    success,
    error,
    redirectCountdown,
    handleSubmit,
  } = useLogin();

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${C.green}10 0%, ${C.surface2} 100%)`,
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 400,
        width: '100%',
      }}>
        
        {/* LOGO ET TITRE */}
        <LogoHeader />

        {/* CARTE DE CONNEXION */}
        <div style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ padding: 30 }}>
            
            {/* MESSAGES D'INFORMATION */}
            {success && <SuccessMessage redirectCountdown={redirectCountdown} />}
            {error && <ErrorMessage message={error} />}

            {/* FORMULAIRE DE CONNEXION */}
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              loading={loading}
              success={success}
              onSubmit={handleSubmit}
            />

            {/* LIEN D'INSCRIPTION */}
            <p style={{
              marginTop: 20,
              fontSize: 12,
              color: C.text3,
              textAlign: 'center',
            }}>
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                style={{
                  color: C.green,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                S'inscrire
              </Link>
            </p>
          </div>

          {/* FOOTER DE LA CARTE */}
          <div style={{
            padding: '15px 20px',
            background: C.surface2,
            borderTop: `1px solid ${C.border}`,
            fontSize: 11,
            color: C.text3,
            textAlign: 'center',
          }}>
            © 2026 PV Monitor · Version 1.0.0
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}