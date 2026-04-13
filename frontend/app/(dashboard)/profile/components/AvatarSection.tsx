// components/AvatarSection.tsx
'use client';
import { Camera } from 'lucide-react';
import { C } from '@/lib/colors';

interface AvatarSectionProps {
  name: string;
  roleLabel: string;
  roleColor: string;
  isEditing: boolean;
  getRoleColor: () => string;
}

export default function AvatarSection({ name, roleLabel, roleColor, isEditing, getRoleColor }: AvatarSectionProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}80)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        position: 'relative',
      }}>
        <span style={{ fontSize: 48, color: 'white', fontWeight: 600 }}>
          {name?.charAt(0).toUpperCase()}
        </span>
        {isEditing && (
          <button style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: C.surface,
            border: `2px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Camera size={16} color={C.text2} />
          </button>
        )}
      </div>
      <div style={{
        padding: '4px 12px',
        background: `${roleColor}18`,
        color: roleColor,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
      }}>
        {roleLabel}
      </div>
    </div>
  );
}