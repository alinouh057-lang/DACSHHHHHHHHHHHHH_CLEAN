// components/SocialLinks.tsx
'use client';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { C } from '@/lib/colors';

interface SocialLinksProps {
  isEditing: boolean;
  editedUser: {
    github: string;
    twitter: string;
    linkedin: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function SocialLinks({ isEditing, editedUser, onInputChange }: SocialLinksProps) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12 }}>
        Réseaux sociaux
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {isEditing ? (
          <>
            <input
              value={editedUser.github}
              onChange={(e) => onInputChange('github', e.target.value)}
              placeholder="GitHub"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 12,
              }}
            />
            <input
              value={editedUser.twitter}
              onChange={(e) => onInputChange('twitter', e.target.value)}
              placeholder="Twitter"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 12,
              }}
            />
            <input
              value={editedUser.linkedin}
              onChange={(e) => onInputChange('linkedin', e.target.value)}
              placeholder="LinkedIn"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.surface2,
                color: C.text,
                fontSize: 12,
              }}
            />
          </>
        ) : (
          <>
            <a href="#" style={{ color: C.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Github size={16} />
              <span style={{ fontSize: 12 }}>{editedUser.github}</span>
            </a>
            <a href="#" style={{ color: C.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Twitter size={16} />
              <span style={{ fontSize: 12 }}>{editedUser.twitter}</span>
            </a>
            <a href="#" style={{ color: C.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Linkedin size={16} />
              <span style={{ fontSize: 12 }}>{editedUser.linkedin}</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}