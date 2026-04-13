// frontend/components/EmailConfig.tsx
'use client';

/**
 * ============================================================
 * COMPOSANT EMAIL CONFIG - PV MONITOR
 * ============================================================
 * Ce composant permet de configurer les notifications email
 * pour les alertes du système. Il est accessible depuis le header.
 * 
 * Fonctionnalités :
 * - Configuration de l'email destinataire (obligatoire)
 * - Configuration SMTP avancée (serveur, port, authentification)
 * - Test d'envoi d'email
 * - Sauvegarde de la configuration
 * - Indicateur de configuration existante
 * ============================================================
 */

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react';
import { 
  Mail, Settings, Send, Save, X, AlertCircle, 
  CheckCircle, Key, Server, Shield 
} from 'lucide-react';
import { getEmailConfig, updateEmailConfig, testEmail } from '@/lib/api';

// ============================================================
// CONSTANTES DE STYLE
// ============================================================
import { C } from '@/lib/colors';
// ============================================================
// TYPES
// ============================================================

/**
 * Interface pour la configuration email
 */
interface EmailConfig {
  email_to: string;           // Destinataire des alertes (obligatoire)
  email_from?: string;        // Expéditeur (optionnel)
  smtp_host?: string;         // Serveur SMTP (optionnel)
  smtp_port?: number;         // Port SMTP (optionnel)
  has_password: boolean;      // Indique si un mot de passe est déjà configuré
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function EmailConfig() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [isOpen, setIsOpen] = useState(false);                 // Panneau ouvert/fermé
  const [config, setConfig] = useState<EmailConfig>({          // Configuration courante
    email_to: '',
    email_from: '',
    smtp_host: '',
    smtp_port: 587,
    has_password: false,
  });
  const [password, setPassword] = useState('');                 // Mot de passe saisi
  const [saving, setSaving] = useState(false);                  // État de sauvegarde
  const [testing, setTesting] = useState(false);                // État du test
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null); // Message de statut

  // ==========================================================
  // EFFETS DE BORD
  // ==========================================================

  /**
   * Charge la configuration quand le panneau s'ouvre
   */
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  // ==========================================================
  // FONCTIONS DE CHARGEMENT
  // ==========================================================

  /**
   * Charge la configuration email depuis l'API
   */
  const loadConfig = async () => {
    const data = await getEmailConfig();
    if (data) {
      setConfig(data);
    }
  };

  // ==========================================================
  // FONCTIONS DE GESTION
  // ==========================================================

  /**
   * Sauvegarde la configuration email
   * Envoie le mot de passe seulement s'il a été modifié
   */
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    // Préparation des données à sauvegarder
    const configToSave = {
      email_to: config.email_to,
      ...(config.email_from ? { email_from: config.email_from } : {}),
      ...(config.smtp_host ? { smtp_host: config.smtp_host } : {}),
      ...(config.smtp_port ? { smtp_port: config.smtp_port } : {}),
      ...(password ? { smtp_password: password } : {}),
    };
    
    const success = await updateEmailConfig(configToSave);
    
    if (success) {
      setMessage({ text: 'Configuration email sauvegardée', type: 'success' });
      setPassword(''); // Efface le mot de passe après sauvegarde
      await loadConfig(); // Recharge la config pour avoir has_password à jour
    } else {
      setMessage({ text: 'Erreur lors de la sauvegarde', type: 'error' });
    }
    
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  /**
   * Teste l'envoi d'email avec la configuration actuelle
   */
  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    
    const success = await testEmail();
    
    if (success) {
      setMessage({ text: 'Email de test envoyé avec succès', type: 'success' });
    } else {
      setMessage({ text: 'Échec de l\'envoi de l\'email de test', type: 'error' });
    }
    
    setTesting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div style={{ position: 'relative' }}>
      
      {/* ==================================================== */}
      {/* BOUTON D'OUVERTURE (dans le header) */}
      {/* ==================================================== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: C.surface2,
          border: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title="Configuration email"
        onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
        onMouseLeave={e => (e.currentTarget.style.background = C.surface2)}
      >
        <Mail size={18} color={C.text2} />
      </button>

      {/* ==================================================== */}
      {/* PANNEAU DE CONFIGURATION (affiché si isOpen = true) */}
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
              bottom: 0,
              zIndex: 998,
            }}
          />
          
          {/* Panneau lui-même */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 360,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 999,
            padding: 16,
          }}>
            
            {/* ================================================ */}
            {/* EN-TÊTE DU PANNEAU */}
            {/* ================================================ */}
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Mail size={18} color={C.green} />
              <span>Configuration Email</span>
              <span style={{
                fontSize: 11,
                background: C.surface2,
                padding: '2px 8px',
                borderRadius: 99,
                color: C.text3,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <AlertCircle size={10} />
                Alertes
              </span>
            </div>

            {/* ================================================ */}
            {/* FORMULAIRE DE CONFIGURATION */}
            {/* ================================================ */}

            {/* Email destinataire (obligatoire) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: C.text3,
                marginBottom: 4,
                textTransform: 'uppercase',
              }}>
                Email destinataire *
              </label>
              <input
                type="email"
                value={config.email_to}
                onChange={(e) => setConfig({ ...config, email_to: e.target.value })}
                placeholder="ex: technicien@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  fontSize: 13,
                }}
              />
            </div>

            {/* ================================================ */}
            {/* SECTION SMTP AVANCÉE (repliable) */}
            {/* ================================================ */}
            <details style={{ marginBottom: 16 }}>
              <summary style={{
                fontSize: 12,
                color: C.text2,
                cursor: 'pointer',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Settings size={14} />
                Configuration SMTP avancée
              </summary>
              
              <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Email expéditeur (optionnel) */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text3,
                    marginBottom: 4,
                  }}>
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={config.email_from || ''}
                    onChange={(e) => setConfig({ ...config, email_from: e.target.value })}
                    placeholder="ex: alertes@votre-domaine.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface2,
                      color: C.text,
                      fontSize: 13,
                    }}
                  />
                </div>

                {/* Serveur SMTP (optionnel) */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text3,
                    marginBottom: 4,
                  }}>
                    Serveur SMTP
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Server size={14} style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: C.text3,
                    }} />
                    <input
                      type="text"
                      value={config.smtp_host || ''}
                      onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface2,
                        color: C.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                {/* Port SMTP (optionnel) */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text3,
                    marginBottom: 4,
                  }}>
                    Port SMTP
                  </label>
                  <input
                    type="number"
                    value={config.smtp_port || 587}
                    onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
                    min={1}
                    max={65535}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface2,
                      color: C.text,
                      fontSize: 13,
                    }}
                  />
                </div>

                {/* Mot de passe SMTP (optionnel, avec indicateur) */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text3,
                    marginBottom: 4,
                  }}>
                    Mot de passe SMTP
                    {config.has_password && !password && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: C.green, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle size={10} />
                        (déjà configuré)
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={14} style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: C.text3,
                    }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={config.has_password ? "•••••••• (laisser vide pour conserver)" : "Mot de passe"}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface2,
                        color: C.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* ================================================ */}
            {/* MESSAGE DE STATUT */}
            {/* ================================================ */}
            {message && (
              <div style={{
                marginBottom: 16,
                padding: '8px 12px',
                borderRadius: 8,
                background: message.type === 'success' ? C.greenL : C.redL,
                color: message.type === 'success' ? C.green : C.red,
                fontSize: 12,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {message.text}
              </div>
            )}

            {/* ================================================ */}
            {/* BOUTONS D'ACTION */}
            {/* ================================================ */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
            }}>
              {/* Bouton Test */}
              <button
                onClick={handleTest}
                disabled={testing || saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text2,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: testing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {testing ? (
                  '⏳'
                ) : (
                  <>
                    <Send size={14} />
                    Tester
                  </>
                )}
              </button>

              {/* Bouton Sauvegarder */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.green,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {saving ? (
                  '⏳'
                ) : (
                  <>
                    <Save size={14} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>

            {/* ================================================ */}
            {/* BOUTON FERMER */}
            {/* ================================================ */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.text3,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <X size={14} />
              Fermer
            </button>
          </div>
        </>
      )}
    </div>
  );
}