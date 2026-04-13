// ============================================================
// 📄 FICHIER D'EXPORT PDF - PV MONITOR
// ============================================================
// Ce fichier contient la fonction générique pour exporter
// des données d'interventions au format PDF.
// Il est placé dans /lib pour être réutilisable partout.
// ============================================================

// 📦 IMPORT DES BIBLIOTHÈQUES
// ============================================================
import jsPDF from 'jspdf';                 // Bibliothèque principale pour générer des PDF
import autoTable from 'jspdf-autotable';   // Plugin pour créer des tableaux facilement

// ============================================================
// 📝 DÉFINITION DU TYPE DE DONNÉES
// ============================================================

/**
 * Interface ExportableData
 * Définit la structure des données que la fonction peut exporter.
 * Cela garantit la sécurité des types avec TypeScript.
 * 
 * @property date - Date de l'intervention (string)
 * @property type - Type d'intervention (cleaning, repair, etc.)
 * @property device_id - Identifiant du panneau solaire
 * @property technician - Nom du technicien
 * @property before_level - Niveau d'encrassement AVANT (%)
 * @property after_level - Niveau d'encrassement APRÈS (%)
 * @property cost - Coût de l'intervention (DT)
 * @property status - Statut (planned, completed, etc.)
 */
interface ExportableData {
  date: string;
  type: string;
  device_id: string;
  technician: string;
  //before_level: number;
  //after_level: number;
  cost: number;
  status: string;
}

// ============================================================
// 🚀 FONCTION PRINCIPALE D'EXPORT PDF
// ============================================================

/**
 * exportToPDF - Fonction générique pour exporter des données en PDF
 * 
 * @template T - Type générique qui doit étendre ExportableData
 * @param data - Tableau de données à exporter (interventions, historique, etc.)
 * @param title - Titre du document (par défaut: 'Rapport')
 * 
 * @example
 * // Dans un composant React
 * import { exportToPDF } from '@/lib/exportPdf';
 * 
 * const handleExport = () => {
 *   exportToPDF(interventions, 'Rapport des interventions');
 * };
 */
export const exportToPDF = <T extends ExportableData>(
  data: T[], 
  title: string = 'Rapport'
) => {
  // ==========================================================
  // 1. CRÉATION DU DOCUMENT PDF
  // ==========================================================
  /**
   * new jsPDF() - Crée un nouveau document PDF vierge
   * Orientation: portrait par défaut
   * Unité: pixels
   * Format: A4
   */
  const doc = new jsPDF();
  
  // ==========================================================
  // 2. CONFIGURATION DES COULEURS (centralisée)
  // ==========================================================
  /**
   * Couleurs correspondant au thème de l'application
   * Format: [R, G, B] avec valeurs de 0 à 255
   * 
   * primary: Vert PV Monitor (#1a7f4f) pour l'en-tête
   * secondary: Vert clair (#edf4ed) pour les lignes alternées
   * 
   * Le mot-clé 'as' force TypeScript à reconnaître le format tuple
   */
  const colors = {
    primary: [26, 127, 79] as [number, number, number],    // Vert principal
    secondary: [237, 244, 237] as [number, number, number], // Vert secondaire
  };
  
  // ==========================================================
  // 3. AJOUT DU TITRE
  // ==========================================================
  /**
   * doc.setFontSize(18) - Définit la taille de police à 18pt
   * doc.text(texte, x, y) - Ajoute du texte aux coordonnées (x, y)
   * 
   * Coordonnées: 
   * - x = 14 (marge gauche)
   * - y = 22 (position verticale)
   */
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // ==========================================================
  // 4. AJOUT DE LA DATE DE GÉNÉRATION
  // ==========================================================
  /**
   * new Date().toLocaleDateString('fr-FR') - Formate la date en français
   * Exemple: "18/03/2025"
   */
  doc.setFontSize(11);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  
  // ==========================================================
  // 5. CRÉATION DU TABLEAU AVEC autoTable
  // ==========================================================
  /**
   * autoTable() - Plugin qui génère un tableau automatiquement
   * 
   * Paramètres de configuration :
   * - head: En-tête du tableau (tableau de colonnes)
   * - body: Lignes de données (chaque sous-tableau = une ligne)
   * - startY: Position verticale de départ (après le titre)
   * - styles: Styles globaux du tableau
   * - headStyles: Styles spécifiques à l'en-tête
   * - alternateRowStyles: Style des lignes paires (zébrage)
   */
  autoTable(doc, {
    // En-tête du tableau (8 colonnes)
    head: [['Date', 'Type', 'Dispositif', 'Technicien', 'Avant', 'Après', 'Coût', 'Statut']],
    
    // Corps du tableau - transformation des données
    body: data.map(item => [
      // Colonne 1 : Date formatée en français
      new Date(item.date).toLocaleDateString('fr-FR'),
      
      // Colonne 2 : Type d'intervention (déjà traduit par l'appelant)
      item.type,
      
      // Colonne 3 : ID du dispositif
      item.device_id,
      
      // Colonne 4 : Nom du technicien
      item.technician,
      
      // Colonne 5 : Niveau avant avec symbole %
      //`${item.before_level}%`,
      
      // Colonne 6 : Niveau après avec symbole %
     // `${item.after_level}%`,
      
      // Colonne 7 : Coût avec symbole DT
      `${item.cost} DT`,
      
      // Colonne 8 : Statut (déjà traduit par l'appelant)
      item.status,
    ]),
    
    // Position de départ (juste après le titre)
    startY: 40,
    
    // Styles globaux
    styles: { 
      fontSize: 8  // Police plus petite pour tenir plus de données
    },
    
    // Style de l'en-tête
    headStyles: { 
      fillColor: colors.primary  // Fond vert
    },
    
    // Style des lignes alternées (zébrage)
    alternateRowStyles: { 
      fillColor: colors.secondary  // Fond vert clair
    },
  });
  
  // ==========================================================
  // 6. AJOUT DES STATISTIQUES EN BAS DE PAGE
  // ==========================================================
  /**
   * Calcul du coût total des interventions terminées
   * - filter() : garde seulement les interventions avec status = 'completed'
   * - reduce() : additionne tous les coûts
   */
  const totalCost = data
    .filter(i => i.status === 'completed')
    .reduce((sum, i) => sum + i.cost, 0);
  
  /**
   * Récupération de la position Y après le tableau
   * (doc as any) - Cast pour accéder à lastAutoTable (propriété ajoutée par le plugin)
   * .finalY - Dernière position Y du tableau
   * +10 - Ajoute une marge de 10px
   */
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Ajout des statistiques
  doc.setFontSize(10);
  doc.text(`Total: ${data.length} interventions`, 14, finalY);
  doc.text(`Coût total des interventions terminées: ${totalCost} `, 14, finalY + 7);
  
  // ==========================================================
  // 7. TÉLÉCHARGEMENT DU PDF
  // ==========================================================
  /**
   * doc.save(nomFichier) - Télécharge le PDF
   * 
   * Nom du fichier généré automatiquement :
   * - title.toLowerCase() : titre en minuscules
   * - Date.now() : timestamp actuel (unicité)
   * - Extension .pdf
   * 
   * Exemple: "rapport_1742312345678.pdf"
   */
  doc.save(`${title.toLowerCase()}_${Date.now()}.pdf`);
};