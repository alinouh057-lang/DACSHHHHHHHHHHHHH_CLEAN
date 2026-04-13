// frontend/app/layout.tsx
'use client';

/**
 * ============================================================
 * LAYOUT PRINCIPAL - PV MONITOR
 * ============================================================
 * Ce fichier définit la structure globale de l'application :
 * - Fournisseurs de contexte (Auth, Refresh, Dashboard, Device)
 * - Layout avec sidebar fixe (sur desktop)
 * - Header avec contrôles (thème, langue, notifications)
 * - Gestion de l'authentification et des redirections
 * - Menu utilisateur (desktop et mobile)
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import './globals.css';
import { Inter } from 'next/font/google';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshProvider } from '@/contexts/RefreshContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { DeviceProvider } from '@/contexts/DeviceContext';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';
import NotificationBell from '@/components/NotificationBell';
//import AdminPanel from '@/components/AdminPanel(unused)';
import EmailConfig from '@/components/EmailConfig';
import DeviceSelector from '@/components/DeviceSelector';
import MobileMenu from '@/components/MobileMenu';
import LanguageSelector from '@/components/LanguageSelector';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { 
  Sun, Moon, Activity, Zap, History, Wrench, Droplets, 
  AlertTriangle, BarChart3, Settings, LayoutDashboard,
  LogOut, User, ChevronDown, Shield, UserCircle, Menu,
  Brain
} from 'lucide-react';
import { registerDevice, getAuthToken, initTimezone } from '@/lib/api';
import '../i18n'; // Configuration i18n
import './globals.css';

// ============================================================
// CONSTANTES DE NAVIGATION
// ============================================================

/**
 * Mapping des icônes pour les routes (non utilisé directement, mais gardé pour référence)
 */
const navIcons = {
  '/': LayoutDashboard,
  '/energie': Zap,
  '/historique': History,
  '/maintenance': Wrench,
  '/soiling': Droplets,
  '/alerts': AlertTriangle,
  '/reports': BarChart3,
  '/admin': Settings,
};

/**
 * Configuration des éléments de navigation
 * Chaque élément spécifie :
 * - href : chemin de la page
 * - icon : icône Lucide
 * - labelKey : clé de traduction
 * - roles : rôles autorisés à voir ce lien
 */
const NAV = [
  { href: '/', icon: LayoutDashboard, labelKey: 'navigation.dashboard', roles: ['admin', 'user', 'viewer'] },
  { href: '/energie', icon: Zap, labelKey: 'navigation.energy', roles: ['admin', 'user', 'viewer'] },
  { href: '/historique', icon: History, labelKey: 'navigation.history', roles: ['admin', 'user', 'viewer'] },
  { href: '/maintenance', icon: Wrench, labelKey: 'navigation.maintenance', roles: ['admin', 'user'] },
  { href: '/soiling', icon: Droplets, labelKey: 'navigation.soiling', roles: ['admin', 'user', 'viewer'] },
  { href: '/alerts', icon: AlertTriangle, labelKey: 'navigation.alerts', roles: ['admin', 'user'] },
  { href: '/reports', icon: BarChart3, labelKey: 'navigation.reports', roles: ['admin', 'user'] },
  { href: '/admin', icon: Settings, labelKey: 'navigation.admin', roles: ['admin'] },
];

/**
 * Métadonnées pour chaque page (titres et sous-titres)
 * Utilisées dans l'en-tête
 */
