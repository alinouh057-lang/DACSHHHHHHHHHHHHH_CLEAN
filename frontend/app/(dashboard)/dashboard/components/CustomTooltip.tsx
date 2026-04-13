// ============================================================================
// FICHIER: CustomTooltip.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une infobulle (tooltip) personnalisée pour
//   les graphiques du dashboard (Recharts). Il s'affiche lorsque l'utilisateur
//   survole un point de données (courbe, barre, etc.) et montre les valeurs
//   détaillées.
//
// 🎨 FONCTIONNALITÉS:
//   - S'affiche uniquement lorsque la souris survole un point actif
//   - Montre la date/valeur du point (label)
//   - Affiche toutes les séries de données avec leur couleur respective
//   - Formatage des valeurs avec 1 décimale + unité
//   - Design moderne avec ombre, coins arrondis, espacement
//
// 📦 PROPS (entrées):
//   - active   : booléen - true quand la souris est sur un point
//   - payload  : array - données des séries (valeur, couleur, nom, unité)
//   - label    : string - étiquette du point (ex: "12:00", "2026-04-11")
//
// 🎨 COULEURS:
//   - Utilise le thème de couleurs global depuis '@/lib/colors'
//   - Chaque série a sa propre couleur (ex: ensablement, puissance)
//
// 📊 EXEMPLE D'UTILISATION (Recharts):
//   <LineChart data={data}>
//     <Tooltip content={<CustomTooltip />} />
//     <Line dataKey="soiling_level" stroke="#c47d0e" />
//     <Line dataKey="power_output" stroke="#1a7f4f" />
//   </LineChart>
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Indique que ce composant doit être exécuté côté client (Next.js)

import { C } from '@/lib/colors';  // Palette de couleurs globales du thème

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface CustomTooltipProps {
  active?: boolean;      // True si la souris est sur un point actif
  payload?: any[];       // Données des séries à afficher
  label?: string;        // Étiquette du point (ex: date, heure)
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Infobulle personnalisée pour les graphiques Recharts.
 * 
 * 📥 PROPS:
 *   - active  : booléen - le tooltip est-il visible ?
 *   - payload : array - données des séries (valeur, couleur, nom, unité)
 *   - label   : string - date/heure du point survolé
 * 
 * 📤 RENDU: Div flottante avec les données formatées
 * 
 * 🔍 FONCTIONNEMENT:
 *   1. Vérifie si active = true et payload non vide
 *   2. Si non → retourne null (rien n'affiche)
 *   3. Sinon → affiche la date (label)
 *   4. Pour chaque série dans payload:
 *      - Affiche un cercle coloré
 *      - Affiche le nom de la série (ex: "Ensablement")
 *      - Affiche la valeur avec 1 décimale + unité
 * 
 * 🎨 DESIGN:
 *   - Fond: couleur surface du thème
 *   - Bordure: couleur border du thème
 *   - Coins arrondis: 10px
 *   - Ombre: légère pour effet de profondeur
 *   - Padding: 12px 16px
 */
export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  // Si le tooltip n'est pas actif ou qu'il n'y a pas de données → ne rien afficher
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: C.surface,           // Fond du thème
        border: `1px solid ${C.border}`, // Bordure du thème
        borderRadius: 10,                // Coins arrondis
        padding: '12px 16px',            // Espacement interne
        fontSize: 12,                    // Taille de police
        boxShadow: '0 4px 16px rgba(13,82,52,.10)', // Ombre légère
      }}
    >
      {/* ======================================================== */}
      {/* 1. ÉTIQUETTE (DATE / HEURE) */}
      {/* ======================================================== */}
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>
        {label}
      </div>

      {/* ======================================================== */}
      {/* 2. SÉRIES DE DONNÉES */}
      {/* ======================================================== */}
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            color: p.color,  // La couleur de la série (ex: orange pour ensablement)
          }}
        >
          {/* Cercle coloré représentant la série */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          
          {/* Nom de la série (ex: "Ensablement (%)") */}
          <span style={{ flex: 1 }}>{p.name}:</span>
          
          {/* Valeur formatée avec 1 décimale + unité */}
          <b>
            {p.value?.toFixed(1)}  {/* Ex: 45.2 */}
            {p.unit}               {/* Ex: % */}
          </b>
        </div>
      ))}
    </div>
  );
}