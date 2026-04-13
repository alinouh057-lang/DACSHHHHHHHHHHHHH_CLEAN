'use client';

import { useState, useCallback } from 'react';
import {
  getAdminConfig,
  updateConfig,
  fetchDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getEmailConfig,
  updateEmailConfig,
  testEmail,
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
  getPanelConfig,
  updatePanelConfig,
  deleteAllData,
  deleteOldData,
  type Device,
  type User
} from '@/lib/api';

interface Message {
  text: string;
  type: 'success' | 'error';
}

export function useAdminData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessageState] = useState<Message | null>(null);

  const setMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessageState({ text, type });
    setTimeout(() => setMessageState(null), 3000);
  }, []);

  // ==========================================================
  // CONFIGURATION GÉNÉRALE
  // ==========================================================
  const [config, setConfig] = useState({
    seuil_warning: 30,
    seuil_critical: 60,
    retention_days: 7,
    cleanup_interval: 24,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const loadConfig = useCallback(async () => {
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
  }, []);

  const saveConfig = useCallback(async () => {
    setLoading(true);
    const success = await updateConfig(config);
    if (success) {
      setMessage('Configuration sauvegardée', 'success');
    } else {
      setMessage('Erreur lors de la sauvegarde', 'error');
    }
    setLoading(false);
    return success;
  }, [config, setMessage]);

  // ==========================================================
  // DISPOSITIFS
  // ==========================================================
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    device_id: '',
    name: '',
    status: 'active',
  });

  const loadDevices = useCallback(async () => {
    const data = await fetchDevices();
    setDevices(data);
  }, []);

  const addDeviceHandler = useCallback(async () => {
    if (!newDevice.device_id || newDevice.device_id.trim() === '') {
      setMessage('Veuillez entrer un ID de dispositif', 'error');
      return false;
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
      setMessage('Dispositif ajouté avec succès', 'success');
      return true;
    } else {
      setMessage('Erreur : ID déjà utilisé ou invalide', 'error');
      return false;
    }
  }, [newDevice, devices, setMessage]);

  const updateDeviceHandler = useCallback(async () => {
    if (!editingDevice || !newDevice.device_id) return false;

    setLoading(true);
    const updated = await updateDevice(editingDevice.device_id, newDevice);
    setLoading(false);

    if (updated) {
      setDevices(devices.map(d => d.device_id === editingDevice.device_id ? updated : d));
      setShowAddDevice(false);
      setEditingDevice(null);
      resetNewDevice();
      setMessage('Dispositif mis à jour avec succès', 'success');
      return true;
    }
    return false;
  }, [editingDevice, newDevice, devices, setMessage]);

  const deleteDeviceHandler = useCallback(async (deviceId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce dispositif ? Cette action est irréversible.')) {
      setLoading(true);
      const success = await deleteDevice(deviceId);
      setLoading(false);
      if (success) {
        setDevices(devices.filter(d => d.device_id !== deviceId));
        setMessage('Dispositif supprimé avec succès', 'success');
      } else {
        setMessage('Erreur lors de la suppression', 'error');
      }
    }
  }, [devices, setMessage]);

  const handleDeviceStatusChange = useCallback(async (deviceId: string, status: string) => {
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
      setMessage(statusMessages[status] || `Statut mis à jour: ${status}`, 'success');
    } else {
      setMessage('Erreur lors de la mise à jour du statut', 'error');
    }
  }, [devices, setMessage]);

  const resetNewDevice = useCallback(() => {
    setNewDevice({
      device_id: '',
      name: '',
      status: 'active',
    });
  }, []);

  // ==========================================================
  // CONFIGURATION EMAIL
  // ==========================================================
  const [emailConfig, setEmailConfig] = useState({
    email_to: '',
    email_from: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    has_password: false,
  });
  const [emailPassword, setEmailPassword] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  const loadEmailConfig = useCallback(async () => {
    const data = await getEmailConfig();
    if (data) {
      setEmailConfig({
        email_to: data.email_to || '',
        email_from: data.email_from || '',
        smtp_host: data.smtp_host || 'smtp.gmail.com',
        smtp_port: data.smtp_port || 587,
        has_password: data.has_password || false,
      });
    }
  }, []);

  const saveEmailConfig = useCallback(async () => {
    setLoading(true);
    const configToSave = {
      email_to: emailConfig.email_to,
      ...(emailConfig.email_from ? { email_from: emailConfig.email_from } : {}),
      ...(emailConfig.smtp_host ? { smtp_host: emailConfig.smtp_host } : {}),
      ...(emailConfig.smtp_port ? { smtp_port: emailConfig.smtp_port } : {}),
      ...(emailPassword ? { smtp_password: emailPassword } : {}),
    };
    const success = await updateEmailConfig(configToSave);
    if (success) {
      setMessage('Configuration email sauvegardée', 'success');
      setEmailPassword('');
      await loadEmailConfig();
    } else {
      setMessage('Erreur lors de la sauvegarde', 'error');
    }
    setLoading(false);
    return success;
  }, [emailConfig, emailPassword, loadEmailConfig, setMessage]);

  const testEmailHandler = useCallback(async () => {
    setTestingEmail(true);
    const success = await testEmail();
    setMessage(success ? 'Email de test envoyé' : 'Échec de l\'envoi', success ? 'success' : 'error');
    setTestingEmail(false);
  }, [setMessage]);

  // ==========================================================
  // UTILISATEURS
  // ==========================================================
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    email: '',
    role: 'viewer',
    active: true,
  });

  const loadUsers = useCallback(async () => {
    const data = await fetchUsers();
    setUsers(data);
  }, []);

  const addUserHandler = useCallback(async () => {
    if (!newUser.username || !newUser.email) return false;

    setLoading(true);
    const user = await addUser(newUser);
    setLoading(false);

    if (user) {
      setUsers([...users, user]);
      setShowAddUser(false);
      setNewUser({ username: '', email: '', role: 'viewer', active: true });
      setMessage('Utilisateur ajouté avec succès', 'success');
      return true;
    }
    return false;
  }, [newUser, users, setMessage]);

  const updateUserHandler = useCallback(async () => {
    if (!editingUser || !editingUser.id) return false;

    setLoading(true);
    const updated = await updateUser(editingUser.id, newUser);
    setLoading(false);

    if (updated) {
      setUsers(users.map(u => u.id === editingUser.id ? updated : u));
      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({ username: '', email: '', role: 'viewer', active: true });
      setMessage('Utilisateur mis à jour', 'success');
      return true;
    }
    return false;
  }, [editingUser, newUser, users, setMessage]);

  const deleteUserHandler = useCallback(async (userId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      setLoading(true);
      const success = await deleteUser(userId);
      setLoading(false);
      if (success) {
        setUsers(users.filter(u => u.id !== userId));
        setMessage('Utilisateur supprimé', 'success');
      }
    }
  }, [users, setMessage]);

  // ==========================================================
  // CONFIGURATION DES PANNEAUX
  // ==========================================================
  const [panelConfig, setPanelConfig] = useState({
    panel_type: 'monocristallin',
    panel_capacity_kw: 3.0,
    panel_area_m2: 1.6,
    panel_efficiency: 0.20,
    tilt_angle: 30,
    azimuth: 180,
    degradation_rate: 0.5,
  });
  const [loadingPanels, setLoadingPanels] = useState(false);

  const loadPanelConfig = useCallback(async () => {
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
  }, []);

  const savePanelConfig = useCallback(async () => {
    setLoadingPanels(true);
    try {
      const success = await updatePanelConfig(panelConfig);
      if (success) {
        setMessage('Configuration sauvegardée', 'success');
      } else {
        setMessage('Erreur lors de la sauvegarde', 'error');
      }
    } catch (error) {
      setMessage('Erreur de connexion', 'error');
    } finally {
      setLoadingPanels(false);
    }
  }, [panelConfig, setMessage]);

  // ==========================================================
  // SUPPRESSION DES DONNÉES
  // ==========================================================
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'old'>('all');
  const [deleteCollection, setDeleteCollection] = useState('surveillance');
  const [retentionDays, setRetentionDays] = useState(30);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAllData = useCallback(async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setMessage('Tapez "SUPPRIMER" pour confirmer', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteAllData(deleteCollection);
      if (result) {
        setMessage(`${result.message} (${result.deleted_count} éléments supprimés)`, 'success');
        if (deleteCollection === 'devices') {
          await loadDevices();
        }
      } else {
        setMessage('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      setMessage('Erreur lors de la suppression', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  }, [deleteConfirmText, deleteCollection, setMessage, loadDevices]);

  const handleDeleteOldData = useCallback(async () => {
    setDeleteLoading(true);
    try {
      const result = await deleteOldData(retentionDays);
      if (result) {
        setMessage(`${result.message}`, 'success');
      } else {
        setMessage('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      setMessage('Erreur lors de la suppression', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  }, [retentionDays, setMessage]);

  // ==========================================================
  // INITIALISATION
  // ==========================================================
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadConfig(),
      loadDevices(),
      loadEmailConfig(),
      loadUsers(),
      loadPanelConfig(),
    ]);
  }, [loadConfig, loadDevices, loadEmailConfig, loadUsers, loadPanelConfig]);

  return {
      loadConfig,
  loadDevices,
  loadEmailConfig,
  loadUsers,
  loadPanelConfig,
  refreshData,
    // États généraux
    loading,
    message,
    setMessage,
    
    // Configuration générale
    config,
    setConfig,
    saveConfig,

    // Dispositifs
    devices,
    showAddDevice,
    setShowAddDevice,
    editingDevice,
    setEditingDevice,
    newDevice,
    setNewDevice,
    addDeviceHandler,
    updateDeviceHandler,
    deleteDeviceHandler,
    handleDeviceStatusChange,
    resetNewDevice,

    // Email
    emailConfig,
    setEmailConfig,
    emailPassword,
    setEmailPassword,
    testingEmail,
    saveEmailConfig,
    testEmailHandler,

    // Utilisateurs
    users,
    showAddUser,
    setShowAddUser,
    editingUser,
    setEditingUser,
    newUser,
    setNewUser,
    addUserHandler,
    updateUserHandler,
    deleteUserHandler,

    // Panneaux
    panelConfig,
    setPanelConfig,
    loadingPanels,
    savePanelConfig,

    // Suppression
    showDeleteModal,
    setShowDeleteModal,
    deleteType,
    setDeleteType,
    deleteCollection,
    setDeleteCollection,
    retentionDays,
    setRetentionDays,
    deleteLoading,
    deleteConfirmText,
    setDeleteConfirmText,
    handleDeleteAllData,
    handleDeleteOldData,
    
  };
}