// ============================================================================
// FICHIER: CustomTooltip.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une infobulle (tooltip) personnalisée pour
//   les graphiques de la page Énergie (Recharts). Il s'affiche lorsque l'utilisateur
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
//   - Chaque série a sa propre couleur (ex: tension, courant, puissance)
//
// 📊 EXEMPLE D'UTILISATION (Recharts):
//   <LineChart data={data}>
//     <Tooltip content={<CustomTooltip />} />
//     <Line dataKey="volt" stroke="#1565c0" />
//     <Line dataKey="curr" stroke="#1a7f4f" />
//   </LineChart>
//
// ============================================================================

'use client';

import { C } from '@/lib/colors';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 12,
        boxShadow: '0 4px 16px rgba(13,82,52,.10)',
      }}
    >
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div
          key={`${p.name}-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2,
            color: p.color,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: <b>{p.value?.toFixed(1)}{p.unit}</b>
        </div>
      ))}
    </div>
  );
}