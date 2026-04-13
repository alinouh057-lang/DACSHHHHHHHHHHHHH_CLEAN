'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, Loader, MailCheck } from 'lucide-react';
import { C } from '@/lib/colors';
import { getEmailConfig, updateEmailConfig, testEmail } from '@/lib/api';

interface EmailConfigProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function EmailConfig({ onMessage, onRefresh }: EmailConfigProps) {
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    email_to: '',
    email_from: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    has_password: false,
  });
  const [emailPassword, setEmailPassword] = useState('');

  // Charger la configuration au montage
  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
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
  };

  const handleSaveEmail = async () => {
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
      onMessage('Configuration email sauvegardée', 'success');
      setEmailPassword('');
      await loadEmailConfig();
      onRefresh();
    } else {
      onMessage('Erreur lors de la sauvegarde', 'error');
    }
    setLoading(false);
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    const success = await testEmail();
    onMessage(success ? 'Email de test envoyé' : 'Échec de l\'envoi', success ? 'success' : 'error');
    setTestingEmail(false);
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={18} color={C.green} />
        Configuration des notifications email
      </h2>

      <div style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Email destinataire *
          </label>
          <input
            type="email"
            value={emailConfig.email_to}
            onChange={(e) => setEmailConfig({ ...emailConfig, email_to: e.target.value })}
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
            Email expéditeur (optionnel)
          </label>
          <input
            type="email"
            value={emailConfig.email_from}
            onChange={(e) => setEmailConfig({ ...emailConfig, email_from: e.target.value })}
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
            Serveur SMTP
          </label>
          <input
            value={emailConfig.smtp_host}
            onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
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
            Port SMTP
          </label>
          <input
            type="number"
            value={emailConfig.smtp_port}
            onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: Number(e.target.value) })}
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

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 4 }}>
            Mot de passe SMTP
            {emailConfig.has_password && !emailPassword && (
              <span style={{ marginLeft: 8, fontSize: 11, color: C.green }}>
                (déjà configuré)
              </span>
            )}
          </label>
          <input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder={emailConfig.has_password ? "•••••••• (laisser vide pour conserver)" : "Mot de passe"}
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleTestEmail}
            disabled={testingEmail}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface2,
              color: C.text2,
              fontSize: 13,
              cursor: testingEmail ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {testingEmail ? <Loader size={14} className="spin" /> : <MailCheck size={14} />}
            {testingEmail ? 'Envoi...' : 'Tester'}
          </button>
          <button
            onClick={handleSaveEmail}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: C.green,
              color: 'white',
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