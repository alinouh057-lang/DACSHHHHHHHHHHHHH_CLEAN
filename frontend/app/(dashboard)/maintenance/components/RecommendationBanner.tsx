// components/RecommendationBanner.tsx
'use client';
import { Bell, Plus } from 'lucide-react';
import { C } from '@/lib/colors';
import type { Recommendation } from '@/lib/api';

interface RecommendationBannerProps {
  rec: Recommendation | null;
  onPlanifier: () => void;
}

export default function RecommendationBanner({ rec, onPlanifier }: RecommendationBannerProps) {
  if (!rec) return null;
  
  const rc = rec?.color ?? C.green;
  
  return (
    <div className="fade-up" style={{
      borderRadius: 13, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 20, border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${rc}`,
      background: `${rc}08`,
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ 
          width: 46, height: 46, borderRadius: 11, 
          background: `${rc}18`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          flexShrink: 0 
        }}>
          <Bell size={24} color={rc} />
        </div>
        <div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: rc }}>
            {rec.action}
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, marginTop: 2 }}>{rec.reason}</div>
        </div>
      </div>
      <button
        onClick={onPlanifier}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: `1px solid ${rc}`,
          background: 'transparent',
          color: rc,
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Plus size={12} />
        Planifier intervention
      </button>
    </div>
  );
}