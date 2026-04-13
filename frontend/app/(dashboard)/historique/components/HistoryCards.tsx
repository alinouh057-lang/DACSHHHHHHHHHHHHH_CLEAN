// components/HistoryCards.tsx
'use client';
import { Clock, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { fmtDateTime, statusColor, statusBg, type Measurement } from '@/lib/api';
import { C } from '@/lib/colors';

interface HistoryCardsProps {
  data: Measurement[];
}

export default function HistoryCards({ data }: HistoryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {data.slice(0, 12).map((doc, index) => {
        const ai = doc.ai_analysis;
        const ed = doc.electrical_data;
        const sc = statusColor(ai.status);
        const StatusIcon = ai.status === 'Clean' ? CheckCircle : ai.status === 'Warning' ? AlertTriangle : AlertCircle;
        return (
          <div
            key={`card-${doc._id || `${doc.timestamp}-${doc.device_id}`}-${index}`}
            style={{
              background: C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 16,
              borderTop: `3px solid ${sc}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.text3 }}>
                <Clock size={12} style={{ marginRight: 4 }} />
                {fmtDateTime(doc.timestamp)}
              </span>
              <span style={{
                padding: '3px 8px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: statusBg(ai.status),
                color: sc,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <StatusIcon size={12} />
                {ai.status}
              </span>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: sc }}>{ai.soiling_level.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: C.text3 }}>Ensablement</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ed.power_output.toFixed(0)} W</div><div style={{ fontSize: 10, color: C.text3 }}>Puissance</div></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ed.voltage.toFixed(1)} V</div><div style={{ fontSize: 10, color: C.text3 }}>Tension</div></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ed.current.toFixed(2)} A</div><div style={{ fontSize: 10, color: C.text3 }}>Courant</div></div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{(ai.confidence * 100).toFixed(0)}%</div><div style={{ fontSize: 10, color: C.text3 }}>Confiance</div></div>
            </div>
            
            <div style={{ marginTop: 12, fontSize: 11, color: C.text2 }}>{doc.device_id}</div>
          </div>
        );
      })}
    </div>
  );
}