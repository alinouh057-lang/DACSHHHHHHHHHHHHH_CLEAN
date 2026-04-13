// hooks/useLogin.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { validateForm } from '../utils/loginUtils';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Compte à rebours après connexion réussie
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (success) {
      if (redirectCountdown > 0) {
        timer = setTimeout(() => {
          setRedirectCountdown(redirectCountdown - 1);
        }, 1000);
      } else {
        router.push('/');
      }
    }
    
    return () => clearTimeout(timer);
  }, [success, redirectCountdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    // Validation des champs
    const validationError = validateForm(email, password);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    
    // Tentative de connexion
    const loginSuccess = await login(email, password);
    
    if (loginSuccess) {
      setSuccess(true);
      setRedirectCountdown(3);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    success,
    error: localError || error,
    redirectCountdown,
    handleSubmit,
  };
}