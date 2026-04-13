// ============================================================================
// FICHIER: KpiCard.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une carte d'indicateur clé de performance (KPI)
//   sur le dashboard principal. Chaque carte présente une métrique importante
//   comme l'ensablement moyen, la puissance, l'irradiance, etc.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage d'une icône personnalisée (Lucide React)
//   - Valeur principale en grand format (ex: "45.2")
//   - Unité associée (ex: "%", "W", "W/m²")
//   - Label descriptif (ex: "Ensablement moyen")
//   - Badge avec information complémentaire
//   - Ligne colorée en haut selon la métrique
//   - Animation fade-up avec délai personnalisable
//
// 📦 PROPS (entrées):
//   - icon        : Composant icône (Lucide) - REQUIS
//   - label       : Texte descriptif (ex: "Ensablement moyen") - REQUIS
//   - value       : Valeur à afficher (ex: "45.2") - REQUIS
//   - unit        : Unité de mesure (ex: "%", "W", "W/m²") - REQUIS
//   - badge       : Texte du badge (ex: "▲ +2.5%", "Critique") - REQUIS
//   - accentColor : Couleur d'accentuation (ex: "#c47d0e") - REQUIS
//   - delay       : Délai d'animation (ex: "0.1s", "0.2s") - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface : fond de la carte
//   - C.border  : couleur de bordure
//   - C.text    : couleur du texte principal
//   - C.text3   : couleur du texte secondaire
//
// 💡 ANIMATION:
//   - Classe CSS "fade-up" (définie dans globals.css)
//   - Animation de fondu + translation verticale
//   - Délai personnalisable pour effet cascade
//
// 📊 EXEMPLE D'UTILISATION:
//   <KpiCard
//     icon={Droplets}
//     label="Ensablement moyen"
//     value="45.2"
//     unit="%"
//     badge="▲ +2.5%"
//     accentColor="#c47d0e"
//     delay="0.1s"
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
  icon: React.ElementType;      // Composant icône (ex: Droplets, Zap, Sun)
  label: string;                // Texte descriptif
  value: string;                // Valeur à afficher (ex: "45.2")
  unit: string;                 // Unité (ex: "%", "W", "W/m²")
  badge: string;                // Texte du badge (ex: "▲ +2.5%")
  accentColor: string;          // Couleur d'accentuation (ex: "#c47d0e")
  delay?: string;               // Délai d'animation (ex: "0.1s")
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Carte d'indicateur clé de performance (KPI) pour le dashboard.
 * 
 * 📥 PROPS:
 *   - icon        : Icône Lucide React (Droplets, Zap, Sun, Thermometer, etc.)
 *   - label       : Texte descriptif (ex: "Ensablement moyen")
 *   - value       : Valeur numérique (ex: "45.2")
 *   - unit        : Unité de mesure (ex: "%", "W", "W/m²")
 *   - badge       : Information complémentaire (ex: "▲ +2.5%")
 *   - accentColor : Couleur de la ligne supérieure et du badge
 *   - delay       : Délai d'animation (défaut: "0s")
 * 
 * 📤 RENDU: Carte stylisée avec:
 *   - Ligne colorée en haut
 *   - Icône
 *   - Grande valeur + unité
 *   - Label
 *   - Badge arrondi
 *   - Animation fade-up
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌─────────────────────────────────────┐
 *   │ ████████████████████████████████████│ ← ligne colorée (accentColor)
 *   │                                     │
 *   │  [ICÔNE]                            │
 *   │                                     │
 *   │  45.2  %                            │ ← grande valeur + unité
 *   │  Ensablement moyen                  │ ← label
 *   │                                     │
 *   │  ┌──────────────┐                   │
 *   │  │  ▲ +2.5%    │                    │ ← badge
 *   │  └──────────────┘                   │
 *   └─────────────────────────────────────┘
 */
export default function KpiCard({
  icon: Icon,          // Renomme 'icon' en 'Icon' pour l'utiliser comme composant
  label,
  value,
  unit,
  badge,
  accentColor,
  delay = '0s',        // Délai par défaut = 0s (pas de délai)
}: KpiCardProps) {
  return (
    <div
      className="fade-up"  // Animation CSS (fondu + translation)
      style={{
        background: C.surface,              // Fond de la carte
        border: `1px solid ${C.border}`,   // Bordure subtile
        borderRadius: 14,                  // Coins arrondis
        padding: '18px 20px',              // Espacement interne
        boxShadow: '0 1px 3px rgba(13,82,52,.06), 0 4px 16px rgba(13,82,52,.05)', // Ombre légère
        position: 'relative',              // Pour positionner la ligne absolue
        overflow: 'hidden',                // Cache les débordements
        animationDelay: delay,             // Délai pour l'animation cascade
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
            letterSpacing: '-.5px',            // Espacement négatif pour élégance
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 3 }}>
          {unit}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 4. LABEL DESCRIPTIF */}
      {/* ======================================================== */}
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
        {label}
      </div>

      {/* ======================================================== */}
      {/* 5. BADGE */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'inline-block',
          marginTop: 7,
          padding: '3px 9px',
          borderRadius: 99,                  // Coins complètement arrondis (pilule)
          fontSize: 10.5,
          fontWeight: 600,
          background: `${accentColor}18`,     // Fond transparent coloré (10% d'opacité)
          color: accentColor,                // Texte de la même couleur
        }}
      >
        {badge}
      </div>
    </div>
  );
}