const PAGE_META: Record<string, { titleKey: string; subKey: string }> = {
  '/': { titleKey: 'navigation.dashboard', subKey: 'dashboard.subtitle' },
  '/energie': { titleKey: 'navigation.energy', subKey: 'energy.subtitle' },
  '/historique': { titleKey: 'navigation.history', subKey: 'history.subtitle' },
  '/maintenance': { titleKey: 'navigation.maintenance', subKey: 'maintenance.subtitle' },
  '/soiling': { titleKey: 'navigation.soiling', subKey: 'soiling.subtitle' },
  '/alerts': { titleKey: 'navigation.alerts', subKey: 'alerts.subtitle' },
  '/reports': { titleKey: 'navigation.reports', subKey: 'reports.subtitle' },
  '/admin': { titleKey: 'navigation.admin', subKey: 'admin.subtitle' },
  '/login': { titleKey: 'auth.login', subKey: 'auth.loginSubtitle' },
  '/register': { titleKey: 'auth.register', subKey: 'auth.registerSubtitle' },
  '/profile': { titleKey: 'navigation.profile', subKey: 'profile.subtitle' },
};

const inter = Inter({ subsets: ['latin'] });

// ============================================================
// COMPOSANT PRINCIPAL DU CONTENU
// ============================================================

/**
 * Contenu principal avec sidebar et header
 * Nécessite d'être à l'intérieur du AuthProvider
 */
