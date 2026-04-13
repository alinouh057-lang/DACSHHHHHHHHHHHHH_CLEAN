// utils/maintenanceUtils.ts
import type { Measurement, Intervention } from '@/lib/api';

export const calculateAlertCounts = (historyData: Measurement[]) => {
  const critical = historyData.filter(d => d.ai_analysis.status === 'Critical').length;
  const warning = historyData.filter(d => d.ai_analysis.status === 'Warning').length;
  const clean = historyData.filter(d => d.ai_analysis.status === 'Clean').length;
  return { critical, warning, clean };
};

export const calculateMaintenanceStats = (interventions: Intervention[]) => {
  const totalCost = interventions.reduce((sum, i) => sum + (i.status === 'completed' ? i.cost : 0), 0);
  const avgImprovement = interventions
    .filter(i => i.status === 'completed')
    .reduce((sum, i) => sum + (i.before_level - i.after_level), 0) / 
    (interventions.filter(i => i.status === 'completed').length || 1);
  return { totalCost, avgImprovement };
};

export const getAlerts = (historyData: Measurement[]) => {
  return historyData.filter(d => ['Critical','Warning'].includes(d.ai_analysis.status));
};