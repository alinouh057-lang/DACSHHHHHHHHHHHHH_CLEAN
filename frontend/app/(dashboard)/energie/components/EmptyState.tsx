// ============================================================================
// FICHIER: EmptyState.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un état vide pour les graphiques et cartes
//   de la page Énergie. Il est utilisé lorsqu'aucune donnée n'est disponible
//   ou pendant le chargement des données.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage centré avec icône, titre et message
//   - Icône personnalisée (Lucide React)
//   - Design épuré avec fond gris clair
//   - Opacité réduite sur l'icône pour effet discret
//
// 📦 PROPS (entrées):
//   - icon  : Composant icône (Lucide) - REQUIS
//   - title : Titre principal (ex: "Aucune donnée disponible") - REQUIS
//   - message : Message secondaire explicatif - REQUIS
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface2 : fond de l'état vide
//   - C.text3 : couleur du texte
//
// 📊 EXEMPLES D'UTILISATION:
//   <EmptyState
//     icon={Zap}
//     title="Aucune donnée disponible"
//     message="Aucune mesure dans la période sélectionnée"
//   />
//   <EmptyState
//     icon={Gauge}
//     title="Données non disponibles"
//     message="Données de tension / courant non disponibles pour cette période"
//   />
//
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { C } from '@/lib/colors';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div
      style={{
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.surface2,
        borderRadius: 10,
        color: C.text3,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Icon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>{message}</div>
      </div>
    </div>
  );
}