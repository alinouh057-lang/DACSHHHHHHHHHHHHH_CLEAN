// utils/registerUtils.ts

/**
 * Expression régulière pour valider le format d'un email
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide le format d'un email
 * @param email - L'email à valider
 * @returns true si l'email est valide, false sinon
 */
export const isValidEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

/**
 * Valide le champ email
 * @param email - L'email à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Veuillez entrer votre email';
  }
  if (!isValidEmail(email)) {
    return "Format d'email invalide";
  }
  return null;
};

/**
 * Valide le nom complet
 * @param name - Le nom à valider
 * @returns Un message d'erreur ou null si valide
 */
export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Veuillez entrer votre nom';
  }
  return null;
};

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
 * Valide le code à 6 chiffres
 * @param code - Le tableau de 6 chiffres
 * @returns true si le code est complet
 */
export const isCodeComplete = (code: string[]): boolean => {
  return code.join('').length === 6;
};