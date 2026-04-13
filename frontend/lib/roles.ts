// frontend/lib/roles.ts

/**
 * ============================================================
 * GESTION DES RÔLES ET PERMISSIONS - PV MONITOR
 * ============================================================
 * Ce fichier centralise la gestion des rôles utilisateurs,
 * des permissions et des accès aux routes de l'application.
 * 
 * Hiérarchie des rôles :
 * - admin : Accès complet à toutes les ressources
 * - user : Accès aux fonctionnalités opérationnelles
 * - viewer : Accès en lecture seule
 * 
 * Fonctionnalités :
 * - Définition des types (Role, User, Permission)
 * - Permissions par rôle (create, read, update, delete)
 * - Routes accessibles par rôle
 * - Fonctions de vérification d'accès
 * ============================================================
 */

// ============================================================
// TYPES DE BASE
// ============================================================

/**
 * Type représentant les rôles disponibles dans l'application
 * - admin : Administrateur - accès complet
 * - user : Technicien - accès opérationnel
 * - viewer : Observateur - accès en lecture seule
 */
export type Role = 'admin' | 'user' | 'viewer';

/**
 * Interface représentant un utilisateur
 */
export interface User {
  id: string;                // Identifiant unique
  email: string;             // Email de l'utilisateur
  name: string;              // Nom complet
  role: Role;                // Rôle (admin, user, viewer)
  avatar?: string;           // URL de l'avatar (optionnel)
  createdAt: string;         // Date de création du compte
  lastLogin?: string;        // Date de dernière connexion (optionnel)
}

/**
 * Interface représentant une permission sur une ressource
 */
export interface Permission {
  resource: string;                          // Nom de la ressource (ex: 'users', 'devices')
  actions: ('create' | 'read' | 'update' | 'delete')[]; // Actions autorisées
}

// ============================================================
// PERMISSIONS PAR RÔLE
// ============================================================

/**
 * Définition des permissions pour chaque rôle
 * Structure : { [rôle]: Permission[] }
 * 
 * Actions possibles :
 * - create : Création de ressources
 * - read : Lecture de ressources
 * - update : Modification de ressources
 * - delete : Suppression de ressources
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ==========================================================
  // ADMIN - Accès complet à toutes les ressources
  // ==========================================================
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'devices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'alerts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'config', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'logs', actions: ['read'] },                // Lecture uniquement
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
  ],
  
  // ==========================================================
  // USER (Technicien) - Accès opérationnel
  // ==========================================================
  user: [
    { resource: 'devices', actions: ['read'] },              // Lecture des dispositifs
    { resource: 'alerts', actions: ['read', 'update'] },     // Lecture et mise à jour des alertes
    { resource: 'reports', actions: ['read'] },               // Lecture des rapports
  ],
  
  // ==========================================================
  // VIEWER (Observateur) - Accès en lecture seule
  // ==========================================================
  viewer: [
    { resource: 'devices', actions: ['read'] },               // Lecture des dispositifs
    { resource: 'alerts', actions: ['read'] },                // Lecture des alertes
    { resource: 'reports', actions: ['read'] },               // Lecture des rapports
  ],
};

// ============================================================
// ROUTES PROTÉGÉES PAR RÔLE
// ============================================================

/**
 * Définition des routes accessibles pour chaque rôle
 * Structure : { [rôle]: string[] } - Liste des chemins autorisés
 * 
 * Note : Les admins ont accès à toutes les routes,
 *       donc non listées explicitement.
 */
export const ROLE_ROUTES: Record<Role, string[]> = {
  admin: ['/admin', '/users', '/settings', '/logs', '/backup'], // Routes d'administration
  user: ['/maintenance', '/alerts', '/reports'],                 // Routes opérationnelles
  viewer: ['/dashboard', '/energie', '/historique'],             // Routes en lecture seule
};

// ============================================================
// FONCTIONS DE VÉRIFICATION D'ACCÈS
// ============================================================

/**
 * Vérifie si un utilisateur a accès à une route spécifique
 * 
 * @param user - L'utilisateur connecté (ou null)
 * @param path - Le chemin de la route à vérifier
 * @returns true si l'accès est autorisé, false sinon
 * 
 * Règles :
 * - Si l'utilisateur n'est pas connecté → false
 * - Si l'utilisateur est admin → true (accès à tout)
 * - Sinon, vérifie si le chemin commence par une route autorisée
 */
export const hasRouteAccess = (user: User | null, path: string): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin a accès à tout
  
  const allowedRoutes = ROLE_ROUTES[user.role];
  return allowedRoutes.some(route => path.startsWith(route));
};

/**
 * Vérifie si un utilisateur a une permission spécifique sur une ressource
 * 
 * @param user - L'utilisateur connecté (ou null)
 * @param resource - La ressource concernée (ex: 'devices')
 * @param action - L'action à effectuer (create, read, update, delete)
 * @returns true si la permission est accordée, false sinon
 * 
 * Règles :
 * - Si l'utilisateur n'est pas connecté → false
 * - Si l'utilisateur est admin → true (toutes permissions)
 * - Sinon, vérifie dans les permissions de son rôle
 */
export const hasPermission = (
  user: User | null,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const permissions = ROLE_PERMISSIONS[user.role];
  const resourcePerm = permissions.find(p => p.resource === resource);
  
  return resourcePerm ? resourcePerm.actions.includes(action) : false;
};