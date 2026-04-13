// components/AlertTabs.tsx
'use client';
import { Check, CheckCircle } from 'lucide-react';
import { C } from '@/lib/colors';

interface AlertTabsProps {
  activeTab: 'active' | 'history' | 'stats';
  setActiveTab: (tab: 'active' | 'history' | 'stats') => void;
  activeCount: number;
  historyCount: number;
  showActions?: boolean;
  onAcknowledgeAll?: () => void;
  onResolveAll?: () => void;
}

export default function AlertTabs({
  activeTab,
  setActiveTab,
  activeCount,
  historyCount,
  showActions = false,
  onAcknowledgeAll,
  onResolveAll,
}: AlertTabsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      marginBottom: 20,
      borderBottom: `1px solid ${C.border}`,
      paddingBottom: 8,
      flexWrap: 'wrap',
    }}>
      <button
        onClick={() => setActiveTab('active')}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: activeTab === 'active' ? C.green : 'transparent',
          color: activeTab === 'active' ? 'white' : C.text2,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Alertes actives
        {activeCount > 0 && (
          <span style={{
            background: activeTab === 'active' ? 'white' : C.surface2,
            color: activeTab === 'active' ? C.green : C.text3,
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 11,
          }}>
            {activeCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => setActiveTab('history')}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: activeTab === 'history' ? C.green : 'transparent',
          color: activeTab === 'history' ? 'white' : C.text2,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Historique
        {historyCount > 0 && (
          <span style={{
            background: activeTab === 'history' ? 'white' : C.surface2,
            color: activeTab === 'history' ? C.green : C.text3,
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 11,
          }}>
            {historyCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => setActiveTab('stats')}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: activeTab === 'stats' ? C.green : 'transparent',
          color: activeTab === 'stats' ? 'white' : C.text2,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Statistiques
      </button>

      {/* Actions groupées */}
      {showActions && activeCount > 0 && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={onAcknowledgeAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={12} />
            Tout marquer lu
          </button>
          <button
            onClick={onResolveAll}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${C.red}`,
              background: C.redL,
              color: C.red,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle size={12} />
            Tout résoudre
          </button>
        </div>
      )}
    </div>
  );
}