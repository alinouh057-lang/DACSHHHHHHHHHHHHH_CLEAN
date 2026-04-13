// frontend/contexts/DeviceContext.tsx
'use client';

/**
 * ============================================================
 * CONTEXTE DES DISPOSITIFS - PV MONITOR
 * ============================================================
 * Ce contexte gère l'état global des dispositifs ESP32.
 * Il permet de :
 * - Charger la liste des dispositifs depuis l'API
 * - Sélectionner un dispositif actif
 * - Filtrer les dispositifs par zone
 * - Rafraîchir la liste périodiquement
 * 
 * Fonctionnalités :
 * - Chargement initial automatique
 * - Rafraîchissement toutes les 5 minutes
 * - Sélection du premier dispositif par défaut
 * - Accès aux dispositifs par ID ou par zone
 * - Liste unique des zones disponibles
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchDevices, type Device } from '@/lib/api';

// ============================================================
// TYPES
// ============================================================

/**
 * Interface du contexte des dispositifs
 */
interface DeviceContextType {
  devices: Device[];                          // Liste complète des dispositifs
  selectedDevice: string | null;               // ID du dispositif sélectionné
  setSelectedDevice: (deviceId: string | null) => void; // Change la sélection
  loading: boolean;                            // État de chargement
  refreshDevices: () => Promise<void>;          // Force le rafraîchissement
  getDeviceById: (deviceId: string) => Device | undefined; // Récupère un device par ID
  getDevicesByZone: (zone: string) => Device[]; // Filtre les devices par zone
  zones: string[];                              // Liste des zones disponibles
}

// ============================================================
// CRÉATION DU CONTEXTE
// ============================================================
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// ============================================================
// PROVIDER DU CONTEXTE
// ============================================================
export function DeviceProvider({ children }: { children: ReactNode }) {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [devices, setDevices] = useState<Device[]>([]);       // Liste des dispositifs
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null); // Dispositif sélectionné
  const [loading, setLoading] = useState(true);                // État de chargement

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Charge la liste des dispositifs depuis l'API
   * Met à jour l'état et la sélection par défaut
   */
  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await fetchDevices();
      setDevices(data);
      
      // Si aucun device sélectionné et qu'il y a des devices, sélectionner le premier
      if (!selectedDevice && data.length > 0) {
        setSelectedDevice(data[0].device_id);
      }
    } catch (error) {
      console.error('❌ Erreur chargement devices:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Chargement initial au montage du composant
   * Met en place un rafraîchissement automatique toutes les 5 minutes
   */
  useEffect(() => {
    loadDevices();
    
    // Rafraîchir la liste toutes les 5 minutes
    const interval = setInterval(loadDevices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================================
  // FONCTIONS DE RAFRAÎCHISSEMENT
  // ==========================================================

  /**
   * Force le rafraîchissement manuel de la liste
   */
  const refreshDevices = async () => {
    await loadDevices();
  };

  // ==========================================================
  // FONCTIONS D'ACCÈS AUX DONNÉES
  // ==========================================================

  /**
   * Récupère un dispositif par son ID
   * @param deviceId - ID du dispositif
   * @returns Le dispositif trouvé ou undefined
   */
  const getDeviceById = (deviceId: string) => {
    return devices.find(d => d.device_id === deviceId);
  };

  /**
   * Récupère tous les dispositifs d'une zone donnée
   * @param zone - Nom de la zone
   * @returns Liste des dispositifs de la zone
   */
  const getDevicesByZone = (zone: string) => {
    return devices.filter(d => d.zone === zone);
  };

  /**
   * Liste unique de toutes les zones disponibles
   * (calculée automatiquement à partir des devices)
   */
  const zones = [...new Set(devices.map(d => d.zone))];

  // ==========================================================
  // VALEUR DU CONTEXTE
  // ==========================================================
  return (
    <DeviceContext.Provider value={{
      devices,
      selectedDevice,
      setSelectedDevice,
      loading,
      refreshDevices,
      getDeviceById,
      getDevicesByZone,
      zones,
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

// ============================================================
// HOOK PERSONNALISÉ POUR UTILISER LE CONTEXTE
// ============================================================

/**
 * Hook pour accéder au contexte des dispositifs
 * @returns Le contexte avec toutes les données et fonctions
 * @throws Error si utilisé en dehors d'un DeviceProvider
 */
export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}