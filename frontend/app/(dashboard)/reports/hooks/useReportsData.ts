// frontend/app/(dashboard)/reports/hooks/useReportsData.ts
import { useState, useEffect } from 'react';
import { fetchAllHistory, fetchStats, type Measurement, type Stats } from '@/lib/api';

export function useReportsData() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // ✅ fetchAllHistory retourne directement Measurement[]
            // D'après api.ts ligne 340-356, fetchAllHistory retourne un tableau
            const historyData = await fetchAllHistory();
            const statsData = await fetchStats();
            
            if (historyData && Array.isArray(historyData)) {
                setHistory(historyData);
                console.log(`✅ ${historyData.length} mesures chargées pour les rapports`);
            } else {
                setHistory([]);
            }
            
            if (statsData) {
                setStats(statsData);
            }
        } catch (error) {
            console.error('❌ Erreur chargement rapports:', error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return {
        stats,
        history,
        loading,
        refresh: loadData,
    };
}