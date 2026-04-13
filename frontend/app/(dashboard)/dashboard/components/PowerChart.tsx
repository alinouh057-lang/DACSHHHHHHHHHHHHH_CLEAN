// ============================================================================
// FICHIER: PowerChart.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un graphique comparatif de la puissance
//   électrique des panneaux solaires. Il montre deux courbes :
//   - Puissance réelle mesurée (aire verte)
//   - Puissance théorique calculée (ligne bleue pointillée)
//   L'écart entre les deux représente la perte due à l'ensablement.
//
// 🎨 FONCTIONNALITÉS:
//   - Graphique ComposedChart (Recharts) avec aire + ligne
//   - Dégradé de couleur sous la courbe de puissance réelle
//   - Axe X avec le temps (heures ou dates)
//   - Axe Y avec unité "W"
//   - Tooltip personnalisé pour afficher les valeurs détaillées
//   - Grille discrète pour faciliter la lecture
//   - Message "Aucune donnée disponible" si pas de données
//
// 📦 PROPS (entrées):
//   - data   : tableau d'objets { time, power, theoretical }
//   - height : hauteur du graphique (défaut: 220px)
//
// 🎨 COULEURS:
//   - C.green : vert pour la puissance réelle (#1a7f4f)
//   - C.blue  : bleu pour la puissance théorique (#1565c0)
//   - C.border: gris pour la grille et axes
//   - C.text3 : gris clair pour les ticks
//
// 📊 INTERPRÉTATION:
//   - Écart important → ensablement élevé (nettoyage recommandé)
//   - Courbes proches → panneau propre
//   - Puissance théorique > réelle = perte normale due à l'ensablement
//
// 💡 UTILISATION:
//   <PowerChart data={powerData} height={300} />
//
// ============================================================================

// ============================================================
// 1. IMPORTS
// ============================================================
'use client';  // Composant côté client (Recharts nécessite le DOM)

import {
  ResponsiveContainer,      // Conteneur responsive pour le graphique
  ComposedChart,            // Graphique combiné (Area + Line)
  Area,                     // Aire sous la courbe (puissance réelle)
  Line,                     // Ligne simple (puissance théorique)
  XAxis,                    // Axe horizontal (temps)
  YAxis,                    // Axe vertical (puissance)
  CartesianGrid,            // Grille de fond
  Tooltip,                  // Infobulle au survol
} from 'recharts';
import { Activity } from 'lucide-react';  // Icône pour l'état vide
import { C } from '@/lib/colors';        // Palette de couleurs globale
import CustomTooltip from './CustomTooltip';  // Tooltip personnalisé

// ============================================================
// 2. INTERFACE DES PROPS
// ============================================================

interface PowerChartProps {
  data: Array<{
    time: string;           // Étiquette temporelle (ex: "12:00", "2026-04-11")
    power: number;          // Puissance réelle mesurée (Watts)
    theoretical: number;    // Puissance théorique calculée (Watts)
  }>;
  height?: number;          // Hauteur du graphique (défaut: 220px)
}

// ============================================================
// 3. COMPOSANT PRINCIPAL
// ============================================================

/**
 * Graphique comparatif de la puissance réelle vs théorique.
 * 
 * 📥 PROPS:
 *   - data   : Tableau de points { time, power, theoretical }
 *   - height : Hauteur en pixels (défaut: 220)
 * 
 * 📤 RENDU:
 *   - Graphique avec aire verte (puissance réelle)
 *   - Ligne bleue pointillée (puissance théorique)
 *   - Axes, grille, tooltip personnalisé
 *   - Message si aucune donnée
 * 
 * 🎨 DÉGRADÉS:
 *   - gPow  : vert transparent vers transparent (sous la courbe réelle)
 *   - gTheo : bleu transparent vers transparent (sous la courbe théorique)
 * 
 * 📊 INTERPRÉTATION:
 *   L'écart entre les deux courbes = perte de puissance due à l'ensablement.
 *   Plus l'écart est grand, plus le panneau est sale.
 */
export default function PowerChart({ data, height = 220 }: PowerChartProps) {
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
  // RENDU PRINCIPAL : Graphique
  // ============================================================
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        
        {/* ==================================================== */}
        {/* DÉGRADÉS (pour remplissage sous les courbes) */}
        {/* ==================================================== */}
        <defs>
          {/* Dégradé vert pour la puissance réelle */}
          <linearGradient id="gPow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.green} stopOpacity={0.2} />
            <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
          </linearGradient>
          
          {/* Dégradé bleu pour la puissance théorique */}
          <linearGradient id="gTheo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.blue} stopOpacity={0.15} />
            <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
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
        {/* AXE Y (PUISSANCE) */}
        {/* ==================================================== */}
        <YAxis
          stroke={C.text3}
          tick={{ fontSize: 10, fill: C.text3 }}
          tickLine={false}
          axisLine={false}                // Pas de ligne d'axe verticale
          unit="W"                         // Affiche "W" après chaque valeur
          width={40}                       // Largeur réservée pour les ticks
        />

        {/* ==================================================== */}
        {/* TOOLTIP (INFOBULLE) */}
        {/* ==================================================== */}
        <Tooltip 
          content={<CustomTooltip />}      // Tooltip personnalisé
          cursor={{ stroke: C.border, strokeWidth: 1 }}  // Ligne verticale de suivi
        />

        {/* ==================================================== */}
        {/* COURBE 1 : PUISSANCE RÉELLE (AIRE VERTE) */}
        {/* ==================================================== */}
        <Area
          type="monotone"                 // Interpolation lissée
          dataKey="power"                 // Clé dans les données
          stroke={C.green}                // Couleur de la ligne
          strokeWidth={2.5}               // Épaisseur
          fill="url(#gPow)"               // Dégradé vert
          name="Puissance réelle"          // Nom affiché dans tooltip
          unit="W"                        // Unité affichée dans tooltip
          activeDot={{ r: 4, fill: C.green }}  // Point actif agrandi
        />

        {/* ==================================================== */}
        {/* COURBE 2 : PUISSANCE THÉORIQUE (LIGNE BLEUE POINTILLÉE) */}
        {/* ==================================================== */}
        <Line
          type="bump"
          dataKey="theoretical"
          stroke={C.red}                // Couleur de la ligne
          strokeWidth={2}
          strokeDasharray="5 5"           // Style pointillé
          name="Puissance théorique"
          unit="W"
          dot={false}                     // Pas de points sur la ligne
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}