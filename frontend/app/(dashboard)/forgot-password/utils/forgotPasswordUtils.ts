// utils/forgotPasswordUtils.ts

/**
 * Expression régulière pour valider le format d'un email
 * Vérifie la présence d'un @ et d'un point après le @
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
 * Valide le champ email (non vide + format correct)
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