// hooks/useResetPassword.ts
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { validateResetForm } from '../utils/resetPasswordUtils';

export function useResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Vérifie la présence du token
  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const validationError = validateResetForm(token, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.detail || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Affichage d'un loader pendant la vérification du token
  if (!token && !error) {
    return {
      loading: true,
      password,
      setPassword,
      confirmPassword,
      setConfirmPassword,
      error,
      success,
      handleSubmit,
      isLoading: true,
    };
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleSubmit,
    isLoading: false,
  };
}