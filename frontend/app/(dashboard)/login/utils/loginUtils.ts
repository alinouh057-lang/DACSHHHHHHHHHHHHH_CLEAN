// utils/loginUtils.ts

/**
 * Valide le champ email
 * @param email - L'email à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Veuillez entrer votre email';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format d'email invalide";
  }
  return null;
};

/**
 * Valide le champ mot de passe
 * @param password - Le mot de passe à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Veuillez entrer votre mot de passe';
  }
  return null;
};

/**
 * Valide le formulaire complet
 * @param email - L'email à valider
 * @param password - Le mot de passe à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validateForm = (email: string, password: string): string | null => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;
  
  return null;
};