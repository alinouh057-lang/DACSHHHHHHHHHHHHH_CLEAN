// components/AlertCounters.tsx
'use client';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface AlertCountersProps {
  critical: number;
  warning: number;
  clean: number;
}

export default function AlertCounters({ critical, warning, clean }: AlertCountersProps) {
  const counters = [
    { val: critical, label: 'Urgent (Critical)', icon: AlertTriangle, color: C.red },
    { val: warning, label: 'À surveiller (Warning)', icon: AlertCircle, color: C.amber },
    { val: clean, label: 'OK (Clean)', icon: CheckCircle, color: C.green },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
      {counters.map((k, i) => (
        <div key={k.label} className="fade-up" style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '20px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(13,82,52,.06)',
          borderTop: `3px solid ${k.color}`,
          animationDelay: `${i * .05}s`,
        }}>
          <k.icon size={32} color={k.color} style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: 'Sora', fontSize: 36, fontWeight: 800, color: k.color }}>{k.val}</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{k.label}</div>
        </div>
      ))}
    </div>
  );
}