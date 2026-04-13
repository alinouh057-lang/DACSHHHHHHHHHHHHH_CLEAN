// hooks/useForgotPassword.ts
import { useState } from 'react';
import { forgotPassword } from '@/lib/api';
import { validateEmail } from '../utils/forgotPasswordUtils';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialisation des messages
    setError('');
    
    // Validation du champ email
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Envoi de la demande au serveur
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      
      if (result) {
        setSuccess(true);
      } else {
        setError('Erreur lors de la demande');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    error,
    success,
    handleSubmit,
  };
}