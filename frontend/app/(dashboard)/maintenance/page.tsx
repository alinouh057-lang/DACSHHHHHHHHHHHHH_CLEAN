// app/(dashboard)/maintenance/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus } from 'lucide-react';
import { C } from '@/lib/colors';
import { useRefresh } from '@/contexts/RefreshContext';
import { useDashboardReset } from '@/contexts/DashboardContext';
import CacheMonitor from '@/components/CacheMonitor';

// Composants
import RecommendationBanner from './components/RecommendationBanner';
import KPICards from './components/KPICards';
import AlertCounters from './components/AlertCounters';
import AlertsList from './components/AlertsList';
import QuickImageAnalysis from './components/QuickImageAnalysis';
import InterventionsTable from './components/InterventionsTable';
import InterventionModal, { type InterventionFormData } from './components/InterventionModal';

// Hooks et utils
import { useMaintenanceData } from './hooks/useMaintenanceData';
import { calculateAlertCounts, calculateMaintenanceStats, getAlerts } from './utils/maintenanceUtils';

// API
import { createIntervention, updateIntervention, deleteIntervention, type Intervention } from '@/lib/api';

// Valeur par défaut du formulaire
const defaultFormData: InterventionFormData = {
  date: new Date().toISOString().split('T')[0],
  type: 'cleaning',
  device_id: '',
  technician: '',
  notes: '',
  cost: 0,
  status: 'planned'
};

export default function MaintenancePage() {
  const { autoRefresh, setLastUpdate, refreshKey } = useRefresh();
  const { isReset, clearResetFlag } = useDashboardReset();
  
  // États
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [formData, setFormData] = useState<InterventionFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  
  // Hook principal
  const { historyData, rec, interventions, loadingInterventions, refreshInterventions } = 
    useMaintenanceData(autoRefresh, refreshKey, setLastUpdate);
  
  // Reset
  useEffect(() => {
    if (isReset) {
      clearResetFlag();
    }
  }, [isReset, clearResetFlag]);
  
  // Recharge quand le filtre change
  useEffect(() => {
    refreshInterventions(filterStatus);
  }, [filterStatus, refreshInterventions]);
  
  // Données calculées
  const { critical, warning, clean } = calculateAlertCounts(historyData);
  const alerts = getAlerts(historyData);
  const { totalCost, avgImprovement } = calculateMaintenanceStats(interventions);
  
  const completedCount = interventions.filter(i => i.status === 'completed').length;
  const plannedCount = interventions.filter(i => i.status === 'planned').length;
  
  // Gestionnaires
  const handleAddIntervention = () => {
    setSelectedIntervention(null);
    setFormData(defaultFormData);
    setShowAddModal(true);
  };
  
  const handleEditIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setFormData({
      date: intervention.date,
      type: intervention.type,
      device_id: intervention.device_id,
      technician: intervention.technician,
      notes: intervention.notes,
      cost: intervention.cost,
      status: intervention.status
    });
    setShowAddModal(true);
  };
  
  const handleDeleteIntervention = async (id: string) => {
    if (confirm('Supprimer cette intervention ?')) {
      const success = await deleteIntervention(id);
      if (success) {
        refreshInterventions(filterStatus);
      }
    }
  };
  
  const handleSaveIntervention = async () => {
    setSaving(true);
    try {
      if (selectedIntervention) {
        await updateIntervention(selectedIntervention.id, formData);
      } else {
        await createIntervention(formData);
      }
      setShowAddModal(false);
      refreshInterventions(filterStatus);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };
  
  return (
    <div>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench size={24} color={C.blue} />
          Maintenance & Interventions
        </h1>
      </div>
      
      {/* Bannière recommandation */}
      <RecommendationBanner rec={rec} onPlanifier={handleAddIntervention} />
      
      {/* Cache Monitor */}
      <div style={{ marginBottom: 20 }}>
        <CacheMonitor />
      </div>
      
      {/* KPIs Maintenance */}
      <KPICards
        totalInterventions={interventions.length}
        completedCount={completedCount}
        plannedCount={plannedCount}
        avgImprovement={avgImprovement}
        loading={loadingInterventions}
      />
      
      {/* Compteurs d'alertes */}
      <AlertCounters critical={critical} warning={warning} clean={clean} />
      
      {/* Section 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Colonne gauche : Alertes récentes */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(13,82,52,.06)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.red }} />
            MESURES NÉCESSITANT ATTENTION ({alerts.length})
          </div>
          <AlertsList alerts={alerts} onPlanifier={handleAddIntervention} />
        </div>
        
        {/* Colonne droite : Analyse rapide d'image */}
        <QuickImageAnalysis />
      </div>
      
      {/* Tableau des interventions */}
      <InterventionsTable
        interventions={interventions}
        loading={loadingInterventions}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        onEdit={handleEditIntervention}
        onDelete={handleDeleteIntervention}
        totalCost={totalCost}
      />
      
      {/* Modal d'ajout/édition */}
      <InterventionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveIntervention}
        formData={formData}
        onFormChange={handleInputChange}
        selectedIntervention={selectedIntervention}
        loading={saving}
      />
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        .fade-up { animation: fadeUp 0.3s ease-out; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}