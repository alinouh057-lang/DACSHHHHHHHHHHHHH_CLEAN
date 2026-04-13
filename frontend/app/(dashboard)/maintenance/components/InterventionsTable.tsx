// components/InterventionsTable.tsx
'use client';
import { CalendarIcon, Droplets, Wrench, Eye, Activity, User, TrendingDown, Edit, Trash2, Download, Loader, FileText } from 'lucide-react';
import { C } from '@/lib/colors';
import type { Intervention } from '@/lib/api';
import ExportButton from './ExportButton';

interface InterventionsTableProps {
  interventions: Intervention[];
  loading: boolean;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  onEdit: (intervention: Intervention) => void;
  onDelete: (id: string) => void;
  totalCost: number;
}

export default function InterventionsTable({
  interventions,
  loading,
  filterStatus,
  onFilterChange,
  onEdit,
  onDelete,
  totalCost,
}: InterventionsTableProps) {
  return (
    <div style={{ 
      marginTop: 20,
      background: C.surface, 
      border: `1px solid ${C.border}`, 
      borderRadius: 14, 
      padding: 20,
      boxShadow: '0 1px 3px rgba(13,82,52,.06)'
    }}>
      {/* En-tête du tableau avec filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.purple }} />
          <FileText size={14} /> HISTORIQUE DES INTERVENTIONS
          {loading && <Loader size={14} className="spin" />}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Filtre par statut */}
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.surface2,
              color: C.text,
              fontSize: 11,
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>

          <ExportButton interventions={interventions} />
        </div>
      </div>

      {/* Tableau responsive */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Dispositif', 'Technicien', 'Coût', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '9px 13px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.text3,
                  textTransform: 'uppercase',
                  letterSpacing: .7,
                  borderBottom: `1px solid ${C.border}`,
                  textAlign: 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interventions.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: C.text3 }}>
                {loading ? 'Chargement...' : 'Aucune intervention'}
              </td></tr>
            ) : (
              interventions.map((inv, i) => {
                const statusColor = {
                  planned: C.amber,
                  in_progress: C.blue,
                  completed: C.green,
                  cancelled: C.red
                }[inv.status];
                
                const typeIcon = {
                  cleaning: <Droplets size={12} />,
                  repair: <Wrench size={12} />,
                  inspection: <Eye size={12} />,
                  other: <Activity size={12} />
                }[inv.type];

                return (
                  <tr key={inv.id} style={{ background: i % 2 === 0 ? C.surface2 : C.surface }}>
                    <td style={{ padding: '9px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon size={12} />
                        {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td style={{ padding: '9px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {typeIcon}
                        {inv.type === 'cleaning' && 'Nettoyage'}
                        {inv.type === 'repair' && 'Réparation'}
                        {inv.type === 'inspection' && 'Inspection'}
                        {inv.type === 'other' && 'Autre'}
                      </div>
                    </td>
                    <td style={{ padding: '9px 13px', fontFamily: 'monospace' }}>{inv.device_id}</td>
                    <td style={{ padding: '9px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} />
                        {inv.technician}
                      </div>
                    </td>
                    <td style={{ padding: '9px 13px' }}>{inv.cost} DT</td>
                    <td style={{ padding: '9px 13px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 600,
                        background: `${statusColor}18`,
                        color: statusColor,
                      }}>
                        {inv.status === 'planned' && 'Planifiée'}
                        {inv.status === 'in_progress' && 'En cours'}
                        {inv.status === 'completed' && 'Terminée'}
                        {inv.status === 'cancelled' && 'Annulée'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 13px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => onEdit(inv)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blue }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(inv.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Résumé des coûts */}
      <div style={{
        marginTop: 16,
        padding: 12,
        background: C.surface2,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: C.text2 }}>Coût total des interventions terminées</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{totalCost.toFixed(2)} DT</span>
      </div>
    </div>
  );
}