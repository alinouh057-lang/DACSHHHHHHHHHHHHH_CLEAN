// components/SeverityBadge.tsx
'use client';
import { severityColors } from '../constants/alertsConstants';

interface SeverityBadgeProps {
  severity: string;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityColors[severity as keyof typeof severityColors] || severityColors.info;
  const Icon = config.icon;
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: '4px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <Icon size={10} />
      {severity === 'critical' ? 'Critique' : severity === 'warning' ? 'Warning' : 'Info'}
    </span>
  );
}