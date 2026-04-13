// ============================================================================
// FICHIER: parseMongoDate.ts
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce fichier contient des fonctions utilitaires pour convertir les timestamps
//   MongoDB (qui peuvent arriver sous différents formats) en objet Date
//   JavaScript standard, et pour formater les heures de manière sécurisée.
//   Cela permet de manipuler et d'afficher les dates de manière uniforme
//   dans la page Analyse Énergétique.
//
// 🎯 FONCTIONNALITÉS:
//   - parseMongoDate : Convertit un timestamp MongoDB en Date
//   - safeFmtTime    : Formate une heure avec fallback sécurisé
//
// 📦 EXPORTS:
//   - parseMongoDate(timestamp: any): Date | null
//   - safeFmtTime(timestamp: string, fmtTime: fn): string
//
// 🗄️ POURQUOI CE FICHIER EST NÉCESSAIRE:
//   MongoDB peut retourner les dates dans différents formats selon
//   la méthode de sérialisation utilisée (JSON, BSON, API REST).
//   Ces fonctions normalisent tous ces formats en objets standards.
//
// 📊 EXEMPLES D'UTILISATION:
//   // Parse d'un timestamp MongoDB
//   const date = parseMongoDate({ $date: "2026-04-12T10:30:00Z" });
//   
//   // Formatage sécurisé d'une heure
//   const time = safeFmtTime(timestamp, fmtTime);
//
// ============================================================================

// ============================================================
// 1. FONCTION PRINCIPALE : PARSE MONGODB DATE
// ============================================================

/**
 * Parse un timestamp MongoDB vers un objet Date.
 * 
 * 📥 ENTRÉE:
 *   - timestamp: any - Timestamp dans différents formats possibles:
 *       • { $date: "2024-01-15T10:30:00Z" }  (format MongoDB natif)
 *       • new Date("2024-01-15")              (objet Date)
 *       • "2024-01-15T10:30:00Z"              (chaîne ISO 8601)
 * 
 * 📤 SORTIE:
 *   - Date | null - Objet Date valide ou null si le format est invalide
 * 
 * 🔍 COMPORTEMENT PAR FORMAT:
 *   | Format                          | Exemple                              | Résultat      |
 *   |---------------------------------|--------------------------------------|---------------|
 *   | MongoDB natif (objet avec $date)| { $date: "2026-04-12T10:30:00Z" }   | Date valide   |
 *   | Objet Date                      | new Date("2026-04-12")               | Date valide   |
 *   | Chaîne ISO 8601                 | "2026-04-12T10:30:00Z"               | Date valide   |
 *   | Chaîne invalide                 | "pas une date"                       | null          |
 *   | Valeur null/undefined           | null                                 | null          |
 *   | Autre type                      | 12345                                | null          |
 * 
 * 💡 UTILISATION TYPIQUE:
 *   Cette fonction est utilisée dans le hook useEnergyData pour
 *   filtrer les données historiques par plage temporelle.
 * 
 *   const date = parseMongoDate(measurement.timestamp);
 *   if (date && date >= cutoff) {
 *     // Garder cette mesure
 *   }
 */
export function parseMongoDate(timestamp: any): Date | null {
  // ============================================================
  // 1. GESTION DES VALEURS NULL/UNDEFINED
  // ============================================================
  if (!timestamp) return null;

  // ============================================================
  // 2. FORMAT MONGODB NATIF : { $date: "..." }
  // ============================================================
  // MongoDB peut sérialiser les dates sous forme d'objet avec une propriété $date
  if (typeof timestamp === 'object' && timestamp !== null && timestamp.$date) {
    return new Date(timestamp.$date);
  }

  // ============================================================
  // 3. OBJET DATE JAVASCRIPT DÉJÀ EXISTANT
  // ============================================================
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  // ============================================================
  // 4. CHAÎNE ISO 8601
  // ============================================================
  // Format standard: "2026-04-12T10:30:00Z" ou "2026-04-12T10:30:00+01:00"
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  // ============================================================
  // 5. FORMAT NON RECONNU
  // ============================================================
  return null;
}

// ============================================================
// 2. FONCTION SECONDAIRE : FORMATAGE SÉCURISÉ DE L'HEURE
// ============================================================

/**
 * Formate une heure de manière sécurisée avec fallback.
 * 
 * 📥 ENTRÉE:
 *   - timestamp: string - Timestamp à formater
 *   - fmtTime: function - Fonction de formatage standard (ex: fmtTime de l'API)
 * 
 * 📤 SORTIE:
 *   - string - Heure formatée (ex: "10:30") ou "--:--" en cas d'erreur
 * 
 * 🔍 COMPORTEMENT:
 *   1. Tente d'utiliser la fonction fmtTime fournie
 *   2. Si le résultat est invalide ("--:--"), utilise Date.toLocaleTimeString
 *   3. En cas d'erreur, retourne "--:--"
 * 
 * 💡 UTILISATION TYPIQUE:
 *   Utilisée dans chartData pour formater les heures affichées
 *   sur les graphiques de puissance et tension/courant.
 * 
 *   const time = safeFmtTime(d.timestamp, fmtTime);
 */
export const safeFmtTime = (timestamp: string, fmtTime: (ts: string) => string): string => {
  try {
    // Tenter le formatage standard
    const formatted = fmtTime(timestamp);
    
    // Si valide, retourner le résultat
    if (formatted && formatted !== '--:--') return formatted;
    
    // Fallback: utiliser le formatage natif JavaScript
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    // En cas d'erreur, retourner un placeholder
    return '--:--';
  }
};