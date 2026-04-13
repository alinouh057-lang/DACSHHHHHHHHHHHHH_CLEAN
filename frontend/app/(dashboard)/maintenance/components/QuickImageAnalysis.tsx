// components/QuickImageAnalysis.tsx
'use client';
import { useState } from 'react';
import { Camera, Upload, Loader } from 'lucide-react';
import { analyzeImage, statusColor } from '@/lib/api';
import { C } from '@/lib/colors';

interface QuickImageAnalysisProps {
  onAnalysisComplete?: (result: any) => void;
}

export default function QuickImageAnalysis({ onAnalysisComplete }: QuickImageAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    const r = await analyzeImage(file);
    setLoading(false);
    if (r) {
      setResult(r);
      onAnalysisComplete?.(r);
    }
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(13,82,52,.06)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
        <Camera size={14} /> ANALYSE IMAGE RAPIDE
      </div>
      <label style={{
        display: 'block', border: `2px dashed ${C.border}`, borderRadius: 11,
        padding: '22px 14px', textAlign: 'center', cursor: 'pointer',
        background: C.surface2, color: C.text3, transition: 'var(--tr)',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLLabelElement; el.style.borderColor = C.green; el.style.background = C.greenL; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLLabelElement; el.style.borderColor = C.border; el.style.background = C.surface2; }}
      >
        <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        {loading ? (
          <span style={{ fontSize: 13, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Loader size={16} className="spin" /> Analyse IA en cours…
          </span>
        ) : (
          <>
            <Upload size={32} style={{ marginBottom: 8, opacity: 0.7 }} />
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Glisser une image ici</div>
            <div style={{ fontSize: 10.5, marginTop: 2 }}>JPG / PNG · Analyse immédiate</div>
          </>
        )}
      </label>
      {result && (
        <div style={{ background: C.surface2, borderRadius: 9, padding: 11, marginTop: 9 }}>
          <div style={{ height: 3, background: statusColor(result.status), borderRadius: 2, marginBottom: 8 }} />
          {result.image_b64 && (
            <img src={`data:image/jpeg;base64,${result.image_b64}`}
              alt="résultat" style={{ width: '100%', borderRadius: 7, maxHeight: 130, objectFit: 'cover', marginBottom: 8 }} />
          )}
          <span style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 800, color: statusColor(result.status) }}>
            {result.soiling_level?.toFixed(1)}%
          </span>
          <span style={{ fontSize: 13, color: C.text2, marginLeft: 6 }}>— {result.status}</span>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
            Confiance : {result.confidence?.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}