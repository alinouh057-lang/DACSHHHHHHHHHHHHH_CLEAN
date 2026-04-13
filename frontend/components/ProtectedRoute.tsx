// frontend/components/ProtectedRoute.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT PROTECTED ROUTE - PV MONITOR
 * ============================================================
 * Ce composant protège les routes qui nécessitent une authentification.
 * Il vérifie que l'utilisateur est connecté avant d'afficher le contenu.
 * 
 * Fonctionnalités :
 * - Redirection vers /login si non authentifié
 * - Vérification des rôles si requis
 * - Affichage d'un loader pendant la vérification
 * - Hiérarchie des rôles (admin > user > viewer)
 * 
 * Hiérarchie des permissions :
 * - admin : peut accéder à tout
 * - user : peut accéder aux routes 'user' et 'viewer'
 * - viewer : peut accéder uniquement aux routes 'viewer'
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface des propriétés du composant ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode;                 // Le contenu à protéger
  requiredRole?: 'admin' | 'user' | 'viewer'; // Rôle requis (optionnel)
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  // ==========================================================
  // CONTEXTES ET HOOKS
  // ==========================================================
  const { user, loading } = useAuth(); // État d'authentification
  const router = useRouter();

  // ==========================================================
  // EFFETS DE BORD (VÉRIFICATION ET REDIRECTION)
  // ==========================================================

  useEffect(() => {
    // ========================================================
    // CAS 1 : Non authentifié
    // ========================================================
    if (!loading && !user) {
      router.push('/login'); // Redirection vers la page de connexion
    }
    
    // ========================================================
    // CAS 2 : Authentifié mais rôle insuffisant
    // ========================================================
    else if (!loading && user && requiredRole) {
      // Définition des rôles autorisés par niveau
      const roles = {
        admin: ['admin'],                 // Admin peut voir admin uniquement
        user: ['admin', 'user'],          // User peut voir admin et user
        viewer: ['admin', 'user', 'viewer'], // Viewer peut tout voir
      };
      
      // Si l'utilisateur n'a pas le rôle requis
      if (!roles[requiredRole].includes(user.role)) {
        router.push('/'); // Redirection vers le dashboard
      }
    }
  }, [user, loading, router, requiredRole]);

  // ==========================================================
  // RENDU CONDITIONNEL
  // ==========================================================

  /**
   * Pendant le chargement : affiche un spinner
   */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 12,
      }}>
        <Loader size={36} className="spin" color={C.green} />
        <span style={{ color: C.text3, fontSize: 13 }}>
          Vérification de l'authentification...
        </span>
      </div>
    );
  }

  /**
   * Si non authentifié : ne rien afficher (la redirection a déjà eu lieu)
   */
  if (!user) {
    return null;
  }

  /**
   * Si rôle requis et insuffisant : ne rien afficher
   */
  if (requiredRole) {
    const roles = {
      admin: ['admin'],
      user: ['admin', 'user'],
      viewer: ['admin', 'user', 'viewer'],
    };
    
    if (!roles[requiredRole].includes(user.role)) {
      return null;
    }
  }

  /**
   * Si authentifié et rôle suffisant : afficher le contenu
   */
  return <>{children}</>;
}