// components/ExportButton.tsx
'use client';
import { Download } from 'lucide-react';
import { exportToPDF } from '@/lib/exportPdf';
import { C } from '@/lib/colors';
import type { Intervention } from '@/lib/api';

interface ExportButtonProps {
  interventions: Intervention[];
}

export default function ExportButton({ interventions }: ExportButtonProps) {
  const handleExport = () => {
    if (interventions.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    exportToPDF(interventions, 'Rapport des interventions');
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '4px 12px',
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: 'transparent',
        color: C.text2,
        fontSize: 11,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Download size={12} />
      Export PDF
    </button>
  );
}