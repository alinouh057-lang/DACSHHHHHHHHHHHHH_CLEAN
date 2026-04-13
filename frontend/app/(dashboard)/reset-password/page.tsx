// app/reset-password/page.tsx
'use client';

/**
 * ============================================================
 * PAGE DE RÉINITIALISATION DE MOT DE PASSE - PV MONITOR
 * ============================================================
 * Cette page permet à l'utilisateur de réinitialiser son mot de passe
 * après avoir cliqué sur le lien reçu par email.
 * 
 * Fonctionnalités :
 * - Récupération du token depuis l'URL
 * - Validation du token
 * - Saisie du nouveau mot de passe (avec confirmation)
 * - Appel API pour la réinitialisation
 * - Redirection vers la page de connexion après succès
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { Suspense } from 'react';
import { Loader } from 'lucide-react';
import { C } from '@/lib/colors';

// Composants
import ResetPasswordHeader from './components/ResetPasswordHeader';
import ResetPasswordForm from './components/ResetPasswordForm';

// ============================================================
// COMPOSANT PRINCIPAL (AVEC SUSPENSE)
// ============================================================
export default function ResetPasswordPage() {
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
        <ResetPasswordHeader />

        {/* SUSPENSE POUR LE FORMULAIRE (NÉCESSAIRE POUR useSearchParams) */}
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader size={40} className="spin" color={C.green} />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
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