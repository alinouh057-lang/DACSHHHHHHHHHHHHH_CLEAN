// ============================================================================
// FICHIER: parseMongoDate.ts
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce fichier contient une fonction utilitaire qui convertit les timestamps
//   MongoDB (qui peuvent arriver sous différents formats) en objet Date
//   JavaScript standard. Cela permet de manipuler et d'afficher les dates
//   de manière uniforme dans l'application.
//
// 🎯 FONCTIONNALITÉS:
//   - Support du format MongoDB natif: { $date: "2024-01-15T10:30:00Z" }
//   - Support des objets Date JavaScript
//   - Support des chaînes ISO 8601 (ex: "2024-01-15T10:30:00Z")
//   - Retourne null pour les formats invalides (pas d'erreur)
//
// 📥 ENTRÉE:
//   - timestamp: any - Peut être un objet, une date ou une chaîne
//
// 📤 SORTIE:
//   - Date | null - Objet Date valide ou null si le format est invalide
//
// 🗄️ POURQUOI CE FICHIER EST NÉCESSAIRE:
//   MongoDB peut retourner les dates dans différents formats selon
//   la méthode de sérialisation utilisée (JSON, BSON, API REST).
//   Cette fonction normalise tous ces formats en un objet Date standard.
//
// 📊 EXEMPLES D'UTILISATION:
//   // Format MongoDB natif
//   parseMongoDate({ $date: "2026-04-12T10:30:00Z" }) → Date object
//
//   // Objet Date déjà existant
//   parseMongoDate(new Date("2026-04-12")) → Date object
//
//   // Chaîne ISO
//   parseMongoDate("2026-04-12T10:30:00Z") → Date object
//
//   // Valeur invalide
//   parseMongoDate(null) → null
//   parseMongoDate("invalide") → null
//
// ============================================================================

// ============================================================
// 1. FONCTION PRINCIPALE
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
 *   Cette fonction est utilisée dans le hook useDashboardData pour
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