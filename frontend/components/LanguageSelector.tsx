// frontend/components/LanguageSelector.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT LANGUAGE SELECTOR - PV MONITOR
 * ============================================================
 * Ce composant permet à l'utilisateur de changer la langue
 * de l'interface. Il affiche :
 * - Un bouton avec le drapeau de la langue actuelle
 * - Un menu déroulant avec toutes les langues disponibles
 * 
 * Fonctionnalités :
 * - Bouton d'ouverture/fermeture avec effet de survol
 * - Menu déroulant avec liste des langues
 * - Indicateur visuel de la langue sélectionnée (✓)
 * - Utilisation du hook useLanguage pour la gestion d'état
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, ChevronDown } from 'lucide-react';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function LanguageSelector() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [showMenu, setShowMenu] = useState(false); // Menu ouvert/fermé
  
  // ==========================================================
  // HOOKS
  // ==========================================================
  const { 
    languages,          // Liste des langues disponibles
    currentLanguage,    // Code de la langue actuelle
    changeLanguage,     // Fonction pour changer de langue
    getCurrentLanguage  // Fonction pour obtenir l'objet de la langue actuelle
  } = useLanguage();
  
  const current = getCurrentLanguage(); // Objet de la langue actuelle (avec nom et drapeau)

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ position: 'relative' }}>
      
      {/* ==================================================== */}
      {/* BOUTON PRINCIPAL (avec le drapeau de la langue actuelle) */}
      {/* ==================================================== */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: 36, 
          height: 36,
          borderRadius: 9,
          background: C.surface2,
          border: `1px solid ${C.border}`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16,
          transition: 'var(--tr)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = C.greenL)}
        onMouseLeave={e => (e.currentTarget.style.background = C.surface2)}
      >
        {current.flag} {/* Affiche le drapeau de la langue actuelle */}
      </button>

      {/* ==================================================== */}
      {/* MENU DÉROULANT (affiché si showMenu = true) */}
      {/* ==================================================== */}
      {showMenu && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />
          
          {/* Panneau du menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 180,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            
            {/* ================================================ */}
            {/* LISTE DES LANGUES DISPONIBLES */}
            {/* ================================================ */}
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code); // Change la langue
                  setShowMenu(false);         // Ferme le menu
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: lang.code === currentLanguage ? C.greenL : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: C.text,
                  cursor: 'pointer',
                  transition: 'var(--tr)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                onMouseLeave={e => (e.currentTarget.style.background = 
                  lang.code === currentLanguage ? C.greenL : 'transparent'
                )}
              >
                {/* Drapeau de la langue */}
                <span style={{ fontSize: 18 }}>{lang.flag}</span>
                
                {/* Nom de la langue */}
                {lang.name}
                
                {/* Indicateur de sélection (✓) pour la langue active */}
                {lang.code === currentLanguage && (
                  <span style={{ marginLeft: 'auto', color: C.green }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}