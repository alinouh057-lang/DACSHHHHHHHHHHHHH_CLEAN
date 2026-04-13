// app/register/page.tsx
'use client';

/**
 * ============================================================
 * PAGE D'INSCRIPTION - PV MONITOR
 * ============================================================
 * Cette page gère l'inscription en 3 étapes :
 * 
 * ÉTAPE 1 - EMAIL : Saisie de l'email et envoi du code de vérification
 * ÉTAPE 2 - CODE : Vérification du code à 6 chiffres reçu par email
 * ÉTAPE 3 - MOT DE PASSE : Création du compte avec nom et mot de passe
 * 
 * Le flux complet :
 * 1. L'utilisateur entre son email → envoi d'un code
 * 2. L'utilisateur entre le code reçu → vérification
 * 3. L'utilisateur crée son compte (nom + mot de passe) → redirection vers le dashboard
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { C } from '@/lib/colors';

// Composants
import RegisterLogo from './components/RegisterLogo';
import BackButton from './components/BackButton';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import StepEmail from './components/StepEmail';
import StepCode from './components/StepCode';
import StepPassword from './components/StepPassword';

// Hook
import { useRegister } from './hooks/useRegister';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function RegisterPage() {
  // ==========================================================
  // HOOK
  // ==========================================================
  const {
    step,
    email,
    setEmail,
    code,
    setCode,
    countdown,
    canResend,
    name,
    setName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleSendCode,
    handleVerifyCode,
    handleResendCode,
    handleCompleteRegistration,
    goBack,
  } = useRegister();

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
        <RegisterLogo step={step} />

        {/* CARTE PRINCIPALE */}
        <div style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          padding: 30,
          border: `1px solid ${C.border}`,
        }}>
          
          {/* ÉTAT DE SUCCÈS (COMPTE CRÉÉ) */}
          {success ? (
            <SuccessMessage />
          ) : (
            <>
              {/* BOUTON RETOUR (sauf étape 1) */}
              {step !== 'email' && <BackButton onBack={goBack} />}

              {/* MESSAGE D'ERREUR */}
              <ErrorMessage message={error} />

              {/* ÉTAPE 1 : SAISIE DE L'EMAIL */}
              {step === 'email' && (
                <StepEmail
                  email={email}
                  setEmail={setEmail}
                  loading={loading}
                  onSubmit={handleSendCode}
                />
              )}

              {/* ÉTAPE 2 : SAISIE DU CODE DE VÉRIFICATION */}
              {step === 'code' && (
                <StepCode
                  email={email}
                  code={code}
                  setCode={setCode}
                  loading={loading}
                  countdown={countdown}
                  canResend={canResend}
                  onVerify={handleVerifyCode}
                  onResend={handleResendCode}
                />
              )}

              {/* ÉTAPE 3 : CRÉATION DU COMPTE (MOT DE PASSE) */}
              {step === 'password' && (
                <StepPassword
                  name={name}
                  setName={setName}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  loading={loading}
                  onSubmit={handleCompleteRegistration}
                />
              )}
            </>
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