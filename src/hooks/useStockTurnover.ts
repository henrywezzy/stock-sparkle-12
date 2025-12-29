import { useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useEntries } from '@/hooks/useEntries';
import { useExits } from '@/hooks/useExits';
import { subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

export interface StockTurnoverData {
  productId: string;
  productName: string;
  category: string | null;
  currentStock: number;
  totalEntries: number;
  totalExits: number;
  averageStock: number;
  turnoverRate: number;
  daysOfStock: number;
}

export interface MonthlyMovement {
  month: string;
  entries: number;
  exits: number;
}

export const useStockTurnover = (months: number = 6) => {
  const { products } = useProducts();
  const { entries } = useEntries();
  const { exits } = useExits();

  const turnoverData = useMemo(() => {
    const now = new Date();
    const startDate = subMonths(now, months);

    return products.map(product => {
      // Get entries and exits for this product in the period
      const productEntries = entries.filter(e => 
        e.product_id === product.id &&
        new Date(e.entry_date) >= startDate
      );
      
      const productExits = exits.filter(e => 
        e.product_id === product.id &&
        new Date(e.exit_date) >= startDate
      );

      const totalEntries = productEntries.reduce((sum, e) => sum + e.quantity, 0);
      const totalExits = productExits.reduce((sum, e) => sum + e.quantity, 0);

      // Calculate average stock (simplified: current stock + half of exits)
      const averageStock = Math.max(product.quantity + (totalExits / 2), 1);

      // Turnover rate = total exits / average stock
      const turnoverRate = averageStock > 0 ? totalExits / averageStock : 0;

      // Days of stock = average stock / (daily consumption)
      const dailyConsumption = totalExits / (months * 30);
      const daysOfStock = dailyConsumption > 0 ? Math.round(product.quantity / dailyConsumption) : 999;

      return {
        productId: product.id,
        productName: product.name,
        category: product.category_id,
        currentStock: product.quantity,
        totalEntries,
        totalExits,
        averageStock,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        daysOfStock: Math.min(daysOfStock, 999),
      };
    });
  }, [products, entries, exits, months]);

  // Get monthly movements
  const monthlyMovements = useMemo(() => {
    const now = new Date();
    const result: MonthlyMovement[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthEntries = entries.filter(e => 
        isWithinInterval(new Date(e.entry_date), { start: monthStart, end: monthEnd })
      );
      
      const monthExits = exits.filter(e => 
        isWithinInterval(new Date(e.exit_date), { start: monthStart, end: monthEnd })
      );

      result.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        entries: monthEntries.reduce((sum, e) => sum + e.quantity, 0),
        exits: monthExits.reduce((sum, e) => sum + e.quantity, 0),
      });
    }

    return result;
  }, [entries, exits, months]);

  // Summary statistics
  const summary = useMemo(() => {
    const highTurnover = turnoverData.filter(d => d.turnoverRate >= 2);
    const lowTurnover = turnoverData.filter(d => d.turnoverRate < 0.5 && d.currentStock > 0);
    const criticalStock = turnoverData.filter(d => d.daysOfStock < 30);

    const avgTurnover = turnoverData.length > 0
      ? turnoverData.reduce((sum, d) => sum + d.turnoverRate, 0) / turnoverData.length
      : 0;

    return {
      averageTurnoverRate: Math.round(avgTurnover * 100) / 100,
      highTurnoverCount: highTurnover.length,
      lowTurnoverCount: lowTurnover.length,
      criticalStockCount: criticalStock.length,
      totalProducts: turnoverData.length,
    };
  }, [turnoverData]);

  // Top movers (highest turnover)
  const topMovers = useMemo(() => {
    return [...turnoverData]
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 10);
  }, [turnoverData]);

  // Slow movers (lowest turnover with stock)
  const slowMovers = useMemo(() => {
    return [...turnoverData]
      .filter(d => d.currentStock > 0)
      .sort((a, b) => a.turnoverRate - b.turnoverRate)
      .slice(0, 10);
  }, [turnoverData]);

  return {
    turnoverData,
    monthlyMovements,
    summary,
    topMovers,
    slowMovers,
  };
};
