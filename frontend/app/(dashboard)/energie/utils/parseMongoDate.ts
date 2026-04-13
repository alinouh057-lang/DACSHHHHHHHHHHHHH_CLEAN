// app/(dashboard)/energie/utils/parseMongoDate.ts
export function parseMongoDate(timestamp: any): Date | null {
  if (!timestamp) return null;

  if (typeof timestamp === 'object' && timestamp !== null && timestamp.$date) {
    return new Date(timestamp.$date);
  }

  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export const safeFmtTime = (timestamp: string, fmtTime: (ts: string) => string): string => {
  try {
    const formatted = fmtTime(timestamp);
    if (formatted && formatted !== '--:--') return formatted;
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};