// components/ActiveAlertsList.tsx
'use client';
import { Clock, Smartphone, Activity, Check, CheckCircle, Loader } from 'lucide-react';
import { C } from '@/lib/colors';
import SeverityBadge from './SeverityBadge';
import TypeBadge from './TypeBadge';
import { severityColors } from '../constants/alertsConstants';
import { formatLocalDateTime } from '../utils/alertsUtils';

interface ActiveAlertsListProps {
  alerts: any[];
  loading: boolean;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

export default function ActiveAlertsList({ alerts, loading, onAcknowledge, onResolve }: ActiveAlertsListProps) {
  if (loading && alerts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>
        <Loader size={32} className="spin" />
        <div style={{ marginTop: 12 }}>Chargement des alertes...</div>
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
        <CheckCircle size={48} color={C.green} style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 16, fontWeight: 500 }}>Aucune alerte active</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Tout est en ordre !</div>
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
            key={`active-${alert.id}-${idx}`}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${severity.color}`,
              borderRadius: 8,
              padding: '16px',
              opacity: alert.acknowledged ? 0.8 : 1,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                <div style={{ marginTop: 2 }}>
                  <SeverityIcon size={20} color={severity.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <SeverityBadge severity={alert.severity} />
                    <TypeBadge type={alert.type} />
                    {!alert.acknowledged && (
                      <span style={{
                        background: C.amberL,
                        color: C.amber,
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 600,
                      }}>
                        NON LU
                      </span>
                    )}
                  </div>
                  
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 13, color: C.text2, marginBottom: 8 }}>
                    {alert.message}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 11, color: C.text3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {formatLocalDateTime(alert.timestamp)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Smartphone size={12} /> {alert.device_id}
                    </span>
                    {alert.value && alert.threshold && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Activity size={12} /> {alert.value.toFixed(1)} / seuil {alert.threshold.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: C.blueL,
                      color: C.blue,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={12} />
                    Marquer lu
                  </button>
                )}
                <button
                  onClick={() => onResolve(alert.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: C.greenL,
                    color: C.green,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCircle size={12} />
                  Résoudre
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}