function MainContent({ children }: { children: React.ReactNode }) {
  // ==========================================================
  // HOOKS ET ÉTATS
  // ==========================================================
  const pathname = usePathname();
  const router = useRouter();
  const { t, ready } = useTranslation();
  const meta = PAGE_META[pathname] ?? { titleKey: 'app.title', subKey: 'app.subtitle' };
  const { theme, toggleTheme, mounted } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [authReady, setAuthReady] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, loading, logout, isAdmin, isUser, isViewer } = useAuth();
  // ==========================================================
  // FILTRAGE DE LA NAVIGATION PAR RÔLE
  // ==========================================================
  const filteredNav = NAV.filter(item => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isUser) return item.roles.includes('user');
    if (isViewer) return item.roles.includes('viewer');
    return false;
  });

  // ==========================================================
  // INITIALISATION DE L'AUTHENTIFICATION
  // ==========================================================
  useEffect(() => {
    if (loading) return;
    const initAuth = async () => {
      // Pages publiques (sans authentification requise)
      const publicPages = ['/login', '/register', '/forgot-password', '/reset-password'];
      
      // ⚠️ CRUCIAL : Ne pas rediriger si déjà sur une page publique
    if (!user && !publicPages.includes(pathname)) {
      router.push('/login');
      return;
    }
    
    // ⚠️ CRUCIAL : Ne pas rediriger si déjà sur le dashboard
    if (user && pathname === '/login') {
      router.push('/');
      return;
    }

      // Enregistrement du device dashboard si token manquant
      const token = getAuthToken();
      if (!token && user) {
        console.log('🔑 Aucun token trouvé, enregistrement du dashboard...');
        const success = await registerDevice('dashboard');
        if (success) {
          console.log('✅ Authentification réussie');
        } else {
          console.warn('⚠️ Échec de l\'authentification, certaines fonctionnalités seront limitées');
        }
      }
      
      // Initialisation du fuseau horaire
      const timezone = await initTimezone();
      console.log('🌍 Fuseau horaire initialisé:', timezone);
      
      setAuthReady(true);
    };
    
    initAuth();
  }, [user, loading, pathname, router]);

  // ==========================================================
  // PAGES PUBLIQUES (SANS SIDEBAR)
  // ==========================================================
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) {
    return (
      <div style={{ marginLeft: 0, flex: 1, minHeight: '100vh' }}>
        <main style={{ padding: 0 }}>
          {children}
        </main>
      </div>
    );
  }

  // ==========================================================
  // ÉTAT DE CHARGEMENT
  // ==========================================================
  if (!mounted || !authReady || !user || !ready) {
    return (
      <div style={{ 
        marginLeft: isMobile ? 0 : 220, 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 40, height: 40, 
            borderRadius: '50%', 
            border: '3px solid var(--green-l)', 
            borderTopColor: 'var(--green)', 
            animation: 'spin 1s linear infinite', 
            margin: '0 auto 16px' 
          }} />
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU COMPLET (AVEC SIDEBAR ET HEADER)
  // ==========================================================
  return (
    <>
      {/* ==================================================== */}
      {/* SIDEBAR - Version desktop uniquement */}
      {/* ==================================================== */}
      {!isMobile && (
        <aside style={{
          width: '220px', flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 200,
          boxShadow: 'var(--shadow-md)',
        }}>
          
          {/* Logo et titre */}
          <div style={{ padding: '26px 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, var(--green), var(--green-d))',
              borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 21,
              boxShadow: '0 6px 18px var(--green-l)',
              marginBottom: 12,
            }}>
              <Sun size={24} color="white" />
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {t('app.title')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '.6px', textTransform: 'uppercase', marginTop: 2 }}>
              {t('app.subtitle')}
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '18px 10px', flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>
              NAVIGATION
            </div>
            {filteredNav.map(({ href, icon: Icon, labelKey }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? '#fff' : 'var(--text-2)',
                    background: active
                      ? 'linear-gradient(135deg, var(--green), var(--green-d))'
                      : 'transparent',
                    boxShadow: active ? '0 4px 14px var(--green-l)' : 'none',
                    transition: 'var(--tr)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--green-l)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <Icon size={18} color={active ? '#fff' : 'var(--text-2)'} />
                    {t(labelKey)}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ==================================================== */}
      {/* CONTENU PRINCIPAL (avec marge pour sidebar) */}
      {/* ==================================================== */}
      <div style={{ 
        marginLeft: isMobile ? 0 : 220, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh' 
      }}>
        
        {/* ================================================== */}
        {/* HEADER (commun à toutes les pages) */}
        {/* ================================================== */}
        <header style={{
          height: 60,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 30px',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          
          {/* Partie gauche (mobile : menu burger) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <MobileMenu 
                navItems={filteredNav} 
                theme={theme} 
                toggleTheme={toggleTheme} 
                currentPath={pathname}
              />
            )}
          </div>

          {/* ================================================ */}
          {/* PARTIE DROITE (contrôles et icônes) */}
          {/* ================================================ */}
          {isMobile ? (
            // Version mobile simplifiée
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LanguageSelector />
              <button
                onClick={toggleTheme}
                style={{
                  width: 36, height: 36,
                  borderRadius: 9,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--green-l)', borderRadius: 99,
                padding: '4px 8px',
              }}>
                <Activity size={12} color="var(--green)" />
                <span style={{ fontSize: 11, color: 'var(--green)' }}>Live</span>
              </div>

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: 36, height: 36,
                  borderRadius: 9,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <UserCircle size={18} />
              </button>
            </div>
          ) : (
            // Version desktop - TOUS LES ICÔNES
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              
              {/* Sélecteur de langue */}
              <LanguageSelector />
              
              {/* Sélecteur de dispositif 
              <DeviceSelector />*/}
              
              {/* INDICATEUR IA */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-2)',
                borderRadius: 99,
                padding: '5px 12px',
                border: '1px solid var(--border)',
              }}>
                <Brain size={16} color="var(--blue)" />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>IA Model</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)' }}>Hybrid_v1 · 97.4%</span>
                </div>
              </div>
              
              {/* Contrôle de rafraîchissement */}
              <GlobalRefreshControl />
              
              {/* Cloche de notifications 
              <NotificationBell />*/}
              
              {/* Configuration email */}
              <EmailConfig />
              
              {/* Bouton de changement de thème */}
              <button onClick={toggleTheme} title={theme === 'dark' ? t('theme.light') : t('theme.dark')} style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              {/* Indicateur Live */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--green-l)', borderRadius: 99,
                padding: '5px 12px', fontSize: 12, fontWeight: 600,
                color: 'var(--green)',
              }}>
                <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'var(--green)', opacity: .7,
                    animation: 'pulse-ring 1.5s ease-out infinite',
                  }} />
                  <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                </span>
                <Activity size={12} />
                <span>Live</span>
              </div>

              {/* Menu utilisateur desktop */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px 5px 5px',
                    background: 'var(--surface-2)',
                    border: `1px solid var(--border)`,
                    borderRadius: 99,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: user.role === 'admin' ? 'var(--green)' : 
                                user.role === 'user' ? 'var(--blue)' : 'var(--amber)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    <UserCircle size={16} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    {user.name}
                  </span>
                  <ChevronDown size={14} color="var(--text-2)" />
                </button>

                {showUserMenu && (
                  <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} />
                )}
              </div>
            </div>
          )}
        </header>

        {/* Menu utilisateur mobile (popup) */}
        {isMobile && showUserMenu && (
          <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} isMobile />
        )}

        {/* ================================================== */}
        {/* CONTENU DE LA PAGE (children) */}
        {/* ================================================== */}
        <main style={{ 
          padding: isMobile ? '16px' : '28px 30px', 
          flex: 1 
        }}>
          {children}
        </main>
      </div>
    </>
  );
}

