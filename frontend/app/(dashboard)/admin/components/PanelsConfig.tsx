'use client';

import { useState, useEffect } from 'react';
import { Save, Loader, Sun, PanelTop } from 'lucide-react';
import { C } from '@/lib/colors';
import { getPanelConfig, updatePanelConfig } from '@/lib/api';

interface PanelsConfigProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function PanelsConfig({ onMessage, onRefresh }: PanelsConfigProps) {
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [panelConfig, setPanelConfig] = useState({
    panel_type: 'monocristallin',
    panel_capacity_kw: 3.0,
    panel_area_m2: 1.6,
    panel_efficiency: 0.20,
    tilt_angle: 30,
    azimuth: 180,
    degradation_rate: 0.5,
  });

  // Charger la configuration au montage
  useEffect(() => {
    loadPanelConfig();
  }, []);

  const loadPanelConfig = async () => {
    try {
      const data = await getPanelConfig();
      if (data) {
        setPanelConfig({
          panel_type: data.panel_type || 'monocristallin',
          panel_capacity_kw: data.panel_capacity_kw ?? 3.0,
          panel_area_m2: data.panel_area_m2 ?? 1.6,
          panel_efficiency: data.panel_efficiency ?? 0.20,
          tilt_angle: data.tilt_angle ?? 30,
          azimuth: data.azimuth ?? 180,
          degradation_rate: data.degradation_rate ?? 0.5,
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement config:', error);
    }
  };

  const handleSavePanelConfig = async () => {
    setLoadingPanels(true);
    try {
      const success = await updatePanelConfig(panelConfig);
      if (success) {
        onMessage('Configuration sauvegardée', 'success');
        onRefresh();
      } else {
        onMessage('Erreur lors de la sauvegarde', 'error');
      }
    } catch (error) {
      onMessage('Erreur de connexion', 'error');
    } finally {
      setLoadingPanels(false);
    }
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <PanelTop size={18} color={C.orange} />
        Configuration des panneaux solaires
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        
        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Type de panneau
          </label>
          <select
            value={panelConfig.panel_type || 'monocristallin'}
            onChange={(e) => setPanelConfig({ ...panelConfig, panel_type: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface2,
              color: C.text,
            }}
          >
            <option value="monocristallin">Monocristallin</option>
            <option value="polycristallin">Polycristallin</option>
            <option value="couche_mince">Couche mince</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Puissance crête (kWc)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={panelConfig.panel_capacity_kw ?? 3.0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPanelConfig({ ...panelConfig, panel_capacity_kw: isNaN(val) ? 0 : val });
            }}
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

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Surface (m²)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={panelConfig.panel_area_m2 ?? 1.6}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPanelConfig({ ...panelConfig, panel_area_m2: isNaN(val) ? 0 : val });
            }}
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

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Rendement (%)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="30"
            value={panelConfig.panel_efficiency ? Math.round(panelConfig.panel_efficiency * 100) : 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPanelConfig({ 
                ...panelConfig, 
                panel_efficiency: isNaN(val) ? 0.20 : val / 100 
              });
            }}
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

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Inclinaison (degrés)
          </label>
          <input
            type="number"
            step="5"
            min="0"
            max="90"
            value={panelConfig.tilt_angle ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setPanelConfig({ ...panelConfig, tilt_angle: isNaN(val) ? 0 : val });
            }}
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

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Orientation (azimut)
          </label>
          <select
            value={panelConfig.azimuth ?? 180}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setPanelConfig({ ...panelConfig, azimuth: isNaN(val) ? 180 : val });
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface2,
              color: C.text,
            }}
          >
            <option value="0">Nord (0°)</option>
            <option value="45">Nord-Est (45°)</option>
            <option value="90">Est (90°)</option>
            <option value="135">Sud-Est (135°)</option>
            <option value="180">Sud (180°) - Optimal</option>
            <option value="225">Sud-Ouest (225°)</option>
            <option value="270">Ouest (270°)</option>
            <option value="315">Nord-Ouest (315°)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Dégradation annuelle (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={panelConfig.degradation_rate ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPanelConfig({ ...panelConfig, degradation_rate: isNaN(val) ? 0 : val });
            }}
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

      <div style={{
        marginTop: 20,
        padding: 16,
        background: C.orangeL,
        borderRadius: 10,
        border: `1px solid ${C.orange}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sun size={18} color={C.orange} />
          <span style={{ fontWeight: 600, color: C.orange }}>Calcul de la puissance théorique</span>
        </div>
        <p style={{ fontSize: 12, color: C.text2 }}>
          <strong>P_théorique = irradiance × Surface × Rendement</strong><br />
          <br />
          • Surface: {(panelConfig.panel_area_m2 ?? 1.6).toFixed(1)} m²<br />
          • Rendement: {((panelConfig.panel_efficiency ?? 0.20) * 100).toFixed(1)}%<br />
          • Coefficient: {((panelConfig.panel_area_m2 ?? 1.6) * (panelConfig.panel_efficiency ?? 0.20)).toFixed(2)} m² × %<br />
          <br />
          Exemple : avec 1000 W/m² d'irradiance → Puissance théorique = {(1000 * (panelConfig.panel_area_m2 ?? 1.6) * (panelConfig.panel_efficiency ?? 0.20)).toFixed(0)} W
        </p>
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button
          onClick={handleSavePanelConfig}
          disabled={loadingPanels}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: loadingPanels ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loadingPanels ? <Loader size={16} className="spin" /> : <Save size={16} />}
          {loadingPanels ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}