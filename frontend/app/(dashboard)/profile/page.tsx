// app/(dashboard)/profile/page.tsx
'use client';

/**
 * ============================================================
 * PAGE DE PROFIL UTILISATEUR - PV MONITOR
 * ============================================================
 * Cette page permet à l'utilisateur de gérer son profil :
 * - Informations personnelles (nom, email, bio, etc.)
 * - Sécurité du compte (mot de passe, 2FA, sessions)
 * - Préférences utilisateur (thème, notifications, langue)
 * - Journal d'activité
 * - Gestion des clés API
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import ProtectedRoute from '@/components/ProtectedRoute';
import { C } from '@/lib/colors';

// Composants
import ProfileHeader from './components/ProfileHeader';
import StatusMessage from './components/StatusMessage';
import ProfileTabs from './components/ProfileTabs';
import AvatarSection from './components/AvatarSection';
import PersonalInfoForm from './components/PersonalInfoForm';
import SocialLinks from './components/SocialLinks';
import ChangePasswordModal from './components/ChangePasswordModal';
import PreferencesTab from './components/PreferencesTab';
import ApiKeysTab from './components/ApiKeysTab';

// Hook
import { useProfile } from './hooks/useProfile';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ProfilePage() {
  // ==========================================================
  // HOOK
  // ==========================================================
  const {
    user,
    isEditing,
    setIsEditing,
    loading,
    message,
    copied,
    activeTab,
    setActiveTab,
    showPasswordModal,
    setShowPasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordLoading,
    passwordError,
    passwordSuccess,
    apiKeys,
    loadingKeys,
    preferences,
    setPreferences,
    editedUser,
    setEditedUser,
    getRoleColor,
    getRoleLabel,
    handleSave,
    handleSavePreferences,
    handleGenerateApiKey,
    handleRevokeApiKey,
    handleCopyKey,
    handleChangePassword,
  } = useProfile();

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleInputChange = (field: string, value: string) => {
    setEditedUser({ ...editedUser, [field]: value });
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences({ ...preferences, [key]: value });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
      github: (user as any)?.github || 'github.com/username',
      twitter: (user as any)?.twitter || '@username',
      linkedin: (user as any)?.linkedin || 'linkedin.com/in/username',
    });
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <ProtectedRoute>
      <div>
        {/* EN-TÊTE */}
        <ProfileHeader
          isEditing={isEditing}
          loading={loading}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          getRoleColor={getRoleColor}
        />

        {/* MESSAGE DE STATUT */}
        <StatusMessage message={message} />

        {/* ONGLETS DE NAVIGATION */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} getRoleColor={getRoleColor} />

        {/* -------------------------------------------------- */}
        {/* TAB 1 : PROFIL */}
        {/* -------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 24,
          }}>
            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
              <AvatarSection
                name={user?.name || ''}
                roleLabel={getRoleLabel()}
                roleColor={getRoleColor()}
                isEditing={isEditing}
                getRoleColor={getRoleColor}
              />
              <PersonalInfoForm
                isEditing={isEditing}
                editedUser={editedUser}
                user={user}
                onInputChange={handleInputChange}
              />
            </div>
            <SocialLinks
              isEditing={isEditing}
              editedUser={editedUser}
              onInputChange={handleInputChange}
            />
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 2 : SÉCURITÉ */}
        {/* -------------------------------------------------- */}
        {activeTab === 'security' && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>
              Sécurité du compte
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* MOT DE PASSE */}
              <div style={{ padding: 16, background: C.surface2, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Mot de passe</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                      Dernière modification : il y a 30 jours
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 3 : PRÉFÉRENCES */}
        {/* -------------------------------------------------- */}
        {activeTab === 'preferences' && (
          <PreferencesTab
            preferences={preferences}
            onPreferenceChange={handlePreferenceChange}
            onSave={handleSavePreferences}
            loading={loading}
          />
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 4 : CLÉS API */}
        {/* -------------------------------------------------- */}
        {activeTab === 'api' && (
          <ApiKeysTab
            apiKeys={apiKeys}
            loading={loadingKeys}
            onGenerate={handleGenerateApiKey}
            onRevoke={handleRevokeApiKey}
            onCopy={handleCopyKey}
            copied={copied}
          />
        )}

        {/* MODAL CHANGEMENT MOT DE PASSE */}
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={passwordLoading}
          error={passwordError}
          success={passwordSuccess}
          onSubmit={handleChangePassword}
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </ProtectedRoute>
  );
}