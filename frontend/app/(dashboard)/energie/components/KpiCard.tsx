// ============================================================================
// FICHIER: KpiCard.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une carte d'indicateur clé de performance (KPI)
//   pour la page Énergie. Chaque carte présente une métrique importante
//   comme la puissance, l'énergie produite, les pertes, etc.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage d'une icône personnalisée (Lucide React)
//   - Valeur principale en grand format (ex: "45.2")
//   - Unité associée (ex: "%", "W", "kWh")
//   - Label descriptif (ex: "Puissance moyenne")
//   - Ligne colorée en haut selon la métrique
//   - Design épuré et moderne
//
// 📦 PROPS (entrées):
//   - icon        : Composant icône (Lucide) - REQUIS
//   - label       : Texte descriptif (ex: "Puissance moyenne") - REQUIS
//   - value       : Valeur à afficher (ex: "45.2") - REQUIS
//   - unit        : Unité de mesure (ex: "%", "W", "kWh") - REQUIS
//   - accentColor : Couleur d'accentuation (ex: "#1a7f4f") - REQUIS
//
// 🎨 THÈME:
//   - Utilise les couleurs globales depuis '@/lib/colors'
//   - C.surface : fond de la carte
//   - C.border  : couleur de bordure
//   - C.text    : couleur du texte principal
//
// 📊 EXEMPLE D'UTILISATION:
//   <KpiCard
//     icon={Zap}
//     label="Puissance moyenne"
//     value="125.3"
//     unit="W"
//     accentColor="#1a7f4f"
//   />
//
// ============================================================================

'use client';

import { C } from '@/lib/colors';

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accentColor: string;
}

export default function KpiCard({ icon: Icon, label, value, unit, accentColor }: KpiCardProps) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(13,82,52,.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: '14px 14px 0 0',
        }}
      />
      <div style={{ fontSize: 20, marginBottom: 10 }}>
        <Icon size={24} color={accentColor} />
      </div>
      <div>
        <span
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 26,
            fontWeight: 800,
            color: C.text,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{label}</div>
    </div>
  );
}