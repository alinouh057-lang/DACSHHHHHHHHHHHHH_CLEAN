// components/AlertsList.tsx
'use client';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { fmtDateTime, statusColor, type Measurement } from '@/lib/api';
import { C } from '@/lib/colors';

interface AlertsListProps {
  alerts: Measurement[];
  onPlanifier: () => void;
}

export default function AlertsList({ alerts, onPlanifier }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 9, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}` }}>
        <CheckCircle size={16} color={C.green} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Aucune alerte récente</span>
      </div>
    );
  }

  return (
    <>
      {alerts.slice(0, 8).map((doc, i) => {
        const sc = statusColor(doc.ai_analysis.status);
        const Icon = doc.ai_analysis.status === 'Critical' ? AlertCircle : 
                    doc.ai_analysis.status === 'Warning' ? AlertTriangle : CheckCircle;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 11,
            padding: '11px 13px', borderRadius: 9,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${sc}`,
            marginBottom: 7,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0, marginTop: 5 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon size={14} color={sc} />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: sc }}>{doc.ai_analysis.status}</span>
                <span style={{ fontSize: 12, color: C.text2 }}>— {doc.ai_analysis.soiling_level.toFixed(1)}%</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.text3, marginTop: 1 }}>
                {fmtDateTime(doc.timestamp)} · {doc.device_id}
              </div>
            </div>
            <button
              onClick={onPlanifier}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                background: C.surface2,
                color: C.text2,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Planifier
            </button>
          </div>
        );
      })}
    </>
  );
}