'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, AlertCircle, Smartphone, PlusCircle } from 'lucide-react';
import { C } from '@/lib/colors';
import { fetchDevices, addDevice, updateDevice, deleteDevice, type Device } from '@/lib/api';

interface DevicesConfigProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function DevicesConfig({ onMessage, onRefresh }: DevicesConfigProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    device_id: '',
    name: '',
    status: 'active',
  });

  // Charger les devices au montage
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    const data = await fetchDevices();
    setDevices(data);
    setLoading(false);
  };

  const handleAddDevice = async () => {
    if (!newDevice.device_id || newDevice.device_id.trim() === '') {
      onMessage('Veuillez entrer un ID de dispositif', 'error');
      return;
    }

    setLoading(true);
    const deviceToAdd = {
      device_id: newDevice.device_id.trim(),
      name: newDevice.name?.trim() || newDevice.device_id.trim(),
      status: newDevice.status || 'active',
    };

    const device = await addDevice(deviceToAdd);
    setLoading(false);

    if (device) {
      setDevices([...devices, device]);
      setShowAddDevice(false);
      resetNewDevice();
      onMessage('Dispositif ajouté avec succès', 'success');
      onRefresh();
    } else {
      onMessage('Erreur : ID déjà utilisé ou invalide', 'error');
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice || !newDevice.device_id) return;

    setLoading(true);
    const updated = await updateDevice(editingDevice.device_id, newDevice);
    setLoading(false);

    if (updated) {
      setDevices(devices.map(d => d.device_id === editingDevice.device_id ? updated : d));
      setShowAddDevice(false);
      setEditingDevice(null);
      resetNewDevice();
      onMessage('Dispositif mis à jour avec succès', 'success');
      onRefresh();
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce dispositif ?\nCette action est irréversible.')) {
      setLoading(true);
      const success = await deleteDevice(deviceId);
      setLoading(false);

      if (success) {
        setDevices(devices.filter(d => d.device_id !== deviceId));
        onMessage('Dispositif supprimé avec succès', 'success');
        onRefresh();
      } else {
        onMessage('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleDeviceStatusChange = async (deviceId: string, status: string) => {
    setLoading(true);
    const updated = await updateDevice(deviceId, { status: status as any });
    setLoading(false);

    if (updated) {
      setDevices(devices.map(d => d.device_id === deviceId ? updated : d));
      const statusMessages: Record<string, string> = {
        active: 'Device activé - Il peut maintenant envoyer des données',
        maintenance: 'Device en maintenance - Envoi bloqué temporairement',
        offline: 'Device hors ligne - Envoi bloqué'
      };
      onMessage(statusMessages[status] || `Statut mis à jour: ${status}`, 'success');
      onRefresh();
    } else {
      onMessage('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const resetNewDevice = () => {
    setNewDevice({
      device_id: '',
      name: '',
      status: 'active',
    });
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Smartphone size={18} color={C.green} />
          Gestion des dispositifs ESP
        </h2>
        <button
          onClick={() => {
            setEditingDevice(null);
            resetNewDevice();
            setShowAddDevice(true);
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} />
          Ajouter un dispositif
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddDevice && (
        <div style={{
          marginBottom: 20,
          padding: 20,
          background: C.surface2,
          borderRadius: 8,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlusCircle size={16} color={C.green} />
            {editingDevice ? 'Modifier le dispositif' : 'Nouveau dispositif ESP'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
                ID du dispositif <span style={{ color: C.red }}>*</span>
              </label>
              <input
                value={newDevice.device_id || ''}
                onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                disabled={!!editingDevice}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: editingDevice ? C.surface : C.surface2,
                  color: C.text,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
                Nom (optionnel)
              </label>
              <input
                value={newDevice.name || ''}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
                Statut
              </label>
              <select
                value={newDevice.status || 'active'}
                onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                }}
              >
                <option value="active">✅ Actif (peut envoyer des données)</option>
                <option value="maintenance">🔧 Maintenance (envoi bloqué)</option>
                <option value="offline">📴 Hors ligne (envoi bloqué)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={editingDevice ? handleUpdateDevice : handleAddDevice}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: C.green,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Check size={14} />
              {editingDevice ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button
              onClick={() => {
                setShowAddDevice(false);
                setEditingDevice(null);
                resetNewDevice();
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.text2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des dispositifs */}
      {loading && devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Statut</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Dernier heartbeat</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.device_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>{device.device_id}</td>
                  <td style={{ padding: '12px 8px' }}>{device.name || device.device_id}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <select
                        value={device.status}
                        onChange={(e) => handleDeviceStatusChange(device.device_id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                          background: device.status === 'active' ? C.greenL :
                                     device.status === 'maintenance' ? C.amberL : C.surface2,
                          color: device.status === 'active' ? C.green :
                                 device.status === 'maintenance' ? C.amber : C.text2,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        <option value="active">✅ Actif</option>
                        <option value="maintenance">🔧 Maintenance</option>
                        <option value="offline">📴 Hors ligne</option>
                      </select>
                      {device.status !== 'active' && (
                        <span style={{ fontSize: 10, color: C.red, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AlertCircle size={10} />
                          Envoi bloqué
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          setEditingDevice(device);
                          setNewDevice({
                            device_id: device.device_id,
                            name: device.name,
                            status: device.status,
                          });
                          setShowAddDevice(true);
                        }}
                        style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.device_id)}
                        style={{ color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div style={{
        marginTop: 16,
        padding: 12,
        background: C.surface2,
        borderRadius: 8,
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        fontSize: 12,
        color: C.text2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.green }} />
          <span><strong>Actif</strong> : peut envoyer des données</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.amber }} />
          <span><strong>Maintenance</strong> : envoi temporairement bloqué</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.red }} />
          <span><strong>Hors ligne</strong> : envoi bloqué</span>
        </div>
      </div>
    </div>
  );
}