// ============================================================================
// FICHIER: TimeRangeSelector.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un sélecteur de plage temporelle permettant
//   à l'utilisateur de choisir la période d'affichage des données dans les
//   graphiques et les statistiques du dashboard (24h, 7 jours, 30 jours, tout).
//
// 🎨 FONCTIONNALITÉS:
//   - Boutons pour les différentes plages temporelles
//   - Mise en surbrillance du bouton actif (fond vert, texte blanc)
//   - Désign des autres boutons (transparent, texte gris)
//   - Animations de transition fluides
//   - Design compact intégré dans la barre d'outils
//
// 📦 PROPS (entrées):
//   - value   : Plage actuellement sélectionnée ("24h", "7d", "30d", "all")
//   - onChange: Fonction appelée quand l'utilisateur change la plage
//
// 🎨 PLAGES DISPONIBLES:
//   - "24h" : 24 heures (jour)
//   - "7d"  : 7 jours (semaine)
//   - "30d" : 30 jours (mois)
//   - "all" : Toutes les données (pas de limite)
//
// 💡 UTILISATION:
//   const [timeRange, setTimeRange] = useState('24h');
//   <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
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

interface TimeRangeSelectorProps {
  value: string;                      // Plage actuelle ("24h", "7d", "30d", "all")
  onChange: (range: string) => void;  // Fonction de rappel quand la plage change
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Sélecteur de plage temporelle pour les graphiques du dashboard.
 * 
 * 📥 PROPS:
 *   - value   : Plage actuellement sélectionnée
 *   - onChange: Fonction appelée avec la nouvelle plage
 * 
 * 📤 RENDU:
 *   ┌─────────────────────────────────────────┐
 *   │  [ 24h ]  [ 7j ]  [ 30j ]  [ Tout ]    │
 *   └─────────────────────────────────────────┘
 *   ↑ bouton actif en vert, les autres en gris
 * 
 * 🎨 DESIGN:
 *   - Conteneur: fond gris clair (C.surface2), coins arrondis (6px)
 *   - Boutons: padding 4px 12px, coins arrondis (4px)
 *   - Bouton actif: fond vert (C.green), texte blanc
 *   - Bouton inactif: fond transparent, texte gris (C.text2)
 *   - Animation: transition sur les propriétés CSS
 * 
 * 💡 INTERACTION:
 *   Au clic sur un bouton, onChange est appelé avec l'ID de la plage.
 *   Le composant parent utilise cette valeur pour filtrer les données
 *   des graphiques (PowerChart, SoilingChart, etc.)
 */
export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  // ============================================================
  // DÉFINITION DES PLAGES DISPONIBLES
  // ============================================================
  const ranges = [
    { id: '24h', label: '24h' },   // 24 heures (jour)
    { id: '7d', label: '7j' },      // 7 jours (semaine)
    { id: '30d', label: '30j' },    // 30 jours (mois)
    { id: 'all', label: 'Tout' },   // Toutes les données
  ];

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: C.surface2,    // Fond gris clair
        borderRadius: 6,           // Coins arrondis du conteneur
        padding: 2,                // Espacement interne
      }}
    >
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onChange(range.id)}  // Appelle onChange avec l'ID de la plage
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            // Style différent selon que le bouton est actif ou non
            background: value === range.id ? C.green : 'transparent',
            color: value === range.id ? 'white' : C.text2,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--tr)',  // Variable CSS pour transition fluide
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}