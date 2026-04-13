// components/LatestMeasuresTable.tsx
'use client';
import ExportButtons from '@/components/ExportButtons';
import { C } from '@/lib/colors';

interface LatestMeasuresTableProps {
  headers: string[];
  rows: any[][];
  filename: string;
}

export default function LatestMeasuresTable({ headers, rows, filename }: LatestMeasuresTableProps) {
  const exportData = { headers, rows };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Dernières mesures</h2>
        <ExportButtons 
          data={exportData}
          filename={filename}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Affiche seulement les 10 premières lignes */}
            {rows.slice(0, 10).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}