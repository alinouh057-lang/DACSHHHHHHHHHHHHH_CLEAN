// ============================================================================
// FICHIER: TimeRangeSelector.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un sélecteur de plage temporelle permettant
//   à l'utilisateur de choisir la période d'affichage des données dans les
//   graphiques et les statistiques de la page Énergie (24h, 7j, 30j, 3 mois, tout).
//
// 🎨 FONCTIONNALITÉS:
//   - Boutons pour les différentes plages temporelles
//   - Mise en surbrillance du bouton actif (fond vert, texte blanc)
//   - Désign des autres boutons (transparent, texte gris)
//   - Animations de transition fluides
//   - Design compact intégré dans la barre d'outils
//
// 📦 PROPS (entrées):
//   - value   : Plage actuellement sélectionnée ("24h", "7d", "30d", "90d", "all")
//   - onChange: Fonction appelée quand l'utilisateur change la plage
//
// 🎨 PLAGES DISPONIBLES:
//   - "24h"  : 24 heures (jour)
//   - "7d"   : 7 jours (semaine)
//   - "30d"  : 30 jours (mois)
//   - "90d"  : 90 jours (3 mois)
//   - "all"  : Toutes les données (pas de limite)
//
// 💡 UTILISATION:
//   const [timeRange, setTimeRange] = useState('24h');
//   <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
//
// ============================================================================

'use client';

import { C } from '@/lib/colors';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7j' },
    { id: '30d', label: '30j' },
    { id: '90d', label: '3 mois' },
    { id: 'all', label: 'Tout' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: C.surface2,
        borderRadius: 6,
        padding: 2,
      }}
    >
      {ranges.map(range => (
        <button
          key={range.id}
          onClick={() => onChange(range.id)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            background: value === range.id ? C.green : 'transparent',
            color: value === range.id ? 'white' : C.text2,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}