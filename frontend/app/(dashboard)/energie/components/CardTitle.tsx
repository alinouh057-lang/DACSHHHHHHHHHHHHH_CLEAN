// ============================================================================
// FICHIER: CardTitle.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un titre de section avec une icône et un
//   point coloré, utilisé dans les cartes de la page Analyse Énergétique.
//   Il permet d'identifier clairement chaque section (graphiques, tableaux).
//
// 🎨 FONCTIONNALITÉS:
//   - Point coloré indicateur (personnalisable)
//   - Icône Lucide React
//   - Texte de titre en majuscules
//   - Contenu optionnel à droite (pour actions ou filtres)
//   - Style cohérent avec le thème de l'application
//
// 📦 PROPS (entrées):
//   - dot    : Couleur du point indicateur (défaut: vert) - OPTIONNEL
//   - icon   : Composant icône (Lucide) - REQUIS
//   - text   : Texte du titre - REQUIS
//   - right  : Contenu React optionnel à droite - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.text3 : couleur du texte (secondaire)
//   - C.green : couleur par défaut du point
//
// 📊 EXEMPLE D'UTILISATION:
//   <CardTitle 
//     icon={TrendingUp} 
//     text="Puissance réelle vs théorique" 
//   />
//   
//   <CardTitle 
//     icon={Gauge} 
//     text="Tension & Courant" 
//     dot="#0ea5e9" 
//   />
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

interface CardTitleProps {
  dot?: string;        // Couleur du point indicateur (défaut: C.green)
  icon: React.ElementType;  // Composant icône (ex: TrendingUp, Gauge)
  text: string;        // Texte du titre
  right?: ReactNode;   // Contenu optionnel à droite (actions, filtres)
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Titre de carte avec icône et point coloré pour la page énergie.
 * 
 * 📥 PROPS:
 *   - dot    : Couleur du point (défaut: C.green)
 *   - icon   : Icône Lucide React (TrendingUp, Gauge, ClipboardList, etc.)
 *   - text   : Texte descriptif du titre
 *   - right  : Élément React optionnel affiché à droite
 * 
 * 📤 RENDU: Div flexbox avec:
 *   - Point coloré
 *   - Icône
 *   - Texte en majuscules
 *   - Contenu optionnel à droite (aligné à l'opposé)
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌─────────────────────────────────────────────────┐
 *   │  ● [ICÔNE] TITRE EN MAJUSCULES    [CONTENU]    │
 *   └─────────────────────────────────────────────────┘
 */
export default function CardTitle({ dot = C.green, icon: Icon, text, right }: CardTitleProps) {
  return (
    <div
      style={{
        fontSize: 9.5,                   // Petite taille pour le titre
        fontWeight: 700,                 // Gras
        color: C.text3,                  // Couleur secondaire
        letterSpacing: 1,                // Espacement des lettres
        textTransform: 'uppercase',      // Majuscules
        marginBottom: 14,                // Marge inférieure
        display: 'flex',                 // Flexbox pour l'alignement
        alignItems: 'center',            // Alignement vertical centré
        gap: 6,                          // Espacement entre éléments
        justifyContent: 'space-between', // Espace entre gauche et droite
      }}
    >
      {/* ======================================================== */}
      {/* 1. PARTIE GAUCHE : POINT + ICÔNE + TEXTE */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Point coloré indicateur */}
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
        {/* Icône Lucide */}
        <Icon size={14} />
        {/* Texte du titre */}
        {text}
      </div>
      
      {/* ======================================================== */}
      {/* 2. PARTIE DROITE : CONTENU OPTIONNEL */}
      {/* ======================================================== */}
      {right}
    </div>
  );
}