// constants/alertsConstants.tsx
import { Wrench, Zap, WifiOff, Activity, Thermometer, AlertCircle, Database, AlertTriangle, Info } from 'lucide-react';
import { C } from '@/lib/colors';
import { ReactNode } from 'react';

export const typeLabels: Record<string, string> = {
  soiling: 'Ensablement',
  power_drop: 'Baisse production',
  device_offline: 'Hors ligne',
  low_production: 'Faible production',
  high_temperature: 'Température élevée',
  communication_error: 'Erreur communication',
  system: 'Système',
};

// Maintenant en .tsx, JSX est supporté
export const typeIcons: Record<string, ReactNode> = {
  soiling: <Wrench size={14} />,
  power_drop: <Zap size={14} />,
  device_offline: <WifiOff size={14} />,
  low_production: <Activity size={14} />,
  high_temperature: <Thermometer size={14} />,
  communication_error: <AlertCircle size={14} />,
  system: <Database size={14} />,
};

export const severityColors = {
  critical: { bg: C.redL, color: C.red, border: C.red, icon: AlertTriangle },
  warning: { bg: C.amberL, color: C.amber, border: C.amber, icon: AlertCircle },
  info: { bg: C.blueL, color: C.blue, border: C.blue, icon: Info },
};