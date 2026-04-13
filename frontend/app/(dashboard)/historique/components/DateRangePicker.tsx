// components/DateRangePicker.tsx
'use client';
import { C } from '@/lib/colors';

const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange, onApply }: any) => {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 8,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 16,
      boxShadow: '0 4px 16px rgba(13,82,52,.15)',
      zIndex: 1000,
      minWidth: 300,
    }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>Date début</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.surface2,
            color: C.text,
            fontSize: 12,
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>Date fin</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: C.surface2,
            color: C.text,
            fontSize: 12,
          }}
        />
      </div>
      <button
        onClick={onApply}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: 6,
          border: 'none',
          background: C.green,
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Appliquer
      </button>
    </div>
  );
};

export default DateRangePicker;