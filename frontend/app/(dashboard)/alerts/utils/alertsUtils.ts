// utils/alertsUtils.ts

/**
 * Formate un timestamp en date locale française
 * Version alternative : ajoute 1 heure si le timestamp est sans timezone
 */
export const formatLocalDateTime = (timestamp: string | undefined): string => {
  if (!timestamp) return '-';
  try {
    let date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    // Ajouter 1 heure si le timestamp est sans timezone
    if (!timestamp.includes('+') && !timestamp.includes('Z')) {
      date = new Date(date.getTime() + 60 * 60 * 1000);
    }
    
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return 'Date invalide';
  }
};