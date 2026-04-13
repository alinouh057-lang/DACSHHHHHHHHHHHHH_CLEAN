// ============================================================================
// FICHIER: PowerChart.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un graphique comparatif de la puissance
//   électrique des panneaux solaires pour la page Énergie. Il montre trois courbes :
//   - Puissance réelle mesurée (ligne verte)
//   - Puissance théorique calculée (ligne bleue)
//   - Perte due à l'ensablement (aire orange)
//   L'écart entre les deux représente la perte due à l'ensablement.
//
// 🎨 FONCTIONNALITÉS:
//   - Graphique ComposedChart (Recharts) avec aire + lignes
//   - Trois séries de données (réelle, théorique, perte)
//   - Légende personnalisée avec LegendDot
//   - Axe X avec le temps (heures ou dates)
//   - Axe Y avec unité "W"
//   - Tooltip personnalisé pour afficher les valeurs détaillées
//   - Grille discrète pour faciliter la lecture
//   - Message "Aucune donnée disponible" si pas de données
//   - État de chargement optionnel
//
// 📦 PROPS (entrées):
//   - data   : tableau d'objets { time, power, pth, loss }
//   - loading: booléen - true pendant le chargement des données
//   - height : hauteur du graphique (défaut: 280px)
//
// 🎨 COULEURS:
//   - C.green : vert pour la puissance réelle (#1a7f4f)
//   - C.blue  : bleu pour la puissance théorique (#1565c0)
//   - C.amber : orange pour la perte (#c47d0e)
//   - C.border: gris pour la grille et axes
//   - C.text3 : gris clair pour les ticks
//
// 📊 INTERPRÉTATION:
//   - Écart important → ensablement élevé (nettoyage recommandé)
//   - Courbes proches → panneau propre
//   - Puissance théorique > réelle = perte normale due à l'ensablement
//
// 💡 UTILISATION:
//   <PowerChart data={powerData} loading={false} height={300} />
//
// ============================================================================

'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Zap } from 'lucide-react';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';
import LegendDot from './LegendDot';
import EmptyState from './EmptyState';

interface PowerChartProps {
  data: Array<{
    time: string;
    power: number;
    pth: number;
    loss: number;
  }>;
  loading?: boolean;
  height?: number;
}

export default function PowerChart({ data, loading = false, height = 280 }: PowerChartProps) {
  const hasNoData = data.length === 0 || data.every(d => d.power === 0 && d.pth === 0);

  if (hasNoData) {
    return (
      <EmptyState
        icon={Zap}
        title="Aucune donnée disponible"
        message={loading ? 'Chargement en cours…' : 'Aucune mesure dans la période sélectionnée'}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis
          dataKey="time"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          tickMargin={8}
        />
        <YAxis
          yAxisId="left"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          unit="W"
          domain={[0, 'auto']}
          tickMargin={8}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          content={() => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <LegendDot color={C.green} label="Réelle" />
              <LegendDot color={C.blue} label="Théorique" dashed />
              <LegendDot color={C.amber} label="Perte" />
            </div>
          )}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="loss"
          fill={C.amber}
          fillOpacity={0.3}
          stroke={C.amber}
          strokeWidth={1}
          name="Perte"
          unit="W"
          isAnimationActive={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="power"
          stroke={C.green}
          strokeWidth={2.5}
          dot={false}
          name="Puissance réelle"
          unit="W"
          isAnimationActive={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pth"
          stroke={C.blue}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Puissance théorique"
          unit="W"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}