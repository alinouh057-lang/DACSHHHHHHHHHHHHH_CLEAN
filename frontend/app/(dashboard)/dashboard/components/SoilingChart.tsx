// ============================================================================
// FICHIER: SoilingChart.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un graphique de l'évolution de l'ensablement
//   des panneaux solaires au fil du temps. Il permet de visualiser la
//   progression de la saleté (poussière, sable) et d'anticiper les besoins
//   de nettoyage.
//
// 🎨 FONCTIONNALITÉS:
//   - Graphique AreaChart (Recharts) avec une seule courbe
//   - Dégradé de couleur sous la courbe (orange/ambre)
//   - Axe X avec le temps (heures ou dates)
//   - Axe Y avec unité "%" et domaine fixe [0, 100]
//   - Tooltip personnalisé pour afficher les valeurs détaillées
//   - Grille discrète pour faciliter la lecture
//   - Message "Aucune donnée disponible" si pas de données
//
// 📦 PROPS (entrées):
//   - data   : tableau d'objets { time, soiling }
//   - height : hauteur du graphique (défaut: 180px)
//
// 🎨 COULEURS:
//   - C.amber : orange/ambre pour la courbe d'ensablement (#c47d0e)
//   - C.border: gris pour la grille et axes
//   - C.text3 : gris clair pour les ticks
//
// 📊 INTERPRÉTATION:
//   - Courbe basse (<30%)  → panneau propre (Clean)
//   - Courbe moyenne (30-60%) → ensablement modéré (Warning)
//   - Courbe haute (>60%) → ensablement critique (Critical)
//   - Pente ascendante → accumulation de poussière (nettoyage nécessaire)
//   - Pente descendante → nettoyage effectué (amélioration)
//
// 💡 UTILISATION:
//   <SoilingChart data={soilingData} height={250} />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (Recharts nécessite le DOM)

import {
  ResponsiveContainer,   // Conteneur responsive pour le graphique
  AreaChart,             // Graphique en aires (surface sous la courbe)
  Area,                  // Aire sous la courbe
  XAxis,                 // Axe horizontal (temps)
  YAxis,                 // Axe vertical (pourcentage d'ensablement)
  CartesianGrid,         // Grille de fond
  Tooltip,               // Infobulle au survol
} from 'recharts';
import { Activity } from 'lucide-react';  // Icône pour l'état vide
import { C } from '@/lib/colors';        // Palette de couleurs globale
import CustomTooltip from './CustomTooltip';  // Tooltip personnalisé

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface SoilingChartProps {
  data: Array<{
    time: string;        // Étiquette temporelle (ex: "12:00", "2026-04-11")
    soiling: number;     // Niveau d'ensablement (0-100%)
  }>;
  height?: number;       // Hauteur du graphique (défaut: 180px)
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Graphique d'évolution de l'ensablement des panneaux solaires.
 * 
 * 📥 PROPS:
 *   - data   : Tableau de points { time, soiling }
 *   - height : Hauteur en pixels (défaut: 180)
 * 
 * 📤 RENDU:
 *   - Graphique en aires (AreaChart) avec dégradé orange
 *   - Axes, grille, tooltip personnalisé
 *   - Message si aucune donnée
 * 
 * 🎨 DÉGRADÉ:
 *   - gSoil : orange/ambre transparent vers transparent
 *            (sous la courbe d'ensablement)
 * 
 * 📊 SEUILS DE RÉFÉRENCE:
 *   - < 30% : Panneau propre (Clean)      → zone verte
 *   - 30-60% : Ensablement modéré (Warning) → zone orange
 *   - > 60% : Ensablement critique (Critical) → zone rouge
 * 
 * 💡 CONSEILS D'INTERPRÉTATION:
 *   Une augmentation rapide de la courbe indique une accumulation
 *   rapide de poussière/sable. Un plateau haut (>60%) indique un
 *   besoin immédiat de nettoyage.
 */
export default function SoilingChart({ data, height = 180 }: SoilingChartProps) {
  // ============================================================
  // ÉTAT VIDE : Pas de données à afficher
  // ============================================================
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.surface2,      // Fond secondaire
          borderRadius: 8,
          color: C.text3,               // Texte gris
          fontSize: 13,
        }}
      >
        <Activity size={20} style={{ marginRight: 8, opacity: 0.5 }} />
        Aucune donnée disponible
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL : Graphique en aires
  // ============================================================
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        
        {/* ==================================================== */}
        {/* DÉGRADÉ (pour remplissage sous la courbe) */}
        {/* ==================================================== */}
        <defs>
          <linearGradient id="gSoil" x1="0" y1="0" x2="0" y2="1">
            {/* Haut du dégradé : orange/ambre intense */}
            <stop offset="5%" stopColor={C.amber} stopOpacity={0.25} />
            {/* Bas du dégradé : presque transparent */}
            <stop offset="95%" stopColor={C.amber} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* ==================================================== */}
        {/* GRILLE DE FOND */}
        {/* ==================================================== */}
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} strokeOpacity={0.6} />

        {/* ==================================================== */}
        {/* AXE X (TEMPS) */}
        {/* ==================================================== */}
        <XAxis
          dataKey="time"                   // Clé dans les données
          stroke={C.text3}
          tick={{ fontSize: 10, fill: C.text3 }}
          tickLine={false}                // Pas de petite barre sur les ticks
          axisLine={{ stroke: C.border }}
          padding={{ left: 10, right: 10 }}
        />

        {/* ==================================================== */}
        {/* AXE Y (POURCENTAGE D'ENSABLEMENT) */}
        {/* ==================================================== */}
        <YAxis
          stroke={C.text3}
          tick={{ fontSize: 10, fill: C.text3 }}
          tickLine={false}
          axisLine={false}                // Pas de ligne d'axe verticale
          unit="%"                         // Affiche "%" après chaque valeur
          domain={[0, 100]}               // L'ensablement est toujours entre 0 et 100%
          width={35}                       // Largeur réservée pour les ticks
        />

        {/* ==================================================== */}
        {/* TOOLTIP (INFOBULLE) */}
        {/* ==================================================== */}
        <Tooltip 
          content={<CustomTooltip />}      // Tooltip personnalisé
          cursor={{ stroke: C.border, strokeWidth: 1 }}  // Ligne verticale de suivi
        />

        {/* ==================================================== */}
        {/* COURBE : ENSABLEMENT (AIRE ORANGE) */}
        {/* ==================================================== */}
        <Area
          type="monotone"                 // Interpolation lissée
          dataKey="soiling"               // Clé dans les données
          stroke={C.amber}                // Couleur de la ligne (orange/ambre)
          strokeWidth={2.5}               // Épaisseur de la ligne
          fill="url(#gSoil)"              // Dégradé orange sous la courbe
          name="Ensablement"              // Nom affiché dans tooltip
          unit="%"                        // Unité affichée dans tooltip
          activeDot={{ r: 4, fill: C.amber }}  // Point actif agrandi (orange)
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}