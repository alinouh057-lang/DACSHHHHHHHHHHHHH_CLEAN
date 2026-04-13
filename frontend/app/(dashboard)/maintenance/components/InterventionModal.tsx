// components/InterventionModal.tsx
'use client';
import { X, Save, Loader } from 'lucide-react';
import { C } from '@/lib/colors';
import type { Intervention } from '@/lib/api';

export interface InterventionFormData {
  date: string;
  type: Intervention['type'];
  device_id: string;
  technician: string;
  notes: string;
  cost: number;
  status: Intervention['status'];
}

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: InterventionFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  selectedIntervention: Intervention | null;
  loading: boolean;
}

const defaultFormData: InterventionFormData = {
  date: new Date().toISOString().split('T')[0],
  type: 'cleaning',
  device_id: '',
  technician: '',
  notes: '',
  cost: 0,
  status: 'planned'
};

export default function InterventionModal({
  isOpen,
  onClose,
  onSave,
  formData,
  onFormChange,
  selectedIntervention,
  loading,
}: InterventionModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: C.surface,
        borderRadius: 14,
        padding: 24,
        width: 500,
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>
          {selectedIntervention ? 'Modifier' : 'Nouvelle'} intervention
        </h2>
        
        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Date */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={onFormChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={onFormChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            >
              <option value="cleaning">Nettoyage</option>
              <option value="repair">Réparation</option>
              <option value="inspection">Inspection</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {/* Dispositif */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Dispositif</label>
            <input
              type="text"
              name="device_id"
              value={formData.device_id}
              onChange={onFormChange}
              placeholder="ESP32_ZONE_A1"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          {/* Technicien */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Technicien</label>
            <input
              type="text"
              name="technician"
              value={formData.technician}
              onChange={onFormChange}
              placeholder="Nom du technicien"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          {/* Coût */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Coût (DT)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={onFormChange}
              min={0}
              step={1}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            />
          </div>

          {/* Statut */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Statut</label>
            <select
              name="status"
              value={formData.status}
              onChange={onFormChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
              }}
            >
              <option value="planned">Planifiée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={onFormChange}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Boutons du modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text2,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <X size={14} />
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              background: loading ? C.surface2 : C.green,
              color: loading ? C.text3 : 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading ? <Loader size={14} className="spin" /> : <Save size={14} />}
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}