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
 * - Panneau latéral coulissant
 * - Navigation avec les mêmes éléments que la sidebar desktop
 * - Bouton de changement de thème
 * - Overlay semi-transparent pour fermer
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react';
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
  
  // ==========================================================
  // HOOKS
  // ==========================================================
  const { t } = useTranslation(); // Fonction de traduction

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <>
      {/* ==================================================== */}
      {/* BOUTON MENU BURGER (toujours visible) */}
      {/* ==================================================== */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Menu size={24} />
      </button>

      {/* ==================================================== */}
      {/* MENU MOBILE (affiché si isOpen = true) */}
      {/* ==================================================== */}
      {isOpen && (
        <>
          {/* Overlay semi-transparent pour fermer en cliquant à l'extérieur */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 998,
            }}
          />
          
          {/* ================================================ */}
          {/* PANNEAU LATÉRAL COULISSANT */}
          {/* ================================================ */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              zIndex: 999,
              padding: '20px',
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            
            {/* ============================================ */}
            {/* EN-TÊTE DU MENU (logo + titre + bouton fermer) */}
            {/* ============================================ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg, var(--green), var(--green-d))',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sun size={20} color="white" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {t('app.title')}
                </span>
              </div>
              
              {/* Bouton de fermeture */}
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* ============================================ */}
            {/* NAVIGATION (liens vers les pages) */}
            {/* ============================================ */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {navItems.map(({ href, icon: Icon, labelKey }) => {
                const active = currentPath === href; // Vérifie si le lien est actif
                return (
                  <Link 
                    key={href} 
                    href={href} 
                    onClick={() => setIsOpen(false)} // Ferme le menu après navigation
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: active ? 'var(--green)' : 'transparent',
                      color: active ? 'white' : 'var(--text)',
                      transition: 'background 0.2s',
                    }}>
                      <Icon size={20} />
                      {t(labelKey)} {/* Utilise la clé de traduction */}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* ============================================ */}
            {/* BOUTON DE CHANGEMENT DE THÈME (en bas) */}
            {/* ============================================ */}
            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              <button
                onClick={toggleTheme}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? t('theme.light') : t('theme.dark')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}