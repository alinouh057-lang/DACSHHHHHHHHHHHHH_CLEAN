// app/forgot-password/page.tsx
'use client';

/**
 * ============================================================
 * PAGE MOT DE PASSE OUBLIÉ - PV MONITOR
 * ============================================================
 * Cette page permet aux utilisateurs de demander un lien de
 * réinitialisation de mot de passe.
 * 
 * Fonctionnalités :
 * - Formulaire de saisie d'email
 * - Validation du format email
 * - Appel API pour envoyer la demande
 * - Message de succès avec instructions
 * - Gestion des erreurs
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { C } from '@/lib/colors';

// Composants
import LogoHeader from './components/LogoHeader';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import SuccessMessage from './components/SuccessMessage';

// Hook
import { useForgotPassword } from './hooks/useForgotPassword';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ForgotPasswordPage() {
  // ==========================================================
  // HOOK
  // ==========================================================
  const {
    email,
    setEmail,
    loading,
    error,
    success,
    handleSubmit,
  } = useForgotPassword();

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
      <div style={{ maxWidth: 400, width: '100%' }}>
        
        {/* LOGO ET TITRE */}
        <LogoHeader />

        {/* CARTE PRINCIPALE */}
        <div style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          padding: 30,
          border: `1px solid ${C.border}`,
        }}>
          
          {/* AFFICHAGE CONDITIONNEL : SUCCÈS OU FORMULAIRE */}
          {success ? (
            <SuccessMessage email={email} />
          ) : (
            <ForgotPasswordForm
              email={email}
              setEmail={setEmail}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
          )}
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