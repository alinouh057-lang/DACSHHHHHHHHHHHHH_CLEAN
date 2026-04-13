// hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthToken } from '@/lib/api';
import { generateApiKey } from '../utils/profileUtils';

export function useProfile() {
  const { user, updateProfile, logout, isAdmin, isUser, isViewer } = useAuth();
  const router = useRouter();

  // États interface
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'api'>('profile');

  // États mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // États clés API
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Clé publique', key: 'pk_live_abcdefghijklmnopqrstuvwxyz', lastUsed: '14/03/2026', created: '01/01/2026', status: 'active' as const },
    { id: 2, name: 'Clé admin', key: 'sk_live_1234567890abcdefghijklmn', lastUsed: '13/03/2026', created: '01/01/2026', status: 'active' as const },
  ]);

  const [loadingKeys, setLoadingKeys] = useState(false);

  // États préférences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    language: 'fr',
    timezone: 'Europe/Paris',
    twoFactorAuth: false,
  });

  // Données du formulaire
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    github: (user as any)?.github || 'github.com/username',
    twitter: (user as any)?.twitter || '@username',
    linkedin: (user as any)?.linkedin || 'linkedin.com/in/username',
  });

  // Mise à jour editedUser quand user change
  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        github: (user as any)?.github || 'github.com/username',
        twitter: (user as any)?.twitter || '@username',
        linkedin: (user as any)?.linkedin || 'linkedin.com/in/username',
      });
    }
  }, [user]);

  const getRoleColor = () => {
    if (isAdmin) return '#1a7f4f';
    if (isUser) return '#1976d2';
    return '#c47d0e';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrateur';
    if (isUser) return 'Technicien';
    return 'Observateur';
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await updateProfile(editedUser);
    if (success) {
      setMessage({ text: 'Profil mis à jour avec succès', type: 'success' });
      setIsEditing(false);
    } else {
      setMessage({ text: 'Erreur lors de la mise à jour', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSavePreferences = () => {
    setLoading(true);
    setTimeout(() => {
      setMessage({ text: 'Préférences sauvegardées', type: 'success' });
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }, 500);
  };

  const handleGenerateApiKey = () => {
    const name = prompt('Nom de la clé API:');
    if (!name) return;
    
    setLoadingKeys(true);
    setTimeout(() => {
      const newKey = {
        id: Date.now(),
        name,
        key: generateApiKey(),
        lastUsed: 'Jamais',
        created: new Date().toLocaleDateString('fr-FR'),
        status: 'active' as const
      };
      setApiKeys([...apiKeys, newKey]);
      setLoadingKeys(false);
      setMessage({ text: 'Clé API générée avec succès', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }, 500);
  };

  const handleRevokeApiKey = (keyId: number) => {
    if (confirm('Révoquer cette clé API ? Cette action est irréversible.')) {
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      setMessage({ text: 'Clé API révoquée', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setPasswordError('Vous devez être connecté');
        setPasswordLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const data = await response.json();
          if (data.detail) errorMessage = data.detail;
          else if (data.message) errorMessage = data.message;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Une erreur est survenue');
    } finally {
      setPasswordLoading(false);
    }
  };

  return {
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
  };
}