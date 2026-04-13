// components/SoilingGauge.tsx
'use client';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { statusColor, statusBg } from '@/lib/api';
import { C } from '@/lib/colors';

interface SoilingGaugeProps {
  level: number;
  status: string;
  confidence?: number;
}

export default function SoilingGauge({ level, status, confidence }: SoilingGaugeProps) {
  const color = statusColor(status);
  const segments = [
    { label: 'Clean',    max: 30,  color: C.green },
    { label: 'Warning',  max: 60,  color: C.amber },
    { label: 'Critical', max: 100, color: C.red   },
  ];

  const getStatusIcon = () => {
    switch(status) {
      case 'Clean': return <CheckCircle size={14} />;
      case 'Warning': return <AlertCircle size={14} />;
      case 'Critical': return <AlertTriangle size={14} />;
      default: return <Info size={14} />;
    }
  };

  // Sécurisation des valeurs (évite NaN)
  const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
  const safeConfidence = typeof confidence === 'number' && !isNaN(confidence) ? confidence : 0;

  return (
    <div>
      {/* En-tête avec valeur et statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, color }}>
          {safeLevel.toFixed(1)}%
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {confidence !== undefined && (
            <span style={{ fontSize: 11, color: C.text3 }}>
              Confiance: {(safeConfidence * 100).toFixed(0)}%
            </span>
          )}
          <span style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: statusBg(status), color,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {getStatusIcon()} {status}
          </span>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div style={{ height: 10, borderRadius: 99, background: C.surface2, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${safeLevel}%`,
          background: `linear-gradient(90deg, ${C.green}, ${color})`,
          borderRadius: 99, transition: 'width .8s ease',
        }} />
        
        {/* Marqueurs de seuil */}
        {segments.map(s => (
          <div key={s.label} style={{
            position: 'absolute', top: 0, left: `${s.max}%`,
            height: '100%', width: 1, background: C.border,
            transform: 'translateX(-50%)',
          }} />
        ))}
      </div>
      
      {/* Labels des seuils */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {segments.map(s => (
          <span key={s.label} style={{ fontSize: 10, color: C.text3 }}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}