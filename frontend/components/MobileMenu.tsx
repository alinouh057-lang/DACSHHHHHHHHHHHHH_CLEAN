// frontend/components/MobileMenu.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT MOBILE MENU - PV MONITOR
 * ============================================================
 * Ce composant affiche un menu burger pour la version mobile.
 * Il permet de naviguer dans l'application sur petits écrans.
 * 
 * Fonctionnalités :
 * - Bouton menu burger pour ouvrir/fermer
 * - Panneau latéral coulissant avec animations fluides
 * - Navigation avec les mêmes éléments que la sidebar desktop
 * - Bouton de changement de thème (clair/sombre)
 * - Overlay semi-transparent pour fermer
 * - Gestion accessibilité (focus trap, touche Escape)
 * - Blocage du scroll body quand menu ouvert
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Menu, X, Sun, Moon } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface des propriétés du composant MobileMenu
 */
interface MobileMenuProps {
  navItems: Array<{
    href: string;                // Chemin de la page
    icon: React.ElementType;      // Composant icône
    labelKey: string;             // Clé de traduction pour le libellé
    roles: string[];              // Rôles autorisés (non utilisé dans ce composant)
  }>;
  theme: string;                  // Thème actuel ('light' ou 'dark')
  toggleTheme: () => void;        // Fonction pour changer de thème
  currentPath: string;            // Chemin actuel (pour surligner l'élément actif)
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function MobileMenu({ navItems, theme, toggleTheme, currentPath }: MobileMenuProps) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [isOpen, setIsOpen] = useState(false); // Menu ouvert/fermé
  const [isAnimating, setIsAnimating] = useState(false); // Animation en cours

  // ==========================================================
  // HOOKS
  // ==========================================================
  const { t } = useTranslation(); // Fonction de traduction

  // ==========================================================
  // EFFETS
  // ==========================================================
  
  /**
   * Bloque le scroll du body quand le menu est ouvert
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Gère la fermeture avec la touche Escape
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // ==========================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ==========================================================
  
  /**
   * Ouvre le menu avec animation
   */
  const handleOpen = () => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  /**
   * Ferme le menu avec animation
   */
  const handleClose = () => {
    setIsAnimating(true);
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <>
      {/* ==================================================== */}
      {/* BOUTON MENU BURGER (toujours visible) */}
      {/* ==================================================== */}
      <button
        onClick={handleOpen}
        aria-label={t('menu.open')}
        className="mobile-menu-button"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      {/* ==================================================== */}
      {/* OVERLAY SEMI-TRANSPARENT (fond sombre) */}
      {/* ==================================================== */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            opacity: isAnimating ? 0 : 1,
            transition: 'opacity 0.3s ease',
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* ==================================================== */}
      {/* PANNEAU LATÉRAL COULISSANT */}
      {/* ==================================================== */}
      <div
        className="mobile-menu-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '85vw',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 999,
          padding: '20px',
          transform: `translateX(${isOpen ? 0 : -100}%)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu.navigation')}
      >
        
        {/* ================================================ */}
        {/* EN-TÊTE DU MENU (logo + titre + bouton fermer) */}
        {/* ================================================ */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 30,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, 
              height: 40,
              background: 'linear-gradient(135deg, var(--green), var(--green-d))',
              borderRadius: 12,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}>
              <Sun size={20} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: 'var(--text)',
              letterSpacing: '-0.5px',
            }}>
              {t('app.title')}
            </span>
          </div>
          
          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            aria-label={t('menu.close')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* ================================================ */}
        {/* NAVIGATION (liens vers les pages) */}
        {/* ================================================ */}
        <nav 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 8, 
            flex: 1,
            overflowY: 'auto',
          }}
          role="navigation"
        >
          {navItems.map(({ href, icon: Icon, labelKey }) => {
            const active = currentPath === href;
            return (
              <Link 
                key={href} 
                href={href} 
                onClick={handleClose}
                style={{ textDecoration: 'none' }}
                className="mobile-nav-item"
              >
                <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: active 
                    ? 'linear-gradient(135deg, var(--green), var(--green-d))' 
                    : 'transparent',
                  color: active ? 'white' : 'var(--text)',
                  transition: 'all 0.2s ease',
                  fontWeight: active ? 600 : 400,
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} strokeWidth={2} />
                <span style={{ fontSize: 15 }}>{t(labelKey)}</span>
              </div>
            );
          })}
        </nav>

        {/* ================================================ */}
        {/* BOUTON DE CHANGEMENT DE THÈME (en bas) */}
        {/* ================================================ */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('theme.switch.light') : t('theme.switch.dark')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} strokeWidth={2} />
                <span>{t('theme.light')}</span>
              </>
            ) : (
              <>
                <Moon size={18} strokeWidth={2} />
                <span>{t('theme.dark')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}