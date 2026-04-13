// frontend/components/DeviceSelector.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT DEVICE SELECTOR - PV MONITOR
 * ============================================================
 * Ce composant permet de sélectionner un dispositif (ESP32)
 * parmi tous ceux disponibles. Il affiche :
 * - Le dispositif actuellement sélectionné
 * - Un menu déroulant avec tous les dispositifs groupés par zone
 * - Le statut de chaque dispositif (actif, maintenance, hors ligne)
 * - Des informations détaillées (localisation, puissance, dernier heartbeat)
 * 
 * Fonctionnalités :
 * - Bouton d'ouverture/fermeture avec résumé
 * - Liste des dispositifs avec icônes de statut
 * - Groupement par zones
 * - Option "Tous les sites" pour la vue globale
 * - Affichage du dernier heartbeat
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react';
import { 
  MapPin, Globe, CheckCircle, Wrench, WifiOff, 
  AlertTriangle, HardDrive, ChevronDown, Power, X 
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Retourne l'icône correspondant au statut du dispositif
 * @param status - Statut du device ('active', 'maintenance', 'offline', etc.)
 * @returns Élément JSX avec l'icône appropriée
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle size={14} color={C.green} />;
    case 'maintenance':
      return <Wrench size={14} color={C.amber} />;
    case 'offline':
      return <WifiOff size={14} color={C.text3} />;
    default:
      return <AlertTriangle size={14} color={C.red} />;
  }
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function DeviceSelector() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [isOpen, setIsOpen] = useState(false); // Menu ouvert/fermé
  
  // ==========================================================
  // CONTEXTE
  // ==========================================================
  const { 
    devices,              // Liste de tous les dispositifs
    selectedDevice,       // ID du dispositif sélectionné
    setSelectedDevice,    // Fonction pour changer la sélection
    loading,              // État de chargement
    zones,                // Liste des zones disponibles
    getDeviceById         // Fonction pour récupérer un device par son ID
  } = useDevice();

  // Informations sur le dispositif sélectionné
  const selectedDeviceInfo = selectedDevice ? getDeviceById(selectedDevice) : null;

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ position: 'relative' }}>
   
      {/* ==================================================== */}
      {/* MENU DÉROULANT (affiché si isOpen = true) */}
      {/* ==================================================== */}
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 100,
              zIndex: 998,
            }}
          />
          
          {/* Panneau du menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 300,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            
            {/* ================================================ */}
            {/* EN-TÊTE DU MENU */}
            {/* ================================================ */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${C.border}`,
              background: C.surface2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={C.green} />
                Sélectionner un site
              </span>
              <span style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <HardDrive size={12} />
                {devices.length} dispositifs
              </span>
            </div>

            {/* ================================================ */}
            {/* LISTE DES DISPOSITIFS (scrollable) */}
            {/* ================================================ */}
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              
              {/* ============================================ */}
              {/* OPTION "TOUS LES SITES" (vue globale) */}
              {/* ============================================ */}
              <div
                onClick={() => {
                  setSelectedDevice(null);
                  setIsOpen(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: !selectedDevice ? C.greenL : 'transparent',
                  borderLeft: !selectedDevice ? `3px solid ${C.green}` : '3px solid transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => {
                  if (selectedDevice !== null) {
                    e.currentTarget.style.background = C.surface2;
                  }
                }}
                onMouseLeave={e => {
                  if (selectedDevice !== null) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Globe size={20} color={!selectedDevice ? C.green : C.text2} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>
                      Tous les sites
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>
                      Vue globale de tous les panneaux
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* GROUPEMENT PAR ZONES */}
              {/* ============================================ */}
              {zones.map(zone => {
                const zoneDevices = devices.filter(d => d.zone === zone);
                return (
                  <div key={zone}>
                    {/* En-tête de zone */}
                    <div style={{
                      padding: '8px 16px',
                      background: C.surface2,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.text3,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      {zone}
                    </div>
                    
                    {/* Devices de la zone */}
                    {zoneDevices.map(device => (
                      <div
                        key={device.device_id}
                        onClick={() => {
                          setSelectedDevice(device.device_id);
                          setIsOpen(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          paddingLeft: 32,
                          cursor: 'pointer',
                          background: selectedDevice === device.device_id ? C.greenL : 'transparent',
                          borderLeft: selectedDevice === device.device_id ? `3px solid ${C.green}` : '3px solid transparent',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => {
                          if (selectedDevice !== device.device_id) {
                            e.currentTarget.style.background = C.surface2;
                          }
                        }}
                        onMouseLeave={e => {
                          if (selectedDevice !== device.device_id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Icône de statut */}
                          <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                            {getStatusIcon(device.status)}
                          </div>
                          
                          {/* Informations du device */}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 13, 
                              color: C.text,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}>
                              {device.name}
                              
                              {/* Badge de statut (si non actif) */}
                              {device.status !== 'active' && (
                                <span style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  background: device.status === 'maintenance' ? C.amber + '20' : 
                                             device.status === 'offline' ? C.text3 + '20' : C.red + '20',
                                  color: device.status === 'maintenance' ? C.amber :
                                         device.status === 'offline' ? C.text3 : C.red,
                                  borderRadius: 99,
                                  textTransform: 'uppercase',
                                }}>
                                  {device.status}
                                </span>
                              )}
                            </div>
                          
                          </div>
                          
                          {/* Indicateur de sélection */}
                          {selectedDevice === device.device_id && (
                            <CheckCircle size={14} color={C.green} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Message si aucun dispositif */}
              {devices.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: C.text3 }}>
                  <Power size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontSize: 13 }}>Aucun dispositif trouvé</div>
                </div>
              )}
            </div>

            {/* ================================================ */}
            {/* PIED DE PAGE (dernier heartbeat) */}
            {/* ================================================ */}
            {devices.length > 0 && selectedDeviceInfo && (
              <div style={{
                padding: '10px 16px',
                borderTop: `1px solid ${C.border}`,
                background: C.surface2,
                fontSize: 11,
                color: C.text3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>
                  Dernier heartbeat: {selectedDeviceInfo.last_heartbeat 
                    ? new Date(selectedDeviceInfo.last_heartbeat).toLocaleTimeString('fr-FR') 
                    : '-'}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.text3,
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
// ============================================================
// DÉBOGAGE : Vérification de toutes les listes rendues
// ============================================================
console.log("🔍 [DeviceSelector] Vérification des listes :", {
  zonesLength: zones.length,
  totalDevices: devices.length,
  zonesWithDevices: zones.map(z => ({ zone: z, count: devices.filter(d => d.zone === z).length }))
});

}