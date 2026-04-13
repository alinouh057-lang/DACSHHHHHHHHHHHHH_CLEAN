// components/ProfileHeader.tsx
'use client';
import { User, Edit2, Save, X, Loader } from 'lucide-react';
import { C } from '@/lib/colors';

interface ProfileHeaderProps {
  isEditing: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  getRoleColor: () => string;
}

export default function ProfileHeader({
  isEditing,
  loading,
  onEdit,
  onSave,
  onCancel,
  getRoleColor,
}: ProfileHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
        <User size={24} color={getRoleColor()} />
        Mon Profil
      </h1>
      <div style={{ display: 'flex', gap: 8 }}>
        {!isEditing ? (
          <button
            onClick={onEdit}
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
              gap: 6,
            }}
          >
            <Edit2 size={16} />
            Modifier le profil
          </button>
        ) : (
          <>
            <button
              onClick={onSave}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: C.green,
                color: 'white',
                fontSize: 13,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {loading ? <Loader size={16} className="spin" /> : <Save size={16} />}
              Sauvegarder
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
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
              <X size={16} />
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}