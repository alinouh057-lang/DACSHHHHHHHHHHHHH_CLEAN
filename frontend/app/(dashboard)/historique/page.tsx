// app/(dashboard)/historique/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Database, Eye, ClipboardList } from 'lucide-react';
import { C } from '@/lib/colors';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDashboardReset } from '@/contexts/DashboardContext';
import { fmtDay } from '@/lib/api';

// Composants
import StatsCards from './components/StatsCards';
import ChartsSection from './components/ChartsSection';
import HistoryFilters from './components/HistoryFilters';
import HistoryTable from './components/HistoryTable';
import HistoryCards from './components/HistoryCards';
import Pagination from './components/Pagination';

// Hooks et utils
import { useHistoryData } from './hooks/useHistoryData';
import { filterAndSortData, calculateTrends } from './utils/historyUtils';

export default function HistoriquePage() {
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();
  const { isReset, clearResetFlag } = useDashboardReset();

  // États
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'soiling' | 'power'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Reset
  useEffect(() => {
    if (isReset) {
      setSelectedRows([]);
      clearResetFlag();
    }
  }, [isReset, clearResetFlag]);

  // Hook principal
  const { historyData, stats, loading, loadPage } = useHistoryData(autoRefresh, refreshKey, setLastUpdate);

  // Données filtrées et triées
  const filtered = useMemo(() => {
    return filterAndSortData(
      historyData.data,
      filter,
      searchTerm,
      startDate,
      endDate,
      sortField,
      sortDirection
    );
  }, [historyData.data, filter, searchTerm, startDate, endDate, sortField, sortDirection]);

  // Données pour les graphiques
  const chartData = useMemo(() => {
    return (stats?.daily ?? [])
      .filter(d => d && d.day)
      .map(d => ({
        day: fmtDay(d.day),
        count: d.count || 0,
        soiling: d.avg_soiling || 0,
        power: d.avg_power || 0,
      }));
  }, [stats]);

  const { trendSoiling, trendPower } = calculateTrends(chartData);

  // Statistiques
  const cleanCount = stats?.distribution?.Clean ?? 0;
  const warningCount = stats?.distribution?.Warning ?? 0;
  const criticalCount = stats?.distribution?.Critical ?? 0;
  const total = stats?.total ?? historyData.total;
  const cleanPercentage = total > 0 ? Number(((cleanCount / total) * 100).toFixed(1)) : 0;
  // Pagination
  const handlePrevPage = () => {
    const prevSkip = Math.max(0, historyData.skip - historyData.limit);
    loadPage(prevSkip);
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    const nextSkip = historyData.skip + historyData.limit;
    loadPage(nextSkip);
    setCurrentPage(currentPage + 1);
  };

  // Sélection
  const handleSelectAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map(d => d._id || ''));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Export PDF (fonction identique à l'original)
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const { exportHistoryToPDF } = await import('@/lib/exportHistory');
      const dataToExport = selectedRows.length > 0
        ? filtered.filter(d => selectedRows.includes(d._id || ''))
        : filtered;
      await exportHistoryToPDF(dataToExport, 'Historique des mesures', selectedRows);
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && historyData.data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${C.greenL}`, borderTop: `3px solid ${C.green}`, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={24} color={C.green} />
          Historique des mesures
        </h1>

        
         {/* Toggle vue */}
        {/*
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, background: C.surface2, borderRadius: 6, padding: 2 }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'table' ? C.green : 'transparent',
                color: viewMode === 'table' ? 'white' : C.text2,
                cursor: 'pointer',
              }}
              title="Vue tableau"
            >


              <ClipboardList size={14} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'cards' ? C.green : 'transparent',
                color: viewMode === 'cards' ? 'white' : C.text2,
                cursor: 'pointer',
              }}
              title="Vue cartes"
            >


              <Eye size={14} />
            </button>
          </div>
        </div>
*/}

      </div>

      {/* Cartes statistiques */}
      <StatsCards
        total={total}
        cleanCount={cleanCount}
        warningCount={warningCount}
        criticalCount={criticalCount}
        trendSoiling={trendSoiling}
        cleanPercentage={cleanPercentage}
      />

      {/* Graphiques */}
      <ChartsSection chartData={chartData} trendSoiling={trendSoiling} trendPower={trendPower} />

      {/* Section historique */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        
        {/* Filtres */}
        <HistoryFilters
          filter={filter}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          exportLoading={exportLoading}
          onExport={handleExportPDF}
          filteredCount={filtered.length}
          totalCount={historyData.total}
        />

        {/* Contenu principal */}
        {viewMode === 'table' ? (
          <HistoryTable
            data={filtered}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSortField}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
          />
        ) : 
        
        (
          <HistoryCards data={filtered} />
        )}

        {/* Pagination */}
        <Pagination
          skip={historyData.skip}
          limit={historyData.limit}
          total={historyData.total}
          hasMore={historyData.has_more}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}