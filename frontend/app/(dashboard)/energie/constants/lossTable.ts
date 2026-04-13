// app/(dashboard)/energie/constants/lossTable.ts
import { CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { C } from '@/lib/colors';

export const LOSS_TABLE = [
  { level: '0%',   label: 'Propre',   loss: 0,  remaining: 400, action: 'Aucune action',      color: C.green,  icon: CheckCircle },
  { level: '25%',  label: 'Léger',    loss: 15, remaining: 340, action: 'Surveiller',          color: C.greenM, icon: Info },
  { level: '50%',  label: 'Moyen',    loss: 35, remaining: 260, action: 'Planifier nettoyage', color: C.amber,  icon: AlertTriangle },
  { level: '75%',  label: 'Fort',     loss: 60, remaining: 160, action: 'Nettoyage urgent',    color: '#ef6c00', icon: AlertTriangle },
  { level: '100%', label: 'Complet',  loss: 80, remaining: 80,  action: 'Immédiat',            color: C.red,    icon: AlertCircle },
];