// ============================================================
// COMPOSANT MENU UTILISATEUR (RÉUTILISABLE)
// ============================================================

/**
 * Menu déroulant pour l'utilisateur
 * Peut être utilisé en version desktop (absolute) ou mobile (fixed)
 */
function UserMenu({ user, isAdmin, onLogout, isMobile = false }: any) {
  const router = useRouter();
  const { t } = useTranslation();
  
  return (
    <div style={{
      position: isMobile ? 'fixed' : 'absolute',
      top: isMobile ? '60px' : '100%',
      right: isMobile ? '16px' : 0,
      marginTop: isMobile ? 0 : 8,
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderRadius: 10,
      boxShadow: 'var(--shadow-lg)',
      width: isMobile ? 'calc(100% - 32px)' : 200,
      zIndex: 1000,
      ...(isMobile && {
        left: '16px',
      }),
    }}>
      {/* En-tête du menu (infos utilisateur) */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid var(--border)`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {user.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {user.email}
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: 6,
          padding: '2px 8px',
          background: user.role === 'admin' ? 'var(--green-l)' : 
                     user.role === 'user' ? 'var(--blue-l)' : 'var(--amber-l)',
          color: user.role === 'admin' ? 'var(--green)' : 
                 user.role === 'user' ? 'var(--blue)' : 'var(--amber)',
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 600,
        }}>
          {user.role === 'admin' && t('role.admin')}
          {user.role === 'user' && t('role.user')}
          {user.role === 'viewer' && t('role.viewer')}
        </div>
      </div>

      {/* Lien vers le profil */}
      <Link href="/profile" style={{ textDecoration: 'none' }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--text-2)',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'var(--tr)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <User size={14} />
          {t('navigation.profile')}
        </div>
      </Link>

      {/* Lien vers admin (si utilisateur admin) */}
      {isAdmin && (
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-2)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'var(--tr)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={14} />
            {t('navigation.admin')}
          </div>
        </Link>
      )}

      {/* Bouton de déconnexion */}
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          border: 'none',
          background: 'transparent',
          color: 'var(--red)',
          fontSize: 12,
          cursor: 'pointer',
          borderTop: `1px solid var(--border)`,
          transition: 'var(--tr)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-l)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <LogOut size={14} />
        {t('navigation.logout')}
      </button>
    </div>
  );
}

// ============================================================
// LAYOUT PRINCIPAL AVEC PROVIDERS
// ============================================================

/**
 * Layout racine qui enveloppe toute l'application
 * Fournit tous les contextes nécessaires
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <title>PFE — Surveillance PV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a7f4f" />
      </head>
      <body style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: 'var(--bg)',
        margin: 0,
        padding: 0,
        overflowX: 'hidden'
      }}>
        {/* Chaîne de providers : Auth → Refresh → Dashboard → Device */}
        <AuthProvider>
          <RefreshProvider>
            <DashboardProvider>
              <DeviceProvider>
                <MainContent>{children}</MainContent>
              </DeviceProvider>
            </DashboardProvider>
          </RefreshProvider>
        </AuthProvider>
      </body>
    </html>
  );
}