'use client';

import { useState, useEffect } from 'react';
import { Save, Loader, AlertTriangle, RefreshCw, MapPin, Settings } from 'lucide-react';
import { C } from '@/lib/colors';
import { getAdminConfig, updateConfig } from '@/lib/api';

interface GeneralConfigProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function GeneralConfig({ onMessage, onRefresh }: GeneralConfigProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    seuil_warning: 30,
    seuil_critical: 60,
    retention_days: 7,
    cleanup_interval: 24,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await getAdminConfig();
    if (data) {
      setConfig({
        seuil_warning: data.seuil_warning || 30,
        seuil_critical: data.seuil_critical || 60,
        retention_days: data.retention_days || 7,
        cleanup_interval: data.cleanup_interval || 24,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    const success = await updateConfig(config);
    if (success) {
      onMessage('Configuration sauvegardée', 'success');
      onRefresh();
    } else {
      onMessage('Erreur lors de la sauvegarde', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Settings size={18} color={C.green} />
        Configuration générale
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Seuils d'alerte */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color={C.amber} />
            Seuils d'alerte
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Seuil Warning (%)
            </label>
            <input
              type="number"
              value={config.seuil_warning}
              onChange={(e) => setConfig({ ...config, seuil_warning: Number(e.target.value) })}
              min={0}
              max={100}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Seuil Critical (%)
            </label>
            <input
              type="number"
              value={config.seuil_critical}
              onChange={(e) => setConfig({ ...config, seuil_critical: Number(e.target.value) })}
              min={0}
              max={100}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>
        </div>

        {/* Nettoyage automatique */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} color={C.blue} />
            Nettoyage automatique
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Rétention images (jours)
            </label>
            <input
              type="number"
              value={config.retention_days}
              onChange={(e) => setConfig({ ...config, retention_days: Number(e.target.value) })}
              min={1}
              max={30}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
              Intervalle nettoyage (heures)
            </label>
            <input
              type="number"
              value={config.cleanup_interval}
              onChange={(e) => setConfig({ ...config, cleanup_interval: Number(e.target.value) })}
              min={1}
              max={168}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>
        </div>

        {/* Localisation du champ PV */}
        <div style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color={C.purple} />
            Localisation du champ PV
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
                📍 Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={config.latitude || ''}
                onChange={(e) => setConfig({ ...config, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Ex: 36.8065"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  fontSize: 14,
                }}
              />
              <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                Latitude du site (ex: 36.8065 pour Tunis)
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
                📍 Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={config.longitude || ''}
                onChange={(e) => setConfig({ ...config, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Ex: 10.1815"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  fontSize: 14,
                }}
              />
              <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                Longitude du site (ex: 10.1815 pour Tunis)
              </p>
            </div>
          </div>

          <div style={{
            marginTop: 12,
            padding: 12,
            background: C.blueL,
            borderRadius: 8,
            fontSize: 11,
            color: C.blue,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <MapPin size={14} />
            Ces coordonnées sont utilisées pour la récupération automatique des données d'irradiance (Open-Meteo)
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button
          onClick={handleSaveConfig}
          disabled={loading}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading ? <Loader size={16} className="spin" /> : <Save size={16} />}
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}