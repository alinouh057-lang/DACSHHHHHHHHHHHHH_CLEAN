// components/PreferencesTab.tsx
'use client';
import { Moon, Globe, Bell, RefreshCw, Sun, Save, Loader } from 'lucide-react';
import { C } from '@/lib/colors';

interface PreferencesTabProps {
  preferences: {
    darkMode: boolean;
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  onPreferenceChange: (key: string, value: any) => void;
  onSave: () => void;
  loading: boolean;
}

export default function PreferencesTab({ preferences, onPreferenceChange, onSave, loading }: PreferencesTabProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 24,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 }}>
        Préférences utilisateur
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        
        {/* APPARENCE (THÈME) */}
        <div style={{ padding: 16, background: C.surface2, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Moon size={16} color={C.purple} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Apparence</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onPreferenceChange('darkMode', false)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: preferences.darkMode ? `1px solid ${C.border}` : 'none',
                background: !preferences.darkMode ? C.green : 'transparent',
                color: !preferences.darkMode ? 'white' : C.text2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Sun size={14} />
              Clair
            </button>
            <button
              onClick={() => onPreferenceChange('darkMode', true)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: !preferences.darkMode ? `1px solid ${C.border}` : 'none',
                background: preferences.darkMode ? C.green : 'transparent',
                color: preferences.darkMode ? 'white' : C.text2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Moon size={14} />
              Sombre
            </button>
          </div>
        </div>

        {/* LANGUE ET FUSEAU HORAIRE */}
        <div style={{ padding: 16, background: C.surface2, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Globe size={16} color={C.blue} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Langue & région</span>
          </div>
          <select
            value={preferences.language}
            onChange={(e) => onPreferenceChange('language', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
          <select
            value={preferences.timezone}
            onChange={(e) => onPreferenceChange('timezone', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 12,
            }}
          >
            <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
          </select>
        </div>

        {/* NOTIFICATIONS */}
        <div style={{ padding: 16, background: C.surface2, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={16} color={C.amber} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Notifications</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => onPreferenceChange('emailNotifications', e.target.checked)}
              />
              <span style={{ fontSize: 12, color: C.text2 }}>Notifications par email</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => onPreferenceChange('pushNotifications', e.target.checked)}
              />
              <span style={{ fontSize: 12, color: C.text2 }}>Notifications push</span>
            </label>
          </div>
        </div>

        {/* RAFRAÎCHISSEMENT AUTOMATIQUE */}
        <div style={{ padding: 16, background: C.surface2, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <RefreshCw size={16} color={C.green} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Rafraîchissement auto</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={preferences.autoRefresh}
              onChange={(e) => onPreferenceChange('autoRefresh', e.target.checked)}
            />
            <span style={{ fontSize: 12, color: C.text2 }}>Activer le rafraîchissement automatique</span>
          </label>
          <select
            value={preferences.refreshInterval}
            onChange={(e) => onPreferenceChange('refreshInterval', Number(e.target.value))}
            disabled={!preferences.autoRefresh}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 12,
              opacity: preferences.autoRefresh ? 1 : 0.5,
            }}
          >
            <option value={15}>15 secondes</option>
            <option value={30}>30 secondes</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>
      </div>

      {/* BOUTON DE SAUVEGARDE */}
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            padding: '8px 24px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginLeft: 'auto',
          }}
        >
          {loading ? <Loader size={14} className="spin" /> : <Save size={14} />}
          Sauvegarder les préférences
        </button>
      </div>
    </div>
  );
}