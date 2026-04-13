// ============================================================================
// FICHIER: LegendDot.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un petit point coloré pour les légendes de
//   graphiques dans la page Énergie. Il est utilisé dans les légendes
//   personnalisées des graphiques Recharts pour identifier les séries de données.
//
// 🎨 FONCTIONNALITÉS:
//   - Point carré avec coins arrondis
//   - Couleur personnalisable
//   - Label texte associé
//   - Option pour style "dashed" (bordure en pointillés)
//   - Design compact et cohérent
//
// 📦 PROPS (entrées):
//   - color  : Couleur du point (ex: "#1a7f4f") - REQUIS
//   - label  : Texte du label - REQUIS
//   - dashed : true pour style bordure pointillée (défaut: false) - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.text2 : couleur du texte (gris moyen)
//
// 📊 EXEMPLES D'UTILISATION:
//   <LegendDot color={C.green} label="Réelle" />
//   <LegendDot color={C.blue} label="Théorique" dashed />
//   <LegendDot color={C.amber} label="Perte" />
//
// ============================================================================

'use client';

import { C } from '@/lib/colors';

interface LegendDotProps {
  color: string;
  label: string;
  dashed?: boolean;
}

export default function LegendDot({ color, label, dashed = false }: LegendDotProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          ...(dashed && { background: 'transparent', border: `1.5px dashed ${color}` }),
        }}
      />
      <span style={{ fontSize: 10, color: C.text2 }}>{label}</span>
    </div>
  );
}