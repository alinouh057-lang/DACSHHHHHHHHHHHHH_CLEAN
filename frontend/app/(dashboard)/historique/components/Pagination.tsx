// components/Pagination.tsx
'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '@/lib/colors';

interface PaginationProps {
  skip: number;
  limit: number;
  total: number;
  hasMore: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function Pagination({ skip, limit, total, hasMore, onPrevPage, onNextPage }: PaginationProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.text3 }}>
        <span style={{ fontWeight: 600, color: C.text }}>{total}</span> éléments au total
      </div>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onPrevPage}
          disabled={skip === 0}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: skip === 0 ? C.surface2 : C.surface,
            color: skip === 0 ? C.text3 : C.text,
            cursor: skip === 0 ? 'not-allowed' : 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ChevronLeft size={14} /> Précédent
        </button>
        
        <span style={{ padding: '6px 12px', background: C.surface2, borderRadius: 6, fontSize: 12, color: C.text2 }}>
          Page {Math.floor(skip / limit) + 1} / {Math.ceil(total / limit)}
        </span>
        
        <button
          onClick={onNextPage}
          disabled={!hasMore}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: !hasMore ? C.surface2 : C.surface,
            color: !hasMore ? C.text3 : C.text,
            cursor: !hasMore ? 'not-allowed' : 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Suivant <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}