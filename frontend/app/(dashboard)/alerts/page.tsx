'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Bell, AlertCircle, Info, Clock, Filter, RefreshCw, Loader } from 'lucide-react';
import { C } from '@/lib/colors';

// Composants
import StatCard from './components/StatCard';
import FilterBar from './components/FilterBar';
import AlertTabs from './components/AlertTabs';
import ActiveAlertsList from './components/ActiveAlertsList';
import HistoryAlertsList from './components/HistoryAlertsList';
import StatsTab from './components/StatsTab';

// Hooks et utils
import { useAlertsPage } from './hooks/useAlertsPage';
import type { Alert } from '@/lib/api';

export default function AlertsPage() {
  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'stats'>('active');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    activeAlerts,
    resolvedAlerts,
    loading,
    unacknowledgedCount,
    criticalCount,
    warningAlerts,
    infoAlerts,
    alertsByType,
    alertsByDevice,
    averageResponseTime,
    deviceList,
    refreshAlerts,
    handleAcknowledge,
    handleResolve,
    acknowledgeAll,
    resolveAll,
  } = useAlertsPage(activeTab);

  // ==========================================================
  // DONNÉES FILTRÉES
  // ==========================================================
  
  const filteredActiveAlerts = useMemo(() => {
    let result = activeAlerts;
    
    if (filterSeverity !== 'all') {
      result = result.filter((a: Alert) => a.severity === filterSeverity);
    }
    
    if (filterDevice !== 'all') {
      result = result.filter((a: Alert) => a.device_id === filterDevice);
    }
    
    return result;
  }, [activeAlerts, filterSeverity, filterDevice]);

  const filteredHistoryAlerts = useMemo(() => {
    let result = resolvedAlerts;
    
    if (filterSeverity !== 'all') {
      result = result.filter((a: Alert) => a.severity === filterSeverity);
    }
    
    if (filterDevice !== 'all') {
      result = result.filter((a: Alert) => a.device_id === filterDevice);
    }
    
    return result;
  }, [resolvedAlerts, filterSeverity, filterDevice]);

  // ==========================================================
  // GESTIONNAIRES
  // ==========================================================
  const handleResetFilters = () => {
    setFilterSeverity('all');
    setFilterDevice('all');
  };

  // ==========================================================
  // RENDU DU COMPOSANT
  // ==========================================================
  return (
    <div>
      {/* ==================================================== */}
      {/* EN-TÊTE */}
      {/* ==================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={24} color={C.amber} />
          Gestion des alertes
          {unacknowledgedCount > 0 && (
            <span style={{
              background: C.red,
              color: 'white',
              padding: '2px 10px',
              borderRadius: 99,
              fontSize: 12,
            }}>
              {unacknowledgedCount} non lues
            </span>
          )}
        </h1>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: showFilters ? C.green : C.surface,
              color: showFilters ? 'white' : C.text2,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Filter size={14} />
            Filtres
            {(filterSeverity !== 'all' || filterDevice !== 'all') && (
              <span style={{
                background: C.green,
                color: 'white',
                width: 18,
                height: 18,
                borderRadius: 99,
                fontSize: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {(filterSeverity !== 'all' ? 1 : 0) + (filterDevice !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          
          {/* Rafraîchir */}
          <button
            onClick={refreshAlerts}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
            Rafraîchir
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* FILTRES */}
      {/* ==================================================== */}
      <FilterBar
        showFilters={showFilters}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        filterDevice={filterDevice}
        setFilterDevice={setFilterDevice}
        deviceList={deviceList}
        onReset={handleResetFilters}
      />

      {/* ==================================================== */}
      {/* STATISTIQUES RAPIDES (5 cartes) */}
      {/* ==================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard icon={Bell} label="Alertes actives" value={activeAlerts.length} color={C.text} bgColor={C.surface} />
        <StatCard icon={AlertTriangle} label="Critiques" value={criticalCount} color={C.red} bgColor={C.redL} />
        <StatCard icon={AlertCircle} label="Warnings" value={warningAlerts.length} color={C.amber} bgColor={C.amberL} />
        <StatCard icon={Info} label="Informations" value={infoAlerts.length} color={C.blue} bgColor={C.blueL} />
        <StatCard icon={Clock} label="Temps réponse" value={`${averageResponseTime} min`} color={C.purple} bgColor={C.surface2} />
      </div>

      {/* ==================================================== */}
      {/* ONGLETS */}
      {/* ==================================================== */}
      <AlertTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCount={activeAlerts.length}
        historyCount={resolvedAlerts.length}
        showActions={activeTab === 'active'}
        onAcknowledgeAll={acknowledgeAll}
        onResolveAll={resolveAll}
      />

      {/* ==================================================== */}
      {/* CONTENU DES ONGLETS */}
      {/* ==================================================== */}

      {/* ONGLET ACTIVES */}
      {activeTab === 'active' && (
        <ActiveAlertsList
          alerts={filteredActiveAlerts}
          loading={loading}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      )}

      {/* ONGLET HISTORIQUE */}
      {activeTab === 'history' && (
        <HistoryAlertsList
          alerts={filteredHistoryAlerts}
          loading={loading}
        />
      )}

      {/* ONGLET STATISTIQUES */}
      {activeTab === 'stats' && (
        <StatsTab
          alertsByType={alertsByType}
          alertsByDevice={alertsByDevice}
          resolvedAlertsCount={resolvedAlerts.length}
          totalAlertsCount={activeAlerts.length + resolvedAlerts.length}
          averageResponseTime={averageResponseTime}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}