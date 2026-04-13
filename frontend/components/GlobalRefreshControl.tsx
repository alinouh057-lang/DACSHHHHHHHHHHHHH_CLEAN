// frontend/components/GlobalRefreshControl.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT GLOBAL REFRESH CONTROL - PV MONITOR
 * ============================================================
 * Ce composant gère le contrôle de rafraîchissement global
 * de l'application. Il permet de :
 * - Rafraîchir manuellement les données
 * - Activer/désactiver le rafraîchissement automatique
 * - Voir la dernière mise à jour
 * - Réinitialiser l'affichage du dashboard
 * 
 * Fonctionnalités :
 * - Bouton de rafraîchissement manuel avec icône
 * - Toggle auto-refresh avec indicateur visuel
 * - Affichage de l'heure de dernière mise à jour
 * - Bouton de réinitialisation avec confirmation
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDashboardReset } from '@/contexts/DashboardContext';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';
// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function GlobalRefreshControl() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [showResetConfirm, setShowResetConfirm] = useState(false); // État du popup de confirmation
  
  // ==========================================================
  // CONTEXTES
  // ==========================================================
  const { 
    autoRefresh,        // État du rafraîchissement automatique (true/false)
    setAutoRefresh,     // Fonction pour changer l'état auto
    lastUpdate,         // Date de la dernière mise à jour
    triggerRefresh      // Fonction pour déclencher un rafraîchissement manuel
  } = useRefresh();
  
  const { resetDashboard } = useDashboardReset(); // Fonction pour réinitialiser l'affichage

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      
      {/* ==================================================== */}
      {/* CONTRÔLE DE RAFRAÎCHISSEMENT */}
      {/* ==================================================== */}
      <div  >
      
      {/*style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: C.surface2,
        padding: '16px 10px',
        borderRadius: 99,
        border: `1px solid ${C.border}`,
      }}*/}
       
        
        {/* ================================================ */}
        {/* BOUTON RAFRAÎCHIR MANUEL */}
        {/* ================================================ */}
      {/*  <button
          onClick={triggerRefresh}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 6,
            color: C.text2,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
          title="Rafraîchir maintenant"
        >
          <RefreshCw size={16} />
        </button>*/}

        {/* Séparateur vertical */}
     {/*   <div style={{ width: 1, height: 20, background: C.border }} />*/}

        {/* ================================================ */}
        {/* TOGGLE AUTO-REFRESH */}
        {/* ================================================ */}
       {/* <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: C.text3 }}>Auto</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              width: 36,
              height: 18,
              borderRadius: 99,
              background: autoRefresh ? C.green : C.border,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >*/}
            {/* Curseur du toggle */}
        {/*    <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: 2,
              left: autoRefresh ? 20 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>*/}

        {/* ================================================ */}
        {/* DERNIÈRE MISE À JOUR (heure) */}
        {/* ================================================ */}
     {/*   {lastUpdate && (
          <span style={{ fontSize: 10, color: C.text3 }}>
            {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}*/}
      </div>

      {/* ==================================================== */}
      {/* BOUTON DE RÉINITIALISATION (avec confirmation) */}
      {/* ==================================================== */}
      <div style={{ position: 'relative' }}>
        
        {/* Bouton principal */}
        <button
          onClick={() => setShowResetConfirm(true)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: C.text2,
            transition: 'all 0.2s',
          }}
          title="Réinitialiser l'affichage"
          onMouseEnter={e => (e.currentTarget.style.background = C.redL)}
          onMouseLeave={e => (e.currentTarget.style.background = C.surface2)}
        >
          <RotateCcw size={18} />
        </button>

        {/* ================================================ */}
        {/* POPUP DE CONFIRMATION (affiché si showResetConfirm = true) */}
        {/* ================================================ */}
        {showResetConfirm && (
          <>
            {/* Overlay pour fermer en cliquant à l'extérieur */}
            <div
              onClick={() => setShowResetConfirm(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
              }}
            />
            
            {/* Panneau de confirmation */}
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 200,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 12,
              zIndex: 999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              
              {/* Titre */}
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: C.text }}>
                Réinitialiser l'affichage ?
              </div>
              
              {/* Message d'avertissement */}
              <div style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>
                Les données dans la base ne seront pas supprimées.
              </div>
              
              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Bouton Annuler */}
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text2,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                
                {/* Bouton Réinitialiser */}
                <button
                  onClick={() => {
                    resetDashboard();          // Réinitialise l'affichage
                    setShowResetConfirm(false); // Ferme le popup
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: 'none',
                    background: C.red,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}