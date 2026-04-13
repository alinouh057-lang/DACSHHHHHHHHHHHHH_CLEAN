// ============================================================================
// FICHIER: StatCard.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une petite carte statistique compacte pour
//   afficher des métriques secondaires ou des indicateurs dans le dashboard.
//   Il est idéal pour présenter des valeurs comme la température, la tension,
//   le courant, l'irradiance, etc.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage d'une valeur numérique formatée (avec décimales configurables)
//   - Unité de mesure (ex: "W", "V", "A", "°C", "W/m²")
//   - Icône colorée (Lucide React)
//   - Label descriptif
//   - Design compact (padding réduit)
//   - Animation au survol (transform + background)
//
// 📦 PROPS (entrées):
//   - value    : Valeur numérique à afficher - REQUIS
//   - unit     : Unité de mesure (ex: "W", "V", "%") - REQUIS
//   - label    : Texte descriptif (ex: "Température") - REQUIS
//   - color    : Couleur de la valeur et de l'icône - REQUIS
//   - icon     : Composant icône (Lucide React) - REQUIS
//   - decimals : Nombre de décimales (défaut: 0) - OPTIONNEL
//
// 🎨 COULEURS TYPIQUES:
//   - Température : C.red ou C.amber
//   - Tension     : C.blue
//   - Courant     : C.green
//   - Irradiance  : C.orange
//
// 📊 EXEMPLES D'UTILISATION:
//   <StatCard value={42.5} unit="°C" label="Température" color={C.red} icon={Thermometer} decimals={1} />
//   <StatCard value={24.8} unit="V" label="Tension" color={C.blue} icon={Zap} decimals={1} />
//   <StatCard value={8.2} unit="A" label="Courant" color={C.green} icon={Activity} decimals={1} />
//   <StatCard value={850} unit="W/m²" label="Irradiance" color={C.orange} icon={Sun} decimals={0} />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client

import { C } from '@/lib/colors';  // Palette de couleurs globale

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface StatCardProps {
  value: number;           // Valeur numérique à afficher
  unit: string;            // Unité de mesure (ex: "W", "V", "°C")
  label: string;           // Texte descriptif (ex: "Température")
  color: string;           // Couleur de la valeur et de l'icône
  icon: React.ElementType; // Composant icône (Lucide React)
  decimals?: number;       // Nombre de décimales (défaut: 0)
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Carte statistique compacte pour afficher des métriques secondaires.
 * 
 * 📥 PROPS:
 *   - value    : Valeur numérique (ex: 42.5)
 *   - unit     : Unité (ex: "°C", "W", "V", "A")
 *   - label    : Label descriptif (ex: "Température")
 *   - color    : Couleur (ex: C.red, C.blue, C.green)
 *   - icon     : Icône Lucide React (ex: Thermometer, Zap, Sun)
 *   - decimals : Nombre de décimales (défaut: 0)
 * 
 * 📤 RENDU:
 *   ┌─────────────────────────┐
 *   │        42.5 °C          │ ← valeur + unité
 *   │    🔥 Température       │ ← icône + label
 *   └─────────────────────────┘
 * 
 * 🎨 DESIGN:
 *   - Fond: C.surface2 (gris très clair)
 *   - Coins arrondis: 12px
 *   - Animation hover: léger agrandissement + changement de fond
 *   - Texte centré
 *   - Espacement compact (12px 8px)
 * 
 * 💡 UTILISATION TYPIQUE:
 *   Utilisé dans le dashboard pour afficher les métriques des panneaux
 *   solaires (température, tension, courant, irradiance) de manière
 *   compacte et visuellement cohérente.
 */
export default function StatCard({
  value,
  unit,
  label,
  color,
  icon: Icon,           // Renomme 'icon' en 'Icon' pour l'utiliser comme composant
  decimals = 0,         // Par défaut: 0 décimale (entier)
}: StatCardProps) {
  // ============================================================
  // FORMATAGE DE LA VALEUR
  // ============================================================
  // Vérifie que la valeur est un nombre valide, sinon affiche "0"
  const formatted = typeof value === 'number' && !isNaN(value) 
    ? value.toFixed(decimals)   // Formate avec le nombre de décimales demandé
    : '0';

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div
      style={{
        background: C.surface2,              // Fond gris très clair
        borderRadius: 12,                    // Coins arrondis
        padding: '12px 8px',                 // Espacement interne compact
        textAlign: 'center',                 // Centrage du texte
        transition: 'transform 0.2s ease, background 0.2s ease',  // Animation hover
        cursor: 'default',                   // Curseur par défaut (pas cliquable)
      }}
    >
      {/* ======================================================== */}
      {/* LIGNE 1 : VALEUR + UNITÉ */}
      {/* ======================================================== */}
      <div
        style={{
          fontFamily: 'Sora, sans-serif',    // Police moderne
          fontSize: 20,                      // Taille de la valeur
          fontWeight: 700,                   // Gras
          color,                             // Couleur (ex: rouge pour température)
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 2,
          marginBottom: 4,
        }}
      >
        <span>{formatted}</span>             {/* Valeur formatée */}
        {unit && <span style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>{unit}</span>}
      </div>

      {/* ======================================================== */}
      {/* LIGNE 2 : ICÔNE + LABEL */}
      {/* ======================================================== */}
      <div
        style={{
          fontSize: 10,
          color: C.text3,
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Icon size={11} color={color} />      
        {label}                               
      </div>
    </div>
  );
}