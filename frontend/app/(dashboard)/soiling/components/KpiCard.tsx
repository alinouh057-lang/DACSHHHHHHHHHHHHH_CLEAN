// components/KpiCard.tsx
'use client';
import { C } from '@/lib/colors';

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  badge: string;
  accentColor: string;
  subtext?: string;
}

export default function KpiCard({ icon: Icon, label, value, unit, badge, accentColor, subtext }: KpiCardProps) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(13,82,52,.06), 0 4px 16px rgba(13,82,52,.05)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Barre de couleur en haut */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '14px 14px 0 0' }} />
      
      {/* En-tête avec badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 20 }}>
          <Icon size={24} color={accentColor} />
        </div>
        <span style={{
          padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 600,
          background: `${accentColor}18`, color: accentColor,
        }}>{badge}</span>
      </div>
      
      {/* Valeur principale */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-.5px' }}>
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 3 }}>{unit}</span>
      </div>
      
      {/* Label et sous-texte optionnel */}
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{label}</div>
      {subtext && <div style={{ fontSize: 10, color: C.text3, marginTop: 6 }}>{subtext}</div>}
    </div>
  );
}