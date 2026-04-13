// ============================================================================
// FICHIER: UploadZone.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React permet à l'utilisateur de télécharger une image
//   de panneau solaire pour une analyse IA immédiate. Il gère l'upload,
//   l'affichage du chargement, les erreurs et retourne le résultat
//   (niveau d'ensablement, statut, confiance) au composant parent.
//
// 🎨 FONCTIONNALITÉS:
//   - Zone de dépôt cliquable (label stylisé)
//   - Upload d'images (JPG, JPEG, PNG)
//   - Indicateur de chargement (Loader avec animation)
//   - Gestion des erreurs (connexion, analyse)
//   - Effets hover (bordure verte, fond vert clair)
//   - Feedback visuel selon l'état (normal/loading/error)
//   - Appel asynchrone à l'API d'analyse
//
// 📦 PROPS (entrées):
//   - onResult: Fonction callback appelée avec le résultat de l'analyse
//               (soiling_level, status, confidence, image_b64, etc.)
//
// 🎨 ÉTATS VISUELS:
//   - Normal : bordure grise, fond gris clair
//   - Hover  : bordure verte, fond vert clair
//   - Loading: icône Loader qui tourne + texte "Analyse IA en cours…"
//   - Error  : bordure rouge, fond rouge clair + message d'erreur
//
// 📤 RÉSULTAT (transmis à onResult):
//   {
//     soiling_level: 45.2,        // Pourcentage d'ensablement
//     status: "Warning",           // Clean/Warning/Critical
//     confidence: 87.5,            // Confiance en pourcentage
//     image_b64: "data:image...",  // Image encodée pour affichage
//     cleaning_recommendation: "Nettoyage recommandé"
//   }
//
// 💡 UTILISATION:
//   <UploadZone onResult={(result) => setAnalysisResult(result)} />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client

import { useState } from 'react';      // Hook d'état React
import { Upload, Loader, AlertCircle } from 'lucide-react';  // Icônes
import { C } from '@/lib/colors';      // Palette de couleurs globale

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface UploadZoneProps {
  onResult: (result: any) => void;  // Fonction appelée avec le résultat de l'analyse
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Zone de téléchargement d'image pour analyse IA.
 * 
 * 📥 PROPS:
 *   - onResult: Callback appelé avec les données d'analyse
 * 
 * 📤 RENDU:
 *   - État normal: icône Upload + texte "Glisser une image ici"
 *   - État loading: icône Loader (tournante) + "Analyse IA en cours…"
 *   - État error: icône AlertCircle + message d'erreur
 * 
 * 🔄 FLUX D'EXÉCUTION:
 *   1. L'utilisateur clique sur la zone ou glisse une image
 *   2. handleFile() est appelée avec le fichier
 *   3. loading = true, error = null
 *   4. Appel à analyzeImage() (API backend)
 *   5. Si succès → onResult(result)
 *   6. Si erreur → setError(message)
 *   7. loading = false
 * 
 * 🎨 ANIMATIONS:
 *   - Hover: bordure verte, fond vert clair
 *   - Loader: animation CSS "spin" (définie dans globals.css)
 *   - Transitions fluides via variable CSS --tr
 */
export default function UploadZone({ onResult }: UploadZoneProps) {
  // ============================================================
  // ÉTATS
  // ============================================================
  const [loading, setLoading] = useState(false);       // True pendant l'analyse
  const [error, setError] = useState<string | null>(null);  // Message d'erreur

  // ============================================================
  // FONCTION DE TRAITEMENT DU FICHIER
  // ============================================================
  const handleFile = async (file: File) => {
    setLoading(true);    // Affiche l'indicateur de chargement
    setError(null);      // Efface l'erreur précédente
    
    try {
      // Import dynamique de la fonction d'analyse (optimisation)
      const { analyzeImage } = await import('@/lib/api');
      const result = await analyzeImage(file);

      // Vérifier si l'analyse a réussi
      if (result?.error) {
        setError(`Erreur: ${result.message || 'Échec de l\'analyse'}`);
      } else {
        onResult(result);  // Transmet le résultat au composant parent
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);   // Cache l'indicateur de chargement
    }
  };

  // ============================================================
  // DÉTERMINATION DE L'ÉTAT D'ERREUR POUR LE STYLE
  // ============================================================
  const isError = !!error;

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <label
      style={{
        display: 'block',
        // Bordure: grise normalement, rouge si erreur
        border: `2px dashed ${isError ? C.red : C.border}`,
        borderRadius: 11,
        padding: '22px 14px',
        textAlign: 'center',
        cursor: 'pointer',
        // Fond: gris clair normalement, rouge clair si erreur
        background: isError ? C.redL : C.surface2,
        color: isError ? C.red : C.text3,
        transition: 'var(--tr)',  // Variable CSS pour transition fluide
      }}
      // ========================================================
      // EFFET HOVER (sauf en état d'erreur)
      // ========================================================
      onMouseEnter={e => {
        if (!isError) {
          (e.currentTarget as HTMLLabelElement).style.borderColor = C.green;
          (e.currentTarget as HTMLLabelElement).style.background = C.greenL;
        }
      }}
      onMouseLeave={e => {
        if (!isError) {
          (e.currentTarget as HTMLLabelElement).style.borderColor = C.border;
          (e.currentTarget as HTMLLabelElement).style.background = C.surface2;
        }
      }}
    >
      {/* Input file caché */}
      <input
        type="file"
        accept=".jpg,.jpeg,.png"   // Seulement les formats image
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />

      {/* ======================================================== */}
      {/* AFFICHAGE SELON L'ÉTAT (loading / error / normal) */}
      {/* ======================================================== */}
      {loading ? (
        // ÉTAT CHARGEMENT : Loader tournant
        <span
          style={{
            fontSize: 13,
            color: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Loader size={16} className="spin" /> Analyse IA en cours…
        </span>
      ) : isError ? (
        // ÉTAT ERREUR : Message d'erreur
        <span
          style={{
            fontSize: 13,
            color: C.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={16} /> {error}
        </span>
      ) : (
        // ÉTAT NORMAL : Icône upload + instructions
        <>
          <Upload size={32} style={{ marginBottom: 8, opacity: 0.7 }} />
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Glisser une image ici</div>
          <div style={{ fontSize: 10.5, marginTop: 2 }}>JPG / PNG → Analyse IA immédiate</div>
        </>
      )}
    </label>
  );
}