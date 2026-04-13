// components/ChangePasswordModal.tsx
'use client';
import { Loader, AlertCircle, CheckCircle, X } from 'lucide-react';
import { C } from '@/lib/colors';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
  onSubmit: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  success,
  onSubmit,
}: ChangePasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: C.surface,
        borderRadius: 14,
        padding: 24,
        width: 400,
        maxWidth: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>
          Changer le mot de passe
        </h3>

        {/* Message de succès */}
        {success && (
          <div style={{
            background: C.greenL,
            color: C.green,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle size={16} />
            Mot de passe modifié avec succès !
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div style={{
            background: C.redL,
            color: C.red,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
              Minimum 8 caractères, avec majuscule, minuscule et chiffre
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text2,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || success}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? C.surface2 : C.green,
              color: loading ? C.text3 : 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <Loader size={14} className="spin" />
                Modification...
              </>
            ) : (
              'Changer le mot de passe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}