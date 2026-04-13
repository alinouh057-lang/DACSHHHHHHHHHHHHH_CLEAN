// utils/reportsUtils.ts

/**
 * Parse les dates MongoDB (qui peuvent avoir différents formats)
 * Gère :
 * - Objets Date JavaScript
 * - Objets MongoDB { $date: "..." }
 * - Timestamps (secondes ou millisecondes)
 * - Chaînes ISO
 * - Format français "JJ/MM/AAAA HH:MM"
 * 
 * @param dateValue - La valeur de date à parser (peut être de plusieurs types)
 * @returns Un objet Date valide ou null si parsing échoue
 */
export function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // Si c'est déjà un objet Date
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // Si c'est un objet MongoDB { $date: "..." }
  if (typeof dateValue === 'object' && dateValue !== null) {
    if (dateValue.$date) {
      return parseDate(dateValue.$date);
    }
  }
  
  // Si c'est un nombre (timestamp)
  if (typeof dateValue === 'number') {
    // Si le nombre est > 10^10, c'est probablement en millisecondes
    if (dateValue > 10000000000) {
      return new Date(dateValue);
    } else {
      // Sinon c'est en secondes
      return new Date(dateValue * 1000);
    }
  }
  
  // Si c'est une chaîne ISO
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (trimmed === '') return null;
    
    // Essayer le format ISO standard
    let date = new Date(trimmed);
    if (!isNaN(date.getTime())) return date;
    
    // Essayer avec remplacement de l'espace par T (format "YYYY-MM-DD HH:MM")
    date = new Date(trimmed.replace(' ', 'T'));
    if (!isNaN(date.getTime())) return date;
    
    // Essayer le format français "JJ/MM/AAAA HH:MM"
    const frenchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
    if (frenchMatch) {
      const [_, day, month, year, hour, minute] = frenchMatch;
      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      ));
    }
    
    console.warn('⚠️ Format de date non reconnu:', dateValue);
    return null;
  }
  
  return null;
}

/**
 * Formate une date MongoDB en chaîne lisible (JJ/MM/AAAA HH:MM)
 * 
 * @param dateValue - La valeur de date à formater
 * @returns Une chaîne formatée ou 'Date invalide' si parsing échoue
 */
export function formatDate(dateValue: any): string {
  const date = parseDate(dateValue);
  if (!date) return 'Date invalide';
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Prépare les données pour l'export CSV/Excel
 */
export function prepareExportData(history: any[]) {
  return {
    headers: ['Date', 'Device', 'Statut', 'Ensablement (%)', 'Puissance (W)', 'Tension (V)', 'Courant (A)'],
    rows: history.map(d => [
      formatDate(d.timestamp),
      d.device_id,
      d.ai_analysis?.status || 'Inconnu',
      d.ai_analysis?.soiling_level?.toFixed(1) || '0',
      d.electrical_data?.power_output?.toFixed(1) || '0',
      d.electrical_data?.voltage?.toFixed(1) || '0',
      d.electrical_data?.current?.toFixed(2) || '0'
    ])
  };
}

/**
 * Prépare les données pour le graphique d'évolution
 */
export function prepareChartData(stats: any | null) {
  if (!stats || !stats.daily) return [];
  
  return stats.daily
    .map((d: any) => ({
      day: d.day ? new Date(d.day).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      }) : '--/--',
      count: d.count || 0,
      soiling: d.avg_soiling || 0,
      power: d.avg_power || 0,
    }))
    .slice(-30);
}

/**
 * Prépare les données pour le camembert
 */
export function preparePieData(stats: any | null) {
  if (!stats) return [];
  
  return [
    { name: 'Clean', value: stats.distribution?.Clean || 0, color: '#1a7f4f' },
    { name: 'Warning', value: stats.distribution?.Warning || 0, color: '#c47d0e' },
    { name: 'Critical', value: stats.distribution?.Critical || 0, color: '#c0392b' },
  ];
}