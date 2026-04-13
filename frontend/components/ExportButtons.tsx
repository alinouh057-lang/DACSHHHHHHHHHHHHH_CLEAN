// frontend/components/ExportButtons.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT EXPORT BUTTONS - PV MONITOR
 * ============================================================
 * Ce composant fournit un menu déroulant pour exporter des données
 * dans différents formats. Il est utilisé dans les pages de rapports
 * et de statistiques.
 * 
 * Formats disponibles :
 * - PDF : Document formaté avec titre et en-têtes
 * - Excel : Tableau au format XLSX
 * - CSV : Données séparées par des virgules
 * - PNG : Capture du graphique (optionnel)
 * 
 * Fonctionnalités :
 * - Bouton principal avec icône Download
 * - Menu déroulant avec options d'export
 * - Export de graphiques si un chartId est fourni
 * - Utilisation du hook useExport pour la logique d'export
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Image, ChevronDown } from 'lucide-react';
import { useExport } from '@/hooks/useExport';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';
// ============================================================
// TYPES
// ============================================================

/**
 * Interface des propriétés du composant ExportButtons
 */
interface ExportButtonsProps {
  data: {
    headers: string[];                // En-têtes du tableau
    rows: (string | number)[][];       // Lignes de données
  };
  title?: string;                      // Titre du document (pour PDF)
  filename?: string;                    // Nom de base du fichier exporté
  showChartExport?: boolean;            // Afficher l'option d'export du graphique
  chartId?: string;                     // ID de l'élément graphique à capturer
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ExportButtons({ 
  data, 
  title = 'Rapport', 
  filename = 'export',
  showChartExport = false,
  chartId
}: ExportButtonsProps) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [showMenu, setShowMenu] = useState(false); // Menu ouvert/fermé
  
  // ==========================================================
  // HOOKS
  // ==========================================================
  const { exportToPDF, exportToExcel, exportToCSV, exportChartAsImage } = useExport();

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Gère l'export selon le format choisi
   * @param format - Format d'export ('pdf', 'excel', 'csv', 'png')
   */
  const handleExport = (format: 'pdf' | 'excel' | 'csv' | 'png') => {
    switch(format) {
      case 'pdf':
        exportToPDF({
          ...data,
          title,
          filename: `${filename}.pdf`
        });
        break;
      case 'excel':
        exportToExcel({
          ...data,
          title,
          filename: `${filename}.xlsx`
        });
        break;
      case 'csv':
        exportToCSV({
          ...data,
          filename: `${filename}.csv`
        });
        break;
      case 'png':
        if (chartId) {
          exportChartAsImage(chartId, `${filename}.png`);
        }
        break;
    }
    setShowMenu(false); // Ferme le menu après l'export
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ position: 'relative' }}>
      
      {/* ==================================================== */}
      {/* BOUTON PRINCIPAL (avec icône Download) */}
      {/* ==================================================== */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: C.green,
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Download size={16} />
        Exporter
        <ChevronDown size={14} />
      </button>

      {/* ==================================================== */}
      {/* MENU DÉROULANT (affiché si showMenu = true) */}
      {/* ==================================================== */}
      {showMenu && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />
          
          {/* Panneau du menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 200,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            
            {/* ================================================ */}
            {/* OPTION PDF */}
            {/* ================================================ */}
            <button
              onClick={() => handleExport('pdf')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: C.text,
                cursor: 'pointer',
                transition: 'var(--tr)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText size={16} color={C.red} />
              PDF
            </button>

        

            {/* ================================================ */}
            {/* OPTION CSV */}
            {/* ================================================ */}
            <button
              onClick={() => handleExport('csv')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: C.text,
                cursor: 'pointer',
                transition: 'var(--tr)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText size={16} color={C.blue} />
              CSV
            </button>

            {/* ================================================ */}
            {/* OPTION GRAPHIQUE (conditionnelle) */}
            {/* ================================================ */}
            {showChartExport && chartId && (
              <button
                onClick={() => handleExport('png')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: C.text,
                  cursor: 'pointer',
                  transition: 'var(--tr)',
                  borderTop: `1px solid ${C.border}`, // Séparateur pour les options supplémentaires
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Image size={16} color={C.purple} />
                Graphique (PNG)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}