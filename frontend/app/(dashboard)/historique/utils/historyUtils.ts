// utils/historyUtils.ts
import { fmtDateTime, type Measurement } from '@/lib/api';

export const filterAndSortData = (
  data: Measurement[],
  filter: string,
  searchTerm: string,
  startDate: string,
  endDate: string,
  sortField: 'timestamp' | 'soiling' | 'power',
  sortDirection: 'asc' | 'desc'
): Measurement[] => {
  return data
    .filter(d => {
      if (filter !== 'all' && d.ai_analysis.status !== filter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return d.device_id.toLowerCase().includes(searchLower) ||
               fmtDateTime(d.timestamp).toLowerCase().includes(searchLower);
      }
      if (startDate && endDate) {
        const date = new Date(d.timestamp);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        return date >= start && date <= end;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'soiling':
          aVal = a.ai_analysis.soiling_level;
          bVal = b.ai_analysis.soiling_level;
          break;
        case 'power':
          aVal = a.electrical_data.power_output;
          bVal = b.electrical_data.power_output;
          break;
        default:
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
};

export const calculateTrends = (chartData: Array<{ day: string; count: number; soiling: number; power: number }>) => {
  const trendSoiling = chartData.length >= 2 && chartData[0].soiling > 0
    ? ((chartData[chartData.length - 1].soiling - chartData[0].soiling) / chartData[0].soiling * 100).toFixed(1)
    : '0';
  
  const trendPower = chartData.length >= 2 && chartData[0].power > 0
    ? ((chartData[chartData.length - 1].power - chartData[0].power) / chartData[0].power * 100).toFixed(1)
    : '0';
  
  return { trendSoiling, trendPower };
};