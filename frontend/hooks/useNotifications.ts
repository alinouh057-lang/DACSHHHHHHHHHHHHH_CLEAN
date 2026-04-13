// frontend/hooks/useNotifications.ts
'use client';

/**
 * ============================================================
 * HOOK USENOTIFICATIONS - PV MONITOR
 * ============================================================
 * Ce hook personnalisé gère les notifications push et les
 * notifications du navigateur. Il permet de :
 * - Vérifier le support des notifications
 * - Demander la permission à l'utilisateur
 * - S'abonner / se désabonner aux notifications push
 * - Envoyer des notifications de test
 * 
 * Technologies utilisées :
 * - Notification API (notifications natives)
 * - Push API (notifications push)
 * - Service Workers
 * - VAPID pour l'authentification push
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';

// ============================================================
// TYPES
// ============================================================

/**
 * Définition manuelle de l'interface pour les actions de notification
 * (car TypeScript ne l'inclut pas par défaut dans NotificationOptions)
 */
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Interface étendue pour les notifications avec options avancées
 */
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: NotificationAction[];
  timestamp?: number;
  vibrate?: number[];
  badge?: string;
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================
export function useNotifications() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [isSupported, setIsSupported] = useState(false);         // Le navigateur supporte-t-il les notifications ?
  const [permission, setPermission] = useState<NotificationPermission>('default'); // Permission actuelle
  const [subscription, setSubscription] = useState<PushSubscription | null>(null); // Souscription push

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Vérifie le support des notifications au montage
   * - Notification API doit exister
   * - Service Worker doit être supporté
   */
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Récupère la souscription existante si elle existe
      getSubscription();
    }
  }, []);

  // ==========================================================
  // FONCTIONS DE GESTION DES SOUSCRIPTIONS
  // ==========================================================

  /**
   * Récupère la souscription push existante
   */
  const getSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('❌ Erreur récupération souscription:', error);
    }
  };

  // ==========================================================
  // FONCTIONS DE PERMISSION
  // ==========================================================

  /**
   * Demande la permission à l'utilisateur pour les notifications
   * @returns true si permission accordée, false sinon
   */
  const requestPermission = async () => {
    if (!isSupported) {
      alert('Les notifications ne sont pas supportées par votre navigateur');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeUser();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur demande permission:', error);
      return false;
    }
  };

  // ==========================================================
  // FONCTIONS PUSH
  // ==========================================================

  /**
   * Abonne l'utilisateur aux notifications push
   * - Utilise le service worker
   * - Envoie la souscription au serveur
   */
  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Clé publique VAPID (à remplacer par la vôtre)
      // VAPID = Voluntary Application Server Identification
      const vapidPublicKey = 'BG8mXqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ';
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      // Demande la souscription push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,           // Toutes les notifications doivent être visibles
        applicationServerKey: convertedKey // Clé VAPID
      });

      setSubscription(sub);
      
      // Envoi de la souscription au serveur
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sub.toJSON())
      });

      console.log('✅ Souscription push réussie');
    } catch (error) {
      console.error('❌ Erreur souscription push:', error);
    }
  };

  /**
   * Désabonne l'utilisateur des notifications push
   */
  const unsubscribeUser = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      
      // Informer le serveur du désabonnement
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      console.log('✅ Désabonnement réussi');
    } catch (error) {
      console.error('❌ Erreur désabonnement:', error);
    }
  };

  // ==========================================================
  // FONCTIONS DE TEST
  // ==========================================================

  /**
   * Envoie une notification de test
   * - Demande la permission si nécessaire
   * - Affiche une notification avec options avancées
   * - Gère la compatibilité des actions
   */
  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // ========================================================
      // OPTIONS DE BASE DE LA NOTIFICATION
      // ========================================================
      const options: ExtendedNotificationOptions = {
        body: 'Les notifications fonctionnent ! 🎉',
        icon: '/icon-192.png',          // Icône principale
        badge: '/icon-192.png',          // Badge (mobile)
        vibrate: [200, 100, 200],        // Motif de vibration
        timestamp: Date.now(),            // Horodatage
        data: {
          dateOfArrival: Date.now(),      // Données personnalisées
          primaryKey: 1
        }
      };

      // ========================================================
      // GESTION DES ACTIONS (si supportées)
      // ========================================================
      // Vérification au runtime si l'API actions existe
      // (évite les erreurs sur les navigateurs qui ne supportent pas)
      try {
        // @ts-ignore - Tester si l'API actions existe
        if (Notification.prototype.actions !== undefined) {
          options.actions = [
            {
              action: 'open',
              title: 'Voir'
            }
          ];
        }
      } catch (e) {
        // Ignorer si l'API n'existe pas
      }

      // Affichage de la notification
      await registration.showNotification('PV Monitor - Test', options as NotificationOptions);
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
    }
  };

  // ==========================================================
  // RETOUR DU HOOK
  // ==========================================================
  return {
    isSupported,           // Les notifications sont-elles supportées ?
    permission,            // Permission actuelle ('default', 'granted', 'denied')
    subscription,          // Souscription push (si existante)
    requestPermission,     // Demande la permission
    unsubscribeUser,       // Se désabonne
    sendTestNotification   // Envoie une notification test
  };
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Convertit une clé VAPID en base64 vers un Uint8Array
 * Nécessaire pour l'API Push
 * 
 * @param base64String - Clé VAPID en base64url
 * @returns Uint8Array pour l'API Push
 */
function urlBase64ToUint8Array(base64String: string) {
  // Ajout du padding nécessaire
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')  // Convertit - en +
    .replace(/_/g, '/');  // Convertit _ en /

  // Décodage base64
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  // Conversion en Uint8Array
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}