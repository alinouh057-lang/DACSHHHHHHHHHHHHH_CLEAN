// hooks/useRegister.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode, completeRegistration } from '@/lib/api';
import { validateEmail, validateName, validatePassword, validatePasswordMatch, isCodeComplete } from '../utils/registerUtils';

export type Step = 'email' | 'code' | 'password';

export function useRegister() {
  const router = useRouter();
  
  // État de l'étape
  const [step, setStep] = useState<Step>('email');
  
  // Étape 1 : Email
  const [email, setEmail] = useState('');
  
  // Étape 2 : Code
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Étape 3 : Mot de passe
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États communs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tempToken, setTempToken] = useState('');

  // Gestion du compte à rebours
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'code' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Étape 1 : Envoi du code
  const handleSendCode = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await sendVerificationCode(email);
      if (result) {
        setStep('code');
        setCountdown(60);
        setCanResend(false);
        setError('');
      } else {
        setError('Erreur lors de l\'envoi du code');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (!isCodeComplete(code)) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await verifyCode(email, fullCode);
      if (result?.verified) {
        setTempToken(result.temp_token || '');
        setStep('password');
      } else {
        setError('Code invalide');
        setCode(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Renvoi du code
  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await sendVerificationCode(email);
      if (result) {
        setCountdown(60);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
      } else {
        setError('Erreur lors du renvoi');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : Création du compte
  const handleCompleteRegistration = async () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setError(matchError);
      return;
    }
    
    setLoading(true);
    setError('');
    
    const fullCode = code.join('');
    
    try {
      const result = await completeRegistration(email, fullCode, name, password, tempToken);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError('Erreur lors de la création du compte');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Navigation arrière
  const goBack = () => {
    if (step === 'code') {
      setStep('email');
      setCode(['', '', '', '', '', '']);
    } else if (step === 'password') {
      setStep('code');
      setName('');
      setPassword('');
      setConfirmPassword('');
    }
    setError('');
  };

  return {
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
  };
}