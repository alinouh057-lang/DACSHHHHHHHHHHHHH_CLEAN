// components/ProfileTabs.tsx
'use client';
import { User, Lock, Moon, Key } from 'lucide-react';
import { C } from '@/lib/colors';

interface ProfileTabsProps {
  activeTab: 'profile' | 'security' | 'preferences' | 'api';
  onTabChange: (tab: 'profile' | 'security' | 'preferences' | 'api') => void;
  getRoleColor: () => string;
}

export default function ProfileTabs({ activeTab, onTabChange, getRoleColor }: ProfileTabsProps) {
  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'security' as const, label: 'Sécurité', icon: Lock },
    { id: 'preferences' as const, label: 'Préférences', icon: Moon },
    { id: 'api' as const, label: 'API Keys', icon: Key },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      marginBottom: 20,
      borderBottom: `1px solid ${C.border}`,
      paddingBottom: 8,
      overflowX: 'auto',
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id ? getRoleColor() : 'transparent',
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
  );
}