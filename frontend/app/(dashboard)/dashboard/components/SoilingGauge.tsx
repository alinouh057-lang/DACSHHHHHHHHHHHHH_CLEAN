// ============================================================================
// FICHIER: SoilingGauge.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche une jauge (gauge) visuelle du niveau d'ensablement
//   des panneaux solaires. Il combine une valeur numérique, une barre de
//   progression colorée, des repères de seuils (Clean/Warning/Critical) et
//   un badge de statut avec icône.
//
// 🎨 FONCTIONNALITÉS:
//   - Affichage de la valeur en pourcentage (grand format)
//   - Barre de progression avec dégradé de couleur (vert → orange → rouge)
//   - Repères verticaux pour les seuils (30% et 60%)
//   - Badge de statut avec icône (Clean/Warning/Critical)
//   - Indicateur de confiance de l'IA (optionnel)
//   - Animation fluide de la barre de progression (transition CSS)
//
// 📦 PROPS (entrées):
//   - level      : Niveau d'ensablement (0-100%) - REQUIS
//   - status     : Statut ("Clean", "Warning", "Critical") - REQUIS
//   - confidence : Confiance de l'IA (0-1) - OPTIONNEL
//
// 🎨 COULEURS:
//   - C.green  : vert pour Clean (<30%)
//   - C.amber  : orange pour Warning (30-60%)
//   - C.red    : rouge pour Critical (>60%)
//   - C.surface2: gris clair pour le fond de la barre
//   - C.border : gris pour les repères
//
// 📊 SEUILS:
//   - Clean    : 0-30%   → panneau propre
//   - Warning  : 30-60%  → nettoyage recommandé
//   - Critical : 60-100% → nettoyage urgent
//
// 🎯 ICÔNES:
//   - Clean    : ✅ CheckCircle
//   - Warning  : ⚠️ AlertCircle
//   - Critical : 🚨 AlertTriangle
//
// 💡 UTILISATION:
//   <SoilingGauge level={45.2} status="Warning" confidence={0.87} />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client

import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';  // Icônes
import { C } from '@/lib/colors';        // Palette de couleurs globale
import { statusColor, statusBg } from '@/lib/api';  // Fonctions de couleur par statut

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface SoilingGaugeProps {
  level: number;           // Niveau d'ensablement (0-100%)
  status: string;          // Statut ("Clean", "Warning", "Critical")
  confidence?: number;     // Confiance de l'IA (0-1) - optionnel
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Jauge visuelle du niveau d'ensablement.
 * 
 * 📥 PROPS:
 *   - level      : Pourcentage d'ensablement (0-100%)
 *   - status     : Statut (Clean/Warning/Critical)
 *   - confidence : Confiance de l'IA (0-1) - optionnel
 * 
 * 📤 RENDU:
 *   - Valeur en grand format (ex: "45.2%")
 *   - Badge de statut avec icône
 *   - Barre de progression avec dégradé
 *   - Repères verticaux aux seuils (30%, 60%)
 *   - Labels "Clean", "Warning", "Critical" sous la barre
 *   - Indicateur de confiance (optionnel)
 * 
 * 🎨 STRUCTURE VISUELLE:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  45.2%                    Confiance: 87%   [⚠️ Warning] │
 *   │                                                         │
 *   │  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
 *   │  ↑           ↑           ↑                             │
 *   │  Clean      Warning     Critical                       │
 *   └─────────────────────────────────────────────────────────┘
 */
export default function SoilingGauge({ level, status, confidence }: SoilingGaugeProps) {
  // ============================================================
  // SÉCURITÉ : Gestion des valeurs invalides
  // ============================================================
  const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
  const safeConfidence = typeof confidence === 'number' && !isNaN(confidence) ? confidence : 0;

  // ============================================================
  // SEGMENTS DE LA JAUGE (seuils)
  // ============================================================
  const segments = [
    { label: 'Clean', max: 30, color: C.green },
    { label: 'Warning', max: 60, color: C.amber },
    { label: 'Critical', max: 100, color: C.red },
  ];

  // ============================================================
  // ICÔNE DU STATUT
  // ============================================================
  const statusIcon = {
    Clean: <CheckCircle size={14} />,      // ✅
    Warning: <AlertCircle size={14} />,    // ⚠️
    Critical: <AlertTriangle size={14} />, // 🚨
  }[status] ?? <Info size={14} />;         // ℹ️ (fallback)

  // ============================================================
  // COULEUR ASSOCIÉE AU STATUT
  // ============================================================
  const color = statusColor(status);  // vert/orange/rouge

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div>
      {/* ======================================================== */}
      {/* LIGNE 1 : VALEUR + BADGE + CONFIDENCE */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        {/* Valeur en grand format */}
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, color }}>
          {safeLevel.toFixed(1)}%
        </span>
        
        {/* Confidence + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {confidence && (
            <span style={{ fontSize: 11, color: C.text3 }}>
              Confiance: {(safeConfidence * 100).toFixed(0)}%
            </span>
          )}
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
              background: statusBg(status),   // Fond pastel selon statut
              color,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {statusIcon} {status}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRE DE PROGRESSION */}
      {/* ======================================================== */}
      <div
        style={{
          height: 10,
          borderRadius: 99,
          background: C.surface2,          // Fond gris clair
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Barre colorée (largeur = niveau d'ensablement) */}
        <div
          style={{
            height: '100%',
            width: `${safeLevel}%`,
            background: `linear-gradient(90deg, ${C.green}, ${color})`,  // Dégradé vert → couleur statut
            borderRadius: 99,
            transition: 'width .8s ease',   // Animation fluide
          }}
        />
        
        {/* Repères verticaux aux seuils (30%, 60%) */}
        {segments.map(s => (
          <div
            key={s.label}
            style={{
              position: 'absolute',
              top: 0,
              left: `${s.max}%`,
              height: '100%',
              width: 1,
              background: C.border,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>

      {/* ======================================================== */}
      {/* LIGNE 3 : LABELS DES SEUILS */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {segments.map(s => (
          <span key={s.label} style={{ fontSize: 10, color: C.text3 }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}