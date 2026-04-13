// ============================================================================
// FICHIER: Card.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React est un conteneur générique utilisé pour encapsuler
//   le contenu de la page Analyse Énergétique. Il fournit un style uniforme
//   à toutes les sections de la page (graphiques, tableaux, etc.).
//
// 🎨 FONCTIONNALITÉS:
//   - Fond de surface avec couleur thème
//   - Bordure subtile
//   - Coins arrondis (14px)
//   - Ombre portée légère
//   - Padding interne cohérent
//   - Support de styles personnalisés via la prop 'style'
//
// 📦 PROPS (entrées):
//   - children : Contenu React à afficher dans la carte - REQUIS
//   - style    : Styles CSS supplémentaires optionnels - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface : fond de la carte
//   - C.border  : couleur de bordure
//
// 📊 EXEMPLE D'UTILISATION:
//   <Card>
//     <CardTitle text="Puissance réelle vs théorique" />
//     <PowerChart data={chartData} />
//   </Card>
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (Next.js)

import { ReactNode } from 'react';
import { C } from '@/lib/colors';  // Palette de couleurs globale

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface CardProps {
  children: ReactNode;          // Contenu enfant à afficher
  style?: React.CSSProperties;  // Styles CSS supplémentaires optionnels
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Conteneur de carte générique pour la page énergie.
 * 
 * 📥 PROPS:
 *   - children : Contenu React (graphiques, tableaux, titres, etc.)
 *   - style    : Overrides de styles CSS (optionnel)
 * 
 * 📤 RENDU: Div stylisé avec:
 *   - Fond de surface
 *   - Bordure subtile
 *   - Coins arrondis
 *   - Ombre portée
 *   - Padding interne
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌─────────────────────────────────────┐
 *   │                                     │
 *   │  [CONTENU ENFANT]                   │
 *   │  - Titres                           │
 *   │  - Graphiques                       │
 *   │  - Tableaux                         │
 *   │                                     │
 *   └─────────────────────────────────────┘
 */
export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: C.surface,              // Fond de la carte
        border: `1px solid ${C.border}`,   // Bordure subtile
        borderRadius: 14,                  // Coins arrondis
        padding: 20,                       // Espacement interne
        boxShadow: '0 1px 3px rgba(13,82,52,.06), 0 4px 16px rgba(13,82,52,.05)', // Ombre légère
        ...style,                          // Fusion avec styles personnalisés
      }}
    >
      {children}
    </div>
  );
}