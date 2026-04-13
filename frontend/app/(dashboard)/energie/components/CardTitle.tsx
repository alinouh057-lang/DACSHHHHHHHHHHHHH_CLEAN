// ============================================================================
// FICHIER: CardTitle.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un titre de carte standardisé pour la page
//   Énergie. Il inclut un point coloré, une icône, le texte du titre et
//   éventuellement un élément supplémentaire à droite (bouton, sélecteur, etc.).
//
// 🎨 FONCTIONNALITÉS:
//   - Point coloré indicateur (par défaut vert)
//   - Icône Lucide React
//   - Texte du titre en majuscules
//   - Élément optionnel à droite (pour boutons, sélecteurs, etc.)
//   - Style cohérent avec le thème de l'application
//
// 📦 PROPS (entrées):
//   - dot   : Couleur du point indicateur (défaut: C.green) - OPTIONNEL
//   - icon  : Composant icône (Lucide) - REQUIS
//   - text  : Texte du titre - REQUIS
//   - right : Élément React à afficher à droite - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.text3 : couleur du texte (gris clair)
//   - C.green : couleur par défaut du point
//
// 📊 EXEMPLES D'UTILISATION:
//   <CardTitle icon={Zap} text="Puissance" />
//   <CardTitle icon={Activity} text="Évolution" right={<TimeRangeSelector value={range} onChange={setRange} />} />
//   <CardTitle dot="#c47d0e" icon={AlertTriangle} text="Pertes" />
//
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface CardTitleProps {
  dot?: string;
  icon: React.ElementType;
  text: string;
  right?: ReactNode;
}

export default function CardTitle({ dot = C.green, icon: Icon, text, right }: CardTitleProps) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        color: C.text3,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
        <Icon size={14} />
        {text}
      </div>
      {right}
    </div>
  );
}