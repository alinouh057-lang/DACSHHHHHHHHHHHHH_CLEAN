// components/Recommendations.tsx
'use client';
import { AlertTriangle, CheckCircle, Calendar, Sun } from 'lucide-react';
import { C } from '@/lib/colors';

interface RecommendationsProps {
  soilingLevel: number;
  pth: number;
  roiValue: string;
  roiNum: number;
}

export default function Recommendations({ soilingLevel, pth, roiValue, roiNum }: RecommendationsProps) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.purple }} />
        <AlertTriangle size={14} /> RECOMMANDATIONS DE NETTOYAGE
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        
        {/* COLONNE 1 : STATUT ACTUEL ET RECOMMANDATION */}
        <div style={{
          background: soilingLevel >= 60 ? C.redL : C.surface2,
          borderRadius: 10,
          padding: 16,
          borderLeft: `4px solid ${soilingLevel >= 60 ? C.red : 'transparent'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {soilingLevel >= 60 ? <AlertTriangle size={20} color={C.red} /> : <CheckCircle size={20} color={C.green} />}
            <span style={{ fontWeight: 700, color: soilingLevel >= 60 ? C.red : C.green }}>
              {soilingLevel >= 60 ? 'Nettoyage urgent' : soilingLevel >= 30 ? 'Surveillance requise' : 'Panneau propre'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>
            {soilingLevel >= 60 
              ? `Ensablement critique (${soilingLevel.toFixed(1)}%). Nettoyage recommandé dans les 24h.`
              : soilingLevel >= 30
              ? `Ensablement modéré (${soilingLevel.toFixed(1)}%). Planifier un nettoyage dans la semaine.`
              : `Ensablement faible (${soilingLevel.toFixed(1)}%). Aucune action requise.`}
          </p>
          <div style={{ fontSize: 11, color: C.text3 }}>
            Perte estimée: {((soilingLevel / 100) * pth * 24 / 1000).toFixed(2)} kWh/jour
          </div>
        </div>

        {/* COLONNE 2 : PRÉDICTION 7 JOURS */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Calendar size={20} color={C.blue} />
            <span style={{ fontWeight: 700, color: C.text }}>Prédiction 7 jours</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text2 }}>Ensablement estimé</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
                {((soilingLevel || 0) * 1.1).toFixed(1)}%
              </span>
            </div>
            {/* Barre de progression prédictive */}
            <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
              <div style={{
                width: `${Math.min((soilingLevel || 0) * 1.1, 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${C.green}, ${C.amber})`,
                borderRadius: 2,
              }} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.text3 }}>
            ↗️ Tendance haussière due à l'absence de pluie prévue
          </p>
        </div>

        {/* COLONNE 3 : IMPACT ÉCONOMIQUE */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sun size={20} color={C.amber} />
            <span style={{ fontWeight: 700, color: C.text }}>Impact économique</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text2 }}>Coût nettoyage</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>50 DT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text2 }}>Gain annuel estimé</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{roiValue} DT</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.text3 }}>
            ROI: {roiNum > 0 ? 'Rentable' : 'Non rentable'} sur 1 an
          </p>
        </div>
      </div>
    </div>
  );
}