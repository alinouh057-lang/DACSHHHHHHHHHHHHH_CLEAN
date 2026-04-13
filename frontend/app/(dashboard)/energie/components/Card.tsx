// ============================================================================
// FICHIER: Card.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React est un conteneur générique (wrapper) pour créer des
//   cartes dans la page Énergie. Il applique un style cohérent à toutes les
//   cartes : fond, bordure, coins arrondis, ombre portée.
//
// 🎨 FONCTIONNALITÉS:
//   - Conteneur avec style prédéfini
//   - Support des enfants React (children)
//   - Style personnalisable via prop optionnelle
//   - Design cohérent avec le thème de l'application
//
// 📦 PROPS (entrées):
//   - children : Contenu de la carte (composants, texte, etc.) - REQUIS
//   - style    : Styles CSS supplémentaires à appliquer - OPTIONNEL
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface : fond de la carte
//   - C.border  : couleur de bordure
//   - Ombre portée légère pour effet de profondeur
//
// 📊 EXEMPLES D'UTILISATION:
//   <Card>
//     <KpiCard icon={Zap} label="Puissance" value="125.3" unit="W" accentColor="#1a7f4f" />
//   </Card>
//   <Card style={{ marginTop: 20 }}>
//     <PowerChart data={data} />
//   </Card>
//
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: '0 1px 3px rgba(13,82,52,.06), 0 4px 16px rgba(13,82,52,.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}