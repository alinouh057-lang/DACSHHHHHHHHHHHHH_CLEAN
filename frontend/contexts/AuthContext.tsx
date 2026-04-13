// frontend/contexts/AuthContext.tsx
'use client';

/**
 * ============================================================
 * CONTEXTE D'AUTHENTIFICATION - PV MONITOR
 * ============================================================
 * Ce contexte gère toute l'authentification de l'application :
 * - Connexion / Déconnexion
 * - Inscription
 * - Gestion de session (token + cookie)
 * - Vérification des permissions par rôle
 * - Synchronisation entre localStorage et cookies
 * 
 * Rôles disponibles :
 * - admin : accès complet
 * - user : accès aux fonctionnalités opérationnelles
 * - viewer : accès en lecture seule
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role, hasPermission, hasRouteAccess } from '@/lib/roles';

// ============================================================
// CONSTANTES
// ============================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// FONCTIONS UTILITAIRES POUR LES COOKIES
// ============================================================

/**
 * Crée un cookie avec expiration
 * @param name - Nom du cookie
 * @param value - Valeur à stocker
 * @param days - Durée de vie en jours (défaut: 7)
 */
const setCookie = (name: string, value: any, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${name}=${encoded};${expires};path=/;SameSite=Lax`;
};

/**
 * Supprime un cookie
 * @param name - Nom du cookie à supprimer
 */
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// ============================================================
// TYPES
// ============================================================

/**
 * Interface du contexte d'authentification
 */
interface AuthContextType {
  user: User | null;                              // Utilisateur connecté (ou null)
  loading: boolean;                               // État de chargement
  error: string | null;                           // Message d'erreur
  login: (email: string, password: string) => Promise<boolean>;     // Connexion
  logout: () => void;                              // Déconnexion
  register: (email: string, password: string, name: string) => Promise<boolean>; // Inscription
  updateProfile: (data: Partial<User>) => Promise<boolean>;         // Mise à jour profil
  hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean; // Vérification permission
  hasRouteAccess: (path: string) => boolean;      // Vérification accès route
  isAdmin: boolean;                                // Est-ce un admin ?
  isUser: boolean;                                 // Est-ce un user ?
  isViewer: boolean;                               // Est-ce un viewer ?
}

// ============================================================
// CRÉATION DU CONTEXTE
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER D'AUTHENTIFICATION
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [user, setUser] = useState<User | null>(null); // Utilisateur connecté
  const [loading, setLoading] = useState(true);         // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const router = useRouter();

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Vérifie la session au chargement de l'application
   * Priorité :
   * 1. Cookie pv_user (pour le middleware/proxy)
   * 2. Token localStorage
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        // ====================================================
        // ÉTAPE 1 : Vérifier le cookie
        // ====================================================
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, ...rest] = cookie.trim().split('=');
  acc[key.trim()] = rest.join('=');
  return acc;
}, {} as Record<string, string>);

// Et pour parser le cookie :
if (cookies.pv_user) {
  try {
    const userData = JSON.parse(decodeURIComponent(cookies.pv_user));
    setUser(userData);
    setLoading(false);
    return;
  } catch (e) {
    deleteCookie('pv_user');
  }
}
        // ====================================================
        // ÉTAPE 2 : Vérifier le token localStorage
        // ====================================================
        const token = localStorage.getItem('auth_token');
           if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem('auth_token');
      setUser(null);
      setLoading(false);
      return;
    }
        if (token) {
          const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            // Synchroniser avec cookie pour le middleware/proxy
            setCookie('pv_user', userData);
          } else {
            // Token invalide → nettoyage
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ==========================================================
  // FONCTIONS D'AUTHENTIFICATION
  // ==========================================================

  /**
   * Connexion de l'utilisateur
   * @param email - Email ou nom d'utilisateur
   * @param password - Mot de passe
   * @returns true si succès, false sinon
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📤 Tentative login pour:', email);
      console.log('📤 URL:', `${API_BASE}/api/v1/auth/login`);
      
      // ====================================================
      // ÉTAPE 1 : Requête de login
      // ====================================================
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarde du token
        localStorage.setItem('auth_token', data.access_token);
        
        // ====================================================
        // ÉTAPE 2 : Récupération des informations utilisateur
        // ====================================================
        const userResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Mise à jour du state
          setUser(userData);
          
          // Création du cookie pour le middleware/proxy
          setCookie('pv_user', userData);
          
          console.log('✅ Connexion réussie pour:', email);
          setLoading(false);
          return true;
        }
      }
      
      setError(data.detail || data.message || 'Email ou mot de passe incorrect');
      setLoading(false);
      return false;
      
    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      setError('Erreur de connexion au serveur');
      setLoading(false);
      return false;
    }
  };

  /**
   * Déconnexion de l'utilisateur
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Appel API de déconnexion
        await fetch(`${API_BASE}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    } finally {
      // Nettoyage des données locales
      localStorage.removeItem('auth_token');
      deleteCookie('pv_user');
      setUser(null);
      router.push('/login');
    }
  };

  /**
   * Inscription d'un nouvel utilisateur
   * @param email - Email
   * @param password - Mot de passe
   * @param name - Nom complet
   * @returns true si succès, false sinon
   */
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarde du token
        localStorage.setItem('auth_token', data.access_token);
        
        // Récupération des informations utilisateur
        const userResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          setCookie('pv_user', userData);
          setLoading(false);
          return true;
        }
      }
      
      setError(data.message || "Erreur lors de l'inscription");
      setLoading(false);
      return false;
      
    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      setError('Erreur de connexion au serveur');
      setLoading(false);
      return false;
    }
  };

  /**
   * Mise à jour du profil utilisateur
   * @param data - Données à mettre à jour
   * @returns true si succès, false sinon
   */
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        // Mise à jour du cookie
        setCookie('pv_user', updatedUser);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
      
    } catch (err) {
      console.error('❌ Erreur mise à jour profil:', err);
      setError('Erreur de mise à jour');
      setLoading(false);
      return false;
    }
  };

  // ==========================================================
  // FONCTIONS DE VÉRIFICATION DES PERMISSIONS
  // ==========================================================

  /**
   * Vérifie si l'utilisateur a la permission sur une ressource
   * @param resource - Ressource concernée
   * @param action - Action à effectuer
   * @returns true si autorisé, false sinon
   */
  const checkPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
    return hasPermission(user, resource, action);
  };

  /**
   * Vérifie si l'utilisateur a accès à une route
   * @param path - Chemin de la route
   * @returns true si autorisé, false sinon
   */
  const checkRouteAccess = (path: string) => {
    return hasRouteAccess(user, path);
  };

  // ==========================================================
  // VALEUR DU CONTEXTE
  // ==========================================================
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    hasPermission: checkPermission,
    hasRouteAccess: checkRouteAccess,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isViewer: user?.role === 'viewer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// HOOK PERSONNALISÉ POUR UTILISER LE CONTEXTE
// ============================================================

/**
 * Hook pour accéder au contexte d'authentification
 * @returns Le contexte d'authentification
 * @throws Error si utilisé en dehors d'un AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}