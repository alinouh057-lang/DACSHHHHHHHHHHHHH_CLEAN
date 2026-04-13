// components/StatsTab.tsx
'use client';
import { BarChart3, Smartphone, Activity } from 'lucide-react';
import { C } from '@/lib/colors';
import { typeLabels, typeIcons } from '../constants/alertsConstants';

interface StatsTabProps {
  alertsByType: Record<string, number>;
  alertsByDevice: Record<string, number>;
  resolvedAlertsCount: number;
  totalAlertsCount: number;
  averageResponseTime: number;
}

export default function StatsTab({
  alertsByType,
  alertsByDevice,
  resolvedAlertsCount,
  totalAlertsCount,
  averageResponseTime,
}: StatsTabProps) {
  const totalByType = Object.values(alertsByType).reduce((a, b) => a + b, 0);
  const totalByDevice = Object.values(alertsByDevice).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      
      {/* Alertes par type */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={16} color={C.blue} />
          Alertes par type
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(alertsByType).map(([type, count]) => (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {typeIcons[type] || <Activity size={12} />}
                  {typeLabels[type as keyof typeof typeLabels] || type}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{count}</span>
              </div>
              <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(count / Math.max(totalByType, 1)) * 100}%`,
                  background: C.blue,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes par dispositif */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Smartphone size={16} color={C.green} />
          Alertes par dispositif
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(alertsByDevice).slice(0, 5).map(([deviceId, count]) => (
            <div key={deviceId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.text2 }}>{deviceId}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{count}</span>
              </div>
              <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(count / Math.max(totalByDevice, 1)) * 100}%`,
                  background: C.green,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métriques globales */}
      <div style={{
        gridColumn: 'span 2',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={16} color={C.amber} />
          Métriques de performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.green }}>{averageResponseTime} min</div>
            <div style={{ fontSize: 11, color: C.text3 }}>Temps de réponse moyen</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{resolvedAlertsCount}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>Alertes résolues</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.amber }}>
              {totalAlertsCount > 0 ? ((resolvedAlertsCount / totalAlertsCount) * 100).toFixed(0) : 0}%
            </div>
            <div style={{ fontSize: 11, color: C.text3 }}>Taux de résolution</div>
          </div>
        </div>
      </div>
    </div>
  );
}