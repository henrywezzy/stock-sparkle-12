import { useState, useCallback } from 'react';

export interface InventoryDivergentItem {
  id: string;
  name: string;
  category: string;
  location?: string;
  systemQty: number;
  physicalQty: number;
  difference: number;
}

export interface InventoryReport {
  id: string;
  date: string;
  type: 'complete' | 'category';
  categoryName?: string;
  responsible: string;
  totalItems: number;
  countedItems: number;
  divergences: number;
  adjustments: number;
  status: 'completed' | 'cancelled';
  divergentItems?: InventoryDivergentItem[];
}

// Armazena os relatórios de inventário em memória (localStorage para persistência)
const STORAGE_KEY = 'inventory-reports';

const loadReports = (): InventoryReport[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveReports = (reports: InventoryReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const useInventoryReports = () => {
  const [reports, setReports] = useState<InventoryReport[]>(loadReports);

  const addReport = useCallback((report: Omit<InventoryReport, 'id'>) => {
    const newReport: InventoryReport = {
      ...report,
      id: crypto.randomUUID(),
    };
    
    const updatedReports = [newReport, ...reports].slice(0, 50); // Mantém últimos 50
    setReports(updatedReports);
    saveReports(updatedReports);
    
    return newReport;
  }, [reports]);

  const getRecentReports = useCallback((limit = 10) => {
    return reports.slice(0, limit);
  }, [reports]);

  const getReportStats = useCallback(() => {
    const completed = reports.filter(r => r.status === 'completed');
    const totalAdjustments = completed.reduce((sum, r) => sum + r.adjustments, 0);
    const totalDivergences = completed.reduce((sum, r) => sum + r.divergences, 0);
    const avgDivergenceRate = completed.length > 0 
      ? (completed.reduce((sum, r) => sum + (r.divergences / r.totalItems) * 100, 0) / completed.length)
      : 0;

    return {
      totalReports: reports.length,
      completedReports: completed.length,
      cancelledReports: reports.filter(r => r.status === 'cancelled').length,
      totalAdjustments,
      totalDivergences,
      avgDivergenceRate: avgDivergenceRate.toFixed(1),
    };
  }, [reports]);

  return {
    reports,
    addReport,
    getRecentReports,
    getReportStats,
  };
};
