// utils/resetPasswordUtils.ts

/**
 * Valide le mot de passe
 * @param password - Le mot de passe à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Veuillez entrer un mot de passe';
  }
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }
  return null;
};

/**
 * Vérifie que les mots de passe correspondent
 * @param password - Le mot de passe
 * @param confirmPassword - La confirmation
 * @returns Un message d'erreur ou null si valide
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) {
    return 'Les mots de passe ne correspondent pas';
  }
  return null;
};

/**
 * Valide le formulaire complet
 * @param token - Le token de réinitialisation
 * @param password - Le mot de passe
 * @param confirmPassword - La confirmation
 * @returns Un message d'erreur ou null si valide
 */
export const validateResetForm = (
  token: string | null,
  password: string,
  confirmPassword: string
): string | null => {
  if (!token) {
    return 'Lien de réinitialisation invalide';
  }
  
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;
  
  const matchError = validatePasswordMatch(password, confirmPassword);
  if (matchError) return matchError;
  
  return null;
};