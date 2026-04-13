// frontend/components/NotificationBell.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT NOTIFICATION BELL - PV MONITOR
 * ============================================================
 * Ce composant affiche une cloche de notifications avec :
 * - Un badge indiquant le nombre de notifications non lues
 * - Un menu déroulant listant toutes les notifications
 * - Des actions pour marquer comme lu
 * - Gestion des permissions de notifications push
 * 
 * Fonctionnalités :
 * - Indicateur visuel de notifications non lues
 * - Menu déroulant avec liste des notifications
 * - Marquage individuel ou en masse
 * - Gestion des permissions de notifications navigateur
 * - Support des types (info, warning, success)
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';

// ============================================================
// TYPES
// ============================================================

/**
 * Type pour une notification
 */
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  timestamp: Date;
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function NotificationBell() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [showMenu, setShowMenu] = useState(false); // Menu ouvert/fermé
  const [notifications, setNotifications] = useState<Notification[]>([]); // Liste des notifications

  // ==========================================================
  // HOOKS
  // ==========================================================
  const {
    isSupported,          // Le navigateur supporte-t-il les notifications ?
    permission,           // Permission actuelle ('default', 'granted', 'denied')
    requestPermission,    // Fonction pour demander la permission
    sendTestNotification  // Fonction pour envoyer une notification test
  } = useNotifications();

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Simule des notifications (à remplacer par de vraies données)
   * Au chargement, crée deux notifications d'exemple
   */
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        title: 'Nettoyage recommandé',
        message: 'Ensablement à 45% sur ESP32_ZONE_A1',
        type: 'warning',
        read: false,
        timestamp: new Date()
      },
      {
        id: '2',
        title: 'Backend connecté',
        message: 'Système opérationnel',
        type: 'success',
        read: true,
        timestamp: new Date(Date.now() - 3600000) // Il y a 1 heure
      }
    ]);
  }, []);

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Nombre de notifications non lues
   */
  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * Marque une notification comme lue
   * @param id - ID de la notification
   */
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  /**
   * Gère le clic sur la cloche
   * - Si permission non accordée : demande la permission
   * - Si permission accordée : envoie une notification test
   */
  const handleNotificationClick = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    } else {
      await sendTestNotification();
    }
  };

  /**
   * Retourne l'icône correspondant au type de notification
   * @param type - Type de notification
   */
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertCircle size={14} color={C.amber} />;
      case 'success': return <CheckCircle size={14} color={C.green} />;
      default: return <Bell size={14} color={C.text2} />;
    }
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ position: 'relative' }}>
      
      {/* ==================================================== */}
      {/* BOUTON PRINCIPAL (cloche avec badge) */}
      {/* ==================================================== */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: 36, 
          height: 36,
          borderRadius: 9,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'var(--tr)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-l)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
      >
        <Bell size={18} color="var(--text2)" />
        
        {/* Badge de notifications non lues */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--red)',
            color: 'white',
            fontSize: 10,
            fontWeight: 600,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* ==================================================== */}
      {/* MENU DE NOTIFICATIONS (affiché si showMenu = true) */}
      {/* ==================================================== */}
      {showMenu && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />
          
          {/* Panneau des notifications */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 320,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            
            {/* ================================================ */}
            {/* EN-TÊTE DU PANNEAU */}
            {/* ================================================ */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Notifications
              </span>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Bouton "Tout marquer comme lu" (si nécessaire) */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--green)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Tout marquer comme lu
                  </button>
                )}
                
                {/* Bouton de fermeture */}
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text2)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ================================================ */}
            {/* GESTION DES PERMISSIONS DE NOTIFICATIONS */}
            {/* ================================================ */}

            {/* Message si notifications non supportées */}
            {!isSupported && (
              <div style={{
                padding: 16,
                background: 'var(--amber-l)',
                color: 'var(--amber)',
                fontSize: 12,
                textAlign: 'center',
              }}>
                ⚠️ Les notifications ne sont pas supportées
              </div>
            )}

            {/* Bannière d'activation des notifications */}
            {isSupported && permission !== 'granted' && (
              <div style={{
                padding: 16,
                background: 'var(--blue-l)',
                fontSize: 12,
                textAlign: 'center',
              }}>
                <p style={{ marginBottom: 8, color: 'var(--text)' }}>
                  Activez les notifications pour recevoir les alertes
                </p>
                <button
                  onClick={handleNotificationClick}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--green)',
                    color: 'white',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Activer les notifications
                </button>
              </div>
            )}

            {/* ================================================ */}
            {/* LISTE DES NOTIFICATIONS */}
            {/* ================================================ */}

            {/* Message si aucune notification */}
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text3)',
              }}>
                <BellOff size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 13 }}>Aucune notification</p>
              </div>
            ) : (
              /* Liste des notifications (scrollable) */
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: notif.read ? 'transparent' : 'var(--green-l)',
                      cursor: 'pointer',
                      transition: 'var(--tr)',
                      opacity: notif.read ? 0.7 : 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--green-l)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      
                      {/* Icône de type */}
                      {getTypeIcon(notif.type)}
                      
                      {/* Contenu de la notification */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text)',
                          marginBottom: 2,
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: 'var(--text2)',
                          marginBottom: 4,
                        }}>
                          {notif.message}
                        </div>
                        <div style={{
                          fontSize: 9,
                          color: 'var(--text3)',
                        }}>
                          {notif.timestamp.toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                      
                      {/* Indicateur de non-lu (point vert) */}
                      {!notif.read && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--green)',
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}