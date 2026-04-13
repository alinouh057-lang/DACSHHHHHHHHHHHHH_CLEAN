// components/PersonalInfoForm.tsx
'use client';
import { C } from '@/lib/colors';

interface PersonalInfoFormProps {
  isEditing: boolean;
  editedUser: {
    name: string;
    email: string;
    phone: string;
  };
  user: any;
  onInputChange: (field: string, value: string) => void;
}

export default function PersonalInfoForm({ isEditing, editedUser, user, onInputChange }: PersonalInfoFormProps) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {/* Nom complet */}
        <div>
          <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>
            Nom complet
          </label>
          {isEditing ? (
            <input
              value={editedUser.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
              }}
            />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{user?.name}</div>
          )}
        </div>

        {/* Email */}
        <div>
          <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={editedUser.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
              }}
            />
          ) : (
            <div style={{ fontSize: 14, color: C.text2 }}>{user?.email}</div>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label style={{ fontSize: 11, color: C.text3, display: 'block', marginBottom: 4 }}>
            Téléphone
          </label>
          {isEditing ? (
            <input
              value={editedUser.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 13,
              }}
            />
          ) : (
            <div style={{ fontSize: 14, color: C.text2 }}>{editedUser.phone || '-'}</div>
          )}
        </div>
      </div>
    </div>
  );
}