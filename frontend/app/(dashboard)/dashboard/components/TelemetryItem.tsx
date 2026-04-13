// ============================================================================
// FICHIER: TelemetryItem.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une mesure de télémétrie (données capteurs)
//   dans une carte compacte. Il est utilisé pour afficher les valeurs
//   électriques et environnementales des panneaux solaires comme la tension,
//   le courant, la puissance, l'irradiance, etc.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage d'une valeur numérique formatée
//   - Gestion intelligente des décimales (2 pour le courant, 1 pour les autres)
//   - Unité de mesure (V, A, W, W/m², °C, %)
//   - Icône (Lucide React)
//   - Label en majuscules avec espacement (letter-spacing)
//   - Design minimaliste avec fond secondaire
//
// 📦 PROPS (entrées):
//   - icon  : Composant icône (Lucide React) - REQUIS
//   - value : Valeur numérique à afficher - REQUIS
//   - unit  : Unité de mesure (ex: "V", "A", "W", "W/m²") - REQUIS
//   - label : Texte descriptif (ex: "Tension", "Courant") - REQUIS
//
// 🎨 DÉCIMALES AUTOMATIQUES:
//   - Unité "A" (Ampères)   → 2 décimales (ex: 8.25 A)
//   - Autres unités         → 1 décimale (ex: 24.5 V, 125.3 W)
//   - Valeur invalide       → "--"
//
// 📊 EXEMPLES D'UTILISATION:
//   <TelemetryItem icon={Zap} value={24.5} unit="V" label="Tension" />
//   <TelemetryItem icon={Activity} value={8.25} unit="A" label="Courant" />
//   <TelemetryItem icon={Zap} value={125.3} unit="W" label="Puissance" />
//   <TelemetryItem icon={Sun} value={850} unit="W/m²" label="Irradiance" />
//   <TelemetryItem icon={Thermometer} value={42.5} unit="°C" label="Température" />
//   <TelemetryItem icon={Droplets} value={45.2} unit="%" label="Ensablement" />
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

interface TelemetryItemProps {
  icon: React.ElementType;   // Composant icône (Lucide React)
  value: number;             // Valeur numérique à afficher
  unit: string;              // Unité de mesure (V, A, W, W/m², °C, %)
  label: string;             // Texte descriptif (ex: "Tension", "Courant")
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Carte de télémétrie pour afficher une mesure capteur.
 * 
 * 📥 PROPS:
 *   - icon  : Icône (ex: Zap, Activity, Sun, Thermometer, Droplets)
 *   - value : Valeur numérique (ex: 24.5, 8.25, 125.3)
 *   - unit  : Unité (ex: "V", "A", "W", "W/m²", "°C", "%")
 *   - label : Label (ex: "Tension", "Courant", "Puissance")
 * 
 * 📤 RENDU:
 *   ┌─────────────────────────┐
 *   │       24.5 V            │ ← valeur + unité
 *   │       ⚡ Tension        │ ← icône + label (majuscules)
 *   └─────────────────────────┘
 * 
 * 🎨 DESIGN:
 *   - Fond: C.surface2 (gris très clair)
 *   - Coins arrondis: 10px
 *   - Texte centré
 *   - Label en majuscules (text-transform: uppercase)
 *   - Espacement des lettres: 0.5px (letter-spacing)
 * 
 * 📊 FORMATAGE INTELLIGENT:
 *   - Courant (A)      → 2 décimales (précision pour les petits courants)
 *   - Autres unités    → 1 décimale
 *   - Valeur invalide  → "--" (affiche deux tirets)
 *   - Unité vide       → "--" (affiche deux tirets)
 * 
 * 💡 UTILISATION TYPIQUE:
 *   Utilisé dans le dashboard principal pour afficher les données en
 *   temps réel des capteurs (tension, courant, puissance, température, etc.)
 */
export default function TelemetryItem({ icon: Icon, value, unit, label }: TelemetryItemProps) {
  // ============================================================
  // SÉCURITÉ : Gestion des valeurs invalides
  // ============================================================
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  // ============================================================
  // FORMATAGE DE L'AFFICHAGE
  // ============================================================
  // Si l'unité est vide → afficher "--"
  // Sinon, formater avec le bon nombre de décimales:
  //   - "A" (Ampères) → 2 décimales (ex: 8.25)
  //   - Autres unités → 1 décimale (ex: 24.5)
  const display = unit === '' 
    ? '--' 
    : `${safeValue.toFixed(unit === 'A' ? 2 : 1)} ${unit}`;

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div
      style={{
        background: C.surface2,    // Fond gris très clair
        borderRadius: 10,          // Coins arrondis
        padding: '11px',           // Espacement interne
        textAlign: 'center',       // Centrage du texte
      }}
    >
      {/* ======================================================== */}
      {/* LIGNE 1 : VALEUR + UNITÉ */}
      {/* ======================================================== */}
      <div
        style={{
          fontFamily: 'Sora, sans-serif',  // Police moderne
          fontSize: 19,                    // Taille de la valeur
          fontWeight: 700,                 // Gras
          color: C.text,                   // Couleur du texte principal
        }}
      >
        {display}   
      </div>

      {/* ======================================================== */}
      {/* LIGNE 2 : ICÔNE + LABEL (en majuscules) */}
      {/* ======================================================== */}
      <div
        style={{
          fontSize: 10,
          color: C.text3,
          marginTop: 3,
          textTransform: 'uppercase',       // Texte en majuscules
          letterSpacing: '.5px',            // Espacement entre les lettres
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Icon size={12} />                 
        {label}                             
      </div>
    </div>
  );
}