// frontend/hooks/useExport.ts
'use client';

/**
 * ============================================================
 * HOOK USEEXPORT - PV MONITOR
 * ============================================================
 * Ce hook personnalisé fournit des fonctions d'export de données
 * vers différents formats :
 * - PDF : Document formaté avec titre, date, tableau
 * - Excel : Fichier XLSX avec feuille de calcul
 * - CSV : Fichier texte avec séparateurs
 * - PNG : Capture d'écran d'un graphique
 * 
 * Dépendances :
 * - jspdf : Génération de PDF
 * - jspdf-autotable : Tableaux dans PDF
 * - xlsx : Génération Excel
 * - file-saver : Sauvegarde côté client
 * - html2canvas : Capture de graphiques
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface pour les données à exporter
 */
interface ExportData {
  headers: string[];                 // En-têtes du tableau
  rows: (string | number)[][];        // Lignes de données
  title?: string;                     // Titre du document (optionnel)
  filename?: string;                   // Nom du fichier (optionnel)
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================
export function useExport() {
  // ==========================================================
  // EXPORT PDF
  // ==========================================================

  /**
   * Exporte les données au format PDF
   * - Ajoute un titre et la date de génération
   * - Crée un tableau formaté avec autoTable
   * - Styles personnalisés (couleurs, polices)
   * 
   * @param data - Les données à exporter (headers, rows, title, filename)
   */
  const exportToPDF = (data: ExportData) => {
    const { headers, rows, title = 'Rapport', filename = 'export.pdf' } = data;
    
    // Création du document PDF
    const doc = new jsPDF();
    
    // ========================================================
    // EN-TÊTE DU DOCUMENT
    // ========================================================
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 
      14, 
      22
    );
    
    // ========================================================
    // TABLEAU DE DONNÉES
    // ========================================================
    autoTable(doc, {
      head: [headers],                // Ligne d'en-tête
      body: rows,                     // Lignes de données
      startY: 30,                     // Position Y de départ
      theme: 'grid',                   // Thème avec bordures
      styles: {
        fontSize: 8,                   // Taille de police
        cellPadding: 3,                // Padding des cellules
      },
      headStyles: {
        fillColor: [116, 182, 102],    // Vert (#74B666 en RGB)
        textColor: 255,                 // Texte blanc
        fontStyle: 'bold',              // Gras
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],     // Gris clair pour les lignes alternées
      },
    });
    
    // ========================================================
    // SAUVEGARDE
    // ========================================================
    doc.save(filename);
  };

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  /**
   * Exporte les données au format Excel (XLSX)
   * - Crée un classeur avec une feuille "Rapport"
   * - Ajoute le titre en A1
   * - Ajuste automatiquement la largeur des colonnes
   * 
   * @param data - Les données à exporter (headers, rows, title, filename)
   */
  const exportToExcel = (data: ExportData) => {
    const { headers, rows, title = 'Rapport', filename = 'export.xlsx' } = data;
    
    // ========================================================
    // CRÉATION DU CLASSEUR
    // ========================================================
    const wb = XLSX.utils.book_new();
    
    // ========================================================
    // CRÉATION DE LA FEUILLE
    // ========================================================
    // Convertit les données en feuille de calcul
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Ajoute le titre en A1 (décalé)
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
    
    // ========================================================
    // AJUSTEMENT DES COLONNES
    // ========================================================
    const colWidths = headers.map(h => ({ 
      wch: Math.max(h.length, 15) // Largeur basée sur la longueur de l'en-tête (min 15)
    }));
    ws['!cols'] = colWidths;
    
    // ========================================================
    // ASSEMBLAGE ET SAUVEGARDE
    // ========================================================
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  /**
   * Exporte les données au format CSV
   * - Format simple avec séparateurs virgules
   * - Encodage UTF-8
   * 
   * @param data - Les données à exporter (headers, rows, filename)
   */
  const exportToCSV = (data: ExportData) => {
    const { headers, rows, filename = 'export.csv' } = data;
    
    // ========================================================
    // CRÉATION DU CONTENU CSV
    // ========================================================
    const csvContent = [
      headers.join(','),                // Ligne d'en-tête
      ...rows.map(row => row.join(',')) // Lignes de données
    ].join('\n');                       // Séparateur de lignes
    
    // ========================================================
    // SAUVEGARDE
    // ========================================================
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  };

  // ==========================================================
  // EXPORT GRAPHIQUE (PNG)
  // ==========================================================

  /**
   * Capture un graphique au format PNG
   * - Utilise html2canvas pour capturer l'élément DOM
   * - Convertit le canvas en blob
   * - Sauvegarde le fichier
   * 
   * @param chartId - ID de l'élément HTML contenant le graphique
   * @param filename - Nom du fichier (défaut: 'graphique.png')
   */
  const exportChartAsImage = (chartId: string, filename = 'graphique.png') => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;
    
    // ========================================================
    // CAPTURE DE L'ÉLÉMENT
    // ========================================================
    // Import dynamique de html2canvas pour éviter de charger
    // cette dépendance inutilement
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(chartElement).then(canvas => {
        // Conversion du canvas en blob
        canvas.toBlob(blob => {
          if (blob) saveAs(blob, filename);
        });
      });
    });
  };

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    exportToPDF,
    exportToExcel,
    exportToCSV,
    exportChartAsImage,
  };
}