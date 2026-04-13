// components/FilterBar.tsx
'use client';
import { AlertCircle, Smartphone, X } from 'lucide-react';
import { C } from '@/lib/colors';

interface FilterBarProps {
  showFilters: boolean;
  filterSeverity: string;
  setFilterSeverity: (value: string) => void;
  filterDevice: string;
  setFilterDevice: (value: string) => void;
  deviceList: string[];
  onReset: () => void;
}

export default function FilterBar({
  showFilters,
  filterSeverity,
  setFilterSeverity,
  filterDevice,
  setFilterDevice,
  deviceList,
  onReset,
}: FilterBarProps) {
  if (!showFilters) return null;

  return (
    <div style={{
      background: C.surface2,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      display: 'flex',
      gap: 20,
      flexWrap: 'wrap',
      alignItems: 'flex-end',
    }}>
      {/* Filtre par sévérité */}
      <div style={{ flex: 1, minWidth: 150 }}>
        <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>
          <AlertCircle size={12} style={{ marginRight: 4 }} />
          Sévérité
        </label>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.surface,
            fontSize: 12,
          }}
        >
          <option value="all">Toutes</option>
          <option value="critical">Critique</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
      
      {/* Filtre par dispositif */}
      <div style={{ flex: 1, minWidth: 150 }}>
        <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>
          <Smartphone size={12} style={{ marginRight: 4 }} />
          Dispositif
        </label>
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.surface,
            fontSize: 12,
          }}
        >
          <option value="all">Tous</option>
          {deviceList.map(device => (
            <option key={device} value={device}>{device}</option>
          ))}
        </select>
      </div>
      
      {/* Réinitialiser filtres */}
      {(filterSeverity !== 'all' || filterDevice !== 'all') && (
        <button
          onClick={onReset}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text2,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <X size={12} />
          Réinitialiser
        </button>
      )}
    </div>
  );
}