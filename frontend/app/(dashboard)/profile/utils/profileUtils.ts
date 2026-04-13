// utils/profileUtils.ts

/**
 * Valide le mot de passe
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Le mot de passe est requis';
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
  return null;
};

/**
 * Vérifie que les mots de passe correspondent
 */
export const passwordsMatch = (password: string, confirm: string): boolean => {
  return password === confirm;
};

/**
 * Formate une clé API pour l'affichage (masque les caractères centraux)
 */
export const formatApiKey = (key: string, show: boolean): string => {
  if (show) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
};

/**
 * Génère une clé API aléatoire
 */
export const generateApiKey = (): string => {
  return `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 8)}`;
};