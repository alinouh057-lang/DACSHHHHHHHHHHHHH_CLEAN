'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Smartphone, Users, Mail, PanelTop } from 'lucide-react';
import { C } from '@/lib/colors';

// Composants internes
import GeneralConfig from './components/GeneralConfig';
import DevicesConfig from './components/DevicesConfig';
import PanelsConfig from './components/PanelsConfig';
import UsersConfig from './components/UsersConfig';
import EmailConfig from './components/EmailConfig';
import DataManagement from './components/DataManagement';

type TabType = 'general' | 'devices' | 'panels' | 'email' | 'users';

const TABS = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'devices', label: 'Dispositifs', icon: Smartphone },
  { id: 'panels', label: 'Panneaux', icon: PanelTop },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'users', label: 'Utilisateurs', icon: Users },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [message, setMessageState] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Refs pour forcer le rechargement des composants enfants
  const refreshKey = useRef(0);

  const setMessage = (text: string, type: 'success' | 'error') => {
    setMessageState({ text, type });
    setTimeout(() => setMessageState(null), 3000);
  };

  const refreshData = () => {
    refreshKey.current += 1;
  };

  // Rafraîchir la page quand elle devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible - Rechargement des données');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div>
      {/* Message de statut */}
      {message && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          borderRadius: 8,
          background: message.type === 'success' ? C.greenL : C.redL,
          color: message.type === 'success' ? C.green : C.red,
          fontSize: 13,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          {message.type === 'success' ? '✓' : '⚠'} {message.text}
        </div>
      )}

      {/* Onglets */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: 8,
        flexWrap: 'wrap',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? C.green : 'transparent',
                color: activeTab === tab.id ? 'white' : C.text2,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets - key pour forcer le rechargement */}
      <div key={refreshKey.current}>
        {activeTab === 'general' && <GeneralConfig onMessage={setMessage} onRefresh={refreshData} />}
        {activeTab === 'devices' && <DevicesConfig onMessage={setMessage} onRefresh={refreshData} />}
        {activeTab === 'panels' && <PanelsConfig onMessage={setMessage} onRefresh={refreshData} />}
        {activeTab === 'users' && <UsersConfig onMessage={setMessage} onRefresh={refreshData} />}
        {activeTab === 'email' && <EmailConfig onMessage={setMessage} onRefresh={refreshData} />}
      </div>

      {/* Gestion des données (toujours visible) */}
      <DataManagement onMessage={setMessage} onRefresh={refreshData} />
    </div>
  );
}