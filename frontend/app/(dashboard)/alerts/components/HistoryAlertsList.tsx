// components/HistoryAlertsList.tsx
'use client';
import { Clock, CheckCircle, Info, Loader } from 'lucide-react';
import { C } from '@/lib/colors';
import SeverityBadge from './SeverityBadge';
import TypeBadge from './TypeBadge';
import { severityColors } from '../constants/alertsConstants';
import { formatLocalDateTime } from '../utils/alertsUtils';

interface HistoryAlertsListProps {
  alerts: any[];
  loading: boolean;
}

export default function HistoryAlertsList({ alerts, loading }: HistoryAlertsListProps) {
  if (loading && alerts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>
        <Loader size={32} className="spin" />
        <div style={{ marginTop: 12 }}>Chargement...</div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: C.surface2,
        borderRadius: 10,
        color: C.text3,
      }}>
        <Info size={48} color={C.text3} style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 16, fontWeight: 500 }}>Aucun historique</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((alert, idx) => {
        const severity = severityColors[alert.severity as keyof typeof severityColors] || severityColors.info;
        const SeverityIcon = severity.icon;
        return (
          <div
            key={`history-${alert.id}-${idx}`}
            style={{
              background: C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '12px',
              opacity: 0.8,
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <SeverityIcon size={16} color={severity.color} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <SeverityBadge severity={alert.severity} />
                  <TypeBadge type={alert.type} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>
                  {alert.message}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10, color: C.text3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {formatLocalDateTime(alert.timestamp)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={10} /> Résolue: {alert.resolved_at ? formatLocalDateTime(alert.resolved_at) : '-'}
                  </span>
                  {alert.resolution_notes && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={10} /> {alert.resolution_notes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}