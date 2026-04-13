// hooks/useAlertsPage.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { useDevice } from '@/contexts/DeviceContext';

export function useAlertsPage(activeTab: 'active' | 'history' | 'stats') {
  const { selectedDevice } = useDevice();
  
  const {
    alerts,
    activeAlerts: rawActiveAlerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    resolvedAlerts,
    loading,
    unacknowledgedCount,
    criticalCount,
    alertsByType,
    alertsByDevice,
    averageResponseTime,
    refreshAlerts,
    markAsAcknowledged,
    markAsResolved,
    acknowledgeAll,
    resolveAll,
  } = useAlerts(selectedDevice || undefined, true, activeTab === 'history');

  // Liste unique des devices pour le filtre
  const deviceList = useMemo(() => {
    const devices = new Set<string>();
    alerts.forEach(a => devices.add(a.device_id));
    return Array.from(devices).sort();
  }, [alerts]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refreshAlerts, 30000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  const handleAcknowledge = useCallback(async (alertId: string) => {
    await markAsAcknowledged(alertId);
  }, [markAsAcknowledged]);

  const handleResolve = useCallback(async (alertId: string) => {
    const notes = prompt('Notes de résolution (optionnel):');
    await markAsResolved(alertId, notes || undefined);
  }, [markAsResolved]);

  return {
    alerts,
    activeAlerts: rawActiveAlerts,
    resolvedAlerts,
    loading,
    unacknowledgedCount,
    criticalCount,
    criticalAlerts,
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
  };
}