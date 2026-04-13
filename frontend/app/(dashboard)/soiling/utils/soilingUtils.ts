// utils/soilingUtils.ts
import type { Measurement, Stats } from '@/lib/api';

export const prepareChartData = (historyData: Measurement[]) => {
  return historyData
    .filter(d => d && d.timestamp)
    .map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      soiling: d.ai_analysis?.soiling_level || 0,
      date: new Date(d.timestamp).toLocaleDateString('fr-FR'),
      confidence: (d.ai_analysis?.confidence || 0) * 100,
    }))
    .reverse();
};

export const calculateStatusCounts = (historyData: Measurement[]) => {
  return historyData.reduce((acc, d) => {
    const status = d.ai_analysis?.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const calculateSoilingStats = (historyData: Measurement[], avgSoiling: number) => {
  const soilingValues = historyData.map(d => d.ai_analysis?.soiling_level || 0);
  const minSoiling = soilingValues.length > 0 ? Math.min(...soilingValues) : 0;
  const maxSoiling = soilingValues.length > 0 ? Math.max(...soilingValues) : 0;
  
  const variance = soilingValues.length > 0 
    ? soilingValues.reduce((acc, val) => acc + Math.pow(val - avgSoiling, 2), 0) / soilingValues.length 
    : 0;
  const stdDev = Math.sqrt(variance).toFixed(1);
  
  return { minSoiling, maxSoiling, stdDev };
};

export const calculateEconomicMetrics = (
  soilingLevel: number, 
  pth: number, 
  actualPower: number,  // ← AJOUTER ce paramètre
  cleaningCost: number = 50, 
  energyPrice: number = 0.20
) => {
  // ✅ Utiliser actualPower au lieu de ed.power_output
  const powerLoss = Math.max(0, pth - actualPower);  // Perte en Watts (évite les négatifs)
  const energyLostToday = (powerLoss * 24) / 1000;   // Perte en kWh/jour
  const annualLoss = energyLostToday * 365 * energyPrice;
  const roiValue = (annualLoss - cleaningCost).toFixed(2);
  const roiNum = parseFloat(roiValue);
  
  return { energyLostToday, annualLoss, roiValue, roiNum };
};