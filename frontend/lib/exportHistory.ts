// frontend/lib/exportHistory.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// TYPE POUR LES DONNÉES D'HISTORIQUE
// ============================================================
export interface HistoryData {
  timestamp: string;
  device_id: string;
  ai_analysis: {
    status: string;
    soiling_level: number;
    confidence: number;
  };
  electrical_data: {
    power_output: number;
    voltage: number;
    current: number;
  };
  _id?: string;
}

// ============================================================
// FONCTION DE FORMATAGE DE DATE (si tu ne veux pas l'importer)
// ============================================================
const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR') + ' ' + 
         date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// ============================================================
// FONCTION PRINCIPALE D'EXPORT PDF
// ============================================================
export const exportHistoryToPDF = (
  data: HistoryData[],
  title: string = 'Historique des mesures',
  selectedRows: string[] = []  // Pour exporter seulement certaines lignes
) => {
  // Filtrer les données si des lignes sont sélectionnées
  const dataToExport = selectedRows.length > 0
    ? data.filter(d => selectedRows.includes(d._id || ''))
    : data;

  // Créer le document PDF
  const doc = new jsPDF();
  
  // ===== 1. EN-TÊTE =====
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  doc.text(`${dataToExport.length} mesures exportées`, 14, 37);
  
  // ===== 2. PRÉPARATION DU TABLEAU =====
  const tableColumn = [
    'Date/Heure',
    'Device',
    'Statut',
    'Ensablement',
    'Confiance',
    'Puissance',
    'Tension',
    'Courant'
  ];
  
  const tableRows = dataToExport.map(d => [
    formatDateTime(d.timestamp),
    d.device_id,
    d.ai_analysis.status,
    `${d.ai_analysis.soiling_level.toFixed(1)}%`,
    `${(d.ai_analysis.confidence * 100).toFixed(1)}%`,
    `${d.electrical_data.power_output.toFixed(1)} W`,
    `${d.electrical_data.voltage.toFixed(1)} V`,
    `${d.electrical_data.current.toFixed(2)} A`
  ]);
  
  // ===== 3. GÉNÉRATION DU TABLEAU =====
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: { 
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: { 
      fillColor: [26, 127, 79], // Vert
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { 
      fillColor: [237, 244, 237] // Vert clair
    },
    // Coloration des statuts
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const status = data.cell.raw;
        if (status === 'Critical') {
          data.cell.styles.textColor = [192, 57, 43]; // Rouge
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Warning') {
          data.cell.styles.textColor = [196, 125, 14]; // Orange
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Clean') {
          data.cell.styles.textColor = [26, 127, 79]; // Vert
        }
      }
    }
  });
  
  // ===== 4. STATISTIQUES =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Calculs des moyennes
  const avgSoiling = dataToExport.reduce((sum, d) => sum + d.ai_analysis.soiling_level, 0) / dataToExport.length;
  const avgPower = dataToExport.reduce((sum, d) => sum + d.electrical_data.power_output, 0) / dataToExport.length;
  const criticalCount = dataToExport.filter(d => d.ai_analysis.status === 'Critical').length;
  const warningCount = dataToExport.filter(d => d.ai_analysis.status === 'Warning').length;
  const cleanCount = dataToExport.filter(d => d.ai_analysis.status === 'Clean').length;
  
  doc.setFontSize(10);
  doc.text('Résumé statistique :', 14, finalY);
  doc.text(`• Ensablement moyen : ${avgSoiling.toFixed(1)}%`, 20, finalY + 7);
  doc.text(`• Puissance moyenne : ${avgPower.toFixed(1)} W`, 20, finalY + 14);
  doc.text(`• Répartition : ${cleanCount} Clean · ${warningCount} Warning · ${criticalCount} Critical`, 20, finalY + 21);
  
  // ===== 5. PIED DE PAGE =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `PV Monitor - Rapport généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // ===== 6. TÉLÉCHARGEMENT =====
  doc.save(`historique_${new Date().toISOString().split('T')[0]}_${dataToExport.length}mesures.pdf`);
};

// ============================================================
// VERSION CSV (optionnelle)
// ============================================================
export const exportHistoryToCSV = (
  data: HistoryData[],
  selectedRows: string[] = []
) => {
  const dataToExport = selectedRows.length > 0
    ? data.filter(d => selectedRows.includes(d._id || ''))
    : data;
  
  const headers = ['Timestamp', 'Device', 'Statut', 'Ensablement (%)', 'Confiance (%)', 'Puissance (W)', 'Tension (V)', 'Courant (A)'];
  const rows = dataToExport.map(d => [
    formatDateTime(d.timestamp),
    d.device_id,
    d.ai_analysis.status,
    d.ai_analysis.soiling_level.toFixed(1),
    (d.ai_analysis.confidence * 100).toFixed(1),
    d.electrical_data.power_output.toFixed(1),
    d.electrical_data.voltage.toFixed(1),
    d.electrical_data.current.toFixed(2)
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historique_${new Date().toISOString().split('T')[0]}_${dataToExport.length}mesures.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};