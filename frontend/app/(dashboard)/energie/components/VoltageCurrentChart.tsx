// ============================================================================
// FICHIER: VoltageCurrentChart.tsx
// ============================================================================
// 📌 RÔLE DE CE FICHIER:
//   Ce composant React affiche un graphique de la tension et du courant
//   électrique des panneaux solaires pour la page Énergie. Il montre deux courbes :
//   - Tension (en bleu, axe gauche)
//   - Courant (en vert, axe droit)
//
// 🎨 FONCTIONNALITÉS:
//   - Graphique LineChart (Recharts) avec deux lignes
//   - Double axe Y (gauche pour tension, droite pour courant)
//   - Axe X avec le temps (heures ou dates)
//   - Tooltip personnalisé pour afficher les valeurs détaillées
//   - Grille discrète pour faciliter la lecture
//   - Message "Données non disponibles" si pas de données
//
// 📦 PROPS (entrées):
//   - data   : tableau d'objets { time, volt, curr }
//   - height : hauteur du graphique (défaut: 200px)
//
// 🎨 COULEURS:
//   - C.blue  : bleu pour la tension (#1565c0)
//   - C.green : vert pour le courant (#1a7f4f)
//   - C.border: gris pour la grille et axes
//   - C.text3 : gris clair pour les ticks
//
// 📊 INTERPRÉTATION:
//   - Tension stable → fonctionnement normal
//   - Courant variable → dépend de l'ensoleillement
//   - Les deux courbes suivent généralement la même tendance
//
// 💡 UTILISATION:
//   <VoltageCurrentChart data={voltageCurrentData} height={250} />
//
// ============================================================================

'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Gauge } from 'lucide-react';
import { C } from '@/lib/colors';
import CustomTooltip from './CustomTooltip';
import EmptyState from './EmptyState';

interface VoltageCurrentChartProps {
  data: Array<{
    time: string;
    volt: number;
    curr: number;
  }>;
  height?: number;
}

export default function VoltageCurrentChart({ data, height = 200 }: VoltageCurrentChartProps) {
  const hasNoData = data.length === 0 || data.every(d => d.volt === 0 && d.curr === 0);

  if (hasNoData) {
    return (
      <EmptyState
        icon={Gauge}
        title="Données non disponibles"
        message="Données de tension / courant non disponibles pour cette période"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
        <XAxis
          dataKey="time"
          stroke={C.text3}
          tick={{ fontSize: 10 }}
          padding={{ left: 10, right: 10 }}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          yAxisId="left"
          stroke={C.blue}
          tick={{ fontSize: 10 }}
          unit="V"
          domain={[0, 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={C.green}
          tick={{ fontSize: 10 }}
          unit="A"
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="volt"
          stroke={C.blue}
          strokeWidth={2}
          dot={false}
          name="Tension"
          unit="V"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="curr"
          stroke={C.green}
          strokeWidth={2}
          dot={false}
          name="Courant"
          unit="A"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}