// components/ApiKeysTab.tsx
'use client';
import { useState } from 'react';
import { Key, Loader, Eye, EyeOff, Copy, Check, AlertCircle, Trash2 } from 'lucide-react';
import { C } from '@/lib/colors';
import { formatApiKey } from '../utils/profileUtils';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  lastUsed: string;
  created: string;
  status: 'active' | 'inactive';
}

interface ApiKeysTabProps {
  apiKeys: ApiKey[];
  loading: boolean;
  onGenerate: () => void;
  onRevoke: (id: number) => void;
  onCopy: (key: string) => void;
  copied: boolean;
}

export default function ApiKeysTab({ apiKeys, loading, onGenerate, onRevoke, onCopy, copied }: ApiKeysTabProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
          Clés API
        </h2>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? <Loader size={14} className="spin" /> : <Key size={16} />}
          Générer une clé
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader size={32} className="spin" color={C.green} />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Clé</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Créée le</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Dernière utilisation</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.text3 }}>
                    Aucune clé API
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 8px' }}>{key.name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{
                          background: C.surface2,
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: 'monospace',
                        }}>
                          {formatApiKey(key.key, showApiKey)}
                        </code>
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title={showApiKey ? 'Masquer' : 'Afficher'}
                        >
                          {showApiKey ? <EyeOff size={14} color={C.text3} /> : <Eye size={14} color={C.text3} />}
                        </button>
                        <button
                          onClick={() => onCopy(key.key)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Copier"
                        >
                          {copied ? <Check size={14} color={C.green} /> : <Copy size={14} color={C.text3} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 12 }}>{key.created}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12 }}>{key.lastUsed}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <button
                        onClick={() => onRevoke(key.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: `1px solid ${C.red}`,
                          background: 'transparent',
                          color: C.red,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={12} />
                        Révoquer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONSEILS DE SÉCURITÉ */}
      <div style={{ marginTop: 20, background: C.blueL, borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <AlertCircle size={14} color={C.blue} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.blue }}>Bonnes pratiques</span>
        </div>
        <p style={{ fontSize: 11, color: C.text2, marginLeft: 22 }}>
          Ne partagez jamais vos clés API. Utilisez des clés différentes pour le développement et la production.
          Régénérez régulièrement vos clés pour plus de sécurité.
        </p>
      </div>
    </div>
  );
}