// ============================================================================
// FICHIER: KpiCard.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une carte d'indicateur clé de performance (KPI)
//   sur la page Analyse Énergétique. Chaque carte présente une métrique importante
//   comme le nombre de mesures, la puissance moyenne, le performance ratio, etc.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage d'une icône personnalisée (Lucide React)
//   - Valeur principale en grand format (ex: "45.2")
//   - Unité associée (ex: "W", "%", "kWh/kWp")
//   - Label descriptif (ex: "Puissance moy.")
//   - Ligne colorée en haut selon la métrique
//   - Design cohérent avec les autres KPIs du dashboard
//
// 📦 PROPS (entrées):
//   - icon        : Composant icône (Lucide) - REQUIS
//   - label       : Texte descriptif (ex: "Puissance moy.") - REQUIS
//   - value       : Valeur à afficher (ex: "45.2") - REQUIS
//   - unit        : Unité de mesure (ex: "W", "%") - REQUIS
//   - accentColor : Couleur d'accentuation (ex: "#0ea5e9") - REQUIS
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface : fond de la carte
//   - C.border  : couleur de bordure
//   - C.text    : couleur du texte principal
//   - C.text3   : couleur du texte secondaire
//
// 📊 EXEMPLE D'UTILISATION:
//   <KpiCard
//     icon={Zap}
//     label="PUISSANCE MOY."
//     value="245.3"
//     unit="W"
//     accentColor="#0ea5e9"
//   />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (Next.js)

import { C } from '@/lib/colors';  // Palette de couleurs globale

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface KpiCardProps {
  icon: React.ElementType;      // Composant icône (ex: Zap, Hash, Target)
  label: string;                // Texte descriptif
  value: string;                // Valeur à afficher (ex: "45.2")
  unit: string;                 // Unité (ex: "W", "%", "kWh/kWp")
  accentColor: string;          // Couleur d'accentuation (ex: "#0ea5e9")
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Carte d'indicateur clé de performance (KPI) pour la page énergie.
 * 
 * 📥 PROPS:
 *   - icon        : Icône Lucide React (Zap, Hash, Target, Award, etc.)
 *   - label       : Texte descriptif (ex: "PUISSANCE MOY.")
 *   - value       : Valeur numérique (ex: "245.3")
 *   - unit        : Unité de mesure (ex: "W", "%", "kWh/kWp")
 *   - accentColor : Couleur de la ligne supérieure
 * 
 * 📤 RENDU: Carte stylisée avec:
 *   - Ligne colorée en haut
 *   - Icône
 *   - Grande valeur + unité
 *   - Label
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌─────────────────────────────────────┐
 *   │ ████████████████████████████████████│ ← ligne colorée (accentColor)
 *   │                                     │
 *   │  [ICÔNE]                            │
 *   │                                     │
 *   │  245.3  W                           │ ← grande valeur + unité
 *   │  PUISSANCE MOY.                     │ ← label
 *   └─────────────────────────────────────┘
 */
export default function KpiCard({ icon: Icon, label, value, unit, accentColor }: KpiCardProps) {
  return (
    <div
      style={{
        background: C.surface,              // Fond de la carte
        border: `1px solid ${C.border}`,   // Bordure subtile
        borderRadius: 14,                  // Coins arrondis
        padding: '18px 20px',              // Espacement interne
        boxShadow: '0 1px 3px rgba(13,82,52,.06)', // Ombre légère
        position: 'relative',              // Pour positionner la ligne absolue
        overflow: 'hidden',                // Cache les débordements
      }}
    >
      {/* ======================================================== */}
      {/* 1. LIGNE COLORÉE EN HAUT (accent) */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: '14px 14px 0 0',
        }}
      />

      {/* ======================================================== */}
      {/* 2. ICÔNE */}
      {/* ======================================================== */}
      <div style={{ fontSize: 20, marginBottom: 10 }}>
        <Icon size={24} color={accentColor} />
      </div>

      {/* ======================================================== */}
      {/* 3. VALEUR PRINCIPALE + UNITÉ */}
      {/* ======================================================== */}
      <div>
        <span
          style={{
            fontFamily: 'Sora, sans-serif',    // Police moderne
            fontSize: 26,                      // Taille grande pour la valeur
            fontWeight: 800,                   // Gras
            color: C.text,                     // Couleur du texte principal
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 3 }}>{unit}</span>
      </div>

      {/* ======================================================== */}
      {/* 4. LABEL DESCRIPTIF */}
      {/* ======================================================== */}
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{label}</div>
    </div>
  );
}