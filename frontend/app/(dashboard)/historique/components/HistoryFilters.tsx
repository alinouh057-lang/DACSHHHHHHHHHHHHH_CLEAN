// components/HistoryFilters.tsx
'use client';
import { Filter, CheckCircle, AlertTriangle, AlertCircle, Download, Loader, ClipboardList, Eye } from 'lucide-react';
import { C } from '@/lib/colors';

interface HistoryFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
  exportLoading: boolean;
  onExport: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function HistoryFilters({
  filter,
  setFilter,
  viewMode,
  setViewMode,
  exportLoading,
  onExport,
  filteredCount,
  totalCount,
}: HistoryFiltersProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
        <ClipboardList size={14} /> HISTORIQUE — {filteredCount} AFFICHÉS / {totalCount} TOTAL
      </div>
      
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* FILTRES PAR STATUT */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Filter size={14} color={C.text3} />
          {['all','Clean','Warning','Critical'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === f 
                  ? f === 'all' ? C.green 
                    : f === 'Clean' ? C.green 
                    : f === 'Warning' ? C.amber 
                    : C.red
                  : C.surface2,
                color: filter === f ? '#fff' : C.text2,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {f === 'all' && 'Tous'}
              {f === 'Clean' && <><CheckCircle size={12} /> Clean</>}
              {f === 'Warning' && <><AlertTriangle size={12} /> Warning</>}
              {f === 'Critical' && <><AlertCircle size={12} /> Critical</>}
            </button>
          ))}
        </div>

        {/* BOUTONS D'EXPORT */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          <button
            onClick={onExport}
            disabled={exportLoading}
            style={{
              padding: '1px 3px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1.5px solid ${C.blue}`,
              color: C.blue,
              textDecoration: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {exportLoading ? <Loader size={16} className="spin" /> : <Download size={16} />}
            {exportLoading ? 'Génération...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}