// ============================================================================
// FICHIER: TimeRangeSelector.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un sélecteur de plage temporelle sous forme
//   de boutons segmentés. Il permet à l'utilisateur de filtrer les données
//   énergétiques affichées sur la page Analyse Énergétique.
//
// 🎨 FONCTIONNALITÉS:
//   - 5 options de plage temporelle : 24h, 7j, 30j, 3 mois, Tout
//   - Bouton actif mis en évidence (fond vert)
//   - Boutons inactifs avec fond transparent
//   - Transition fluide entre les états
//   - Design compact et moderne
//
// 📦 PROPS (entrées):
//   - value    : Plage temporelle sélectionnée (ex: "24h", "7d") - REQUIS
//   - onChange : Callback lors du changement de plage - REQUIS
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface2 : fond du conteneur
//   - C.green    : couleur du bouton actif
//   - C.text2    : couleur du texte inactif
//
// 📊 EXEMPLE D'UTILISATION:
//   const [timeRange, setTimeRange] = useState('all');
//   
//   <TimeRangeSelector 
//     value={timeRange} 
//     onChange={setTimeRange} 
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

interface TimeRangeSelectorProps {
  value: string;              // Plage temporelle actuellement sélectionnée
  onChange: (range: string) => void;  // Callback lors du changement
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Sélecteur de plage temporelle pour la page énergie.
 * 
 * 📥 PROPS:
 *   - value    : ID de la plage sélectionnée ("24h", "7d", "30d", "90d", "all")
 *   - onChange : Fonction appelée avec le nouvel ID lors du clic
 * 
 * 📤 RENDU: Conteneur flexbox avec 5 boutons :
 *   - 24h   : dernières 24 heures
 *   - 7j    : derniers 7 jours
 *   - 30j   : derniers 30 jours
 *   - 3 mois: derniers 90 jours
 *   - Tout  : toutes les données disponibles
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌──────────────────────────────────────────────┐
 *   │ [24h] [7j] [30j] [3 mois] [Tout]            │
 *   │       ████                                   │ ← bouton actif (vert)
 *   └──────────────────────────────────────────────┘
 */
export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  // Liste des plages temporelles disponibles
  const ranges = [
    { id: '24h', label: '24h' },      // Dernières 24 heures
    { id: '7d', label: '7j' },        // Derniers 7 jours
    { id: '30d', label: '30j' },      // Derniers 30 jours
    { id: '90d', label: '3 mois' },   // Derniers 3 mois (90 jours)
    { id: 'all', label: 'Tout' },     // Toutes les données
  ];

  return (
    <div
      style={{
        display: 'flex',               // Flexbox pour aligner les boutons
        gap: 4,                        // Espacement entre boutons
        background: C.surface2,        // Fond du conteneur
        borderRadius: 6,               // Coins arrondis
        padding: 2,                    // Padding interne minimal
      }}
    >
      {/* ======================================================== */}
      {/* RENDERISATION DES BOUTONS */}
      {/* ======================================================== */}
      {ranges.map(range => (
        <button
          key={range.id}               // Clé unique pour React
          onClick={() => onChange(range.id)}  // Callback au clic
          style={{
            padding: '4px 12px',       // Espacement interne
            borderRadius: 4,           // Coins légèrement arrondis
            border: 'none',            // Pas de bordure
            background: value === range.id ? C.green : 'transparent', // Fond si actif
            color: value === range.id ? 'white' : C.text2, // Texte blanc si actif
            fontSize: 11,              // Petite taille de police
            fontWeight: 600,           // Gras
            cursor: 'pointer',         // Curseur main
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}