import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useEntries } from './useEntries';
import { useExits } from './useExits';
import { subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface StockIndicator {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  avgDailyConsumption: number;
  daysUntilStockout: number | null;
  turnoverRate: number;
  status: 'critical' | 'warning' | 'ok' | 'excess';
  reorderSuggestion: number;
}

export const useStockIndicators = (periodDays: number = 30) => {
  const { products } = useProducts();
  const { exits } = useExits();
  const { entries } = useEntries();

  const indicators = useMemo(() => {
    const now = new Date();
    const periodStart = subDays(now, periodDays);

    return products.map((product) => {
      // Calcular consumo do período
      const periodExits = exits.filter(
        (e) =>
          e.product_id === product.id &&
          isWithinInterval(new Date(e.exit_date), {
            start: startOfDay(periodStart),
            end: endOfDay(now),
          })
      );

      const periodEntries = entries.filter(
        (e) =>
          e.product_id === product.id &&
          isWithinInterval(new Date(e.entry_date), {
            start: startOfDay(periodStart),
            end: endOfDay(now),
          })
      );

      const totalConsumed = periodExits.reduce((acc, e) => acc + e.quantity, 0);
      const totalReceived = periodEntries.reduce((acc, e) => acc + e.quantity, 0);
      const avgDailyConsumption = totalConsumed / periodDays;

      // Dias até ruptura
      const daysUntilStockout =
        avgDailyConsumption > 0
          ? Math.floor(product.quantity / avgDailyConsumption)
          : null;

      // Giro de estoque (consumo / estoque médio)
      const avgStock = product.quantity > 0 ? product.quantity : 1;
      const turnoverRate = totalConsumed / avgStock;

      // Status
      let status: StockIndicator['status'] = 'ok';
      const minStock = product.min_quantity || 10;
      const maxStock = product.max_quantity || 1000;

      if (product.quantity === 0) {
        status = 'critical';
      } else if (product.quantity <= minStock) {
        status = 'warning';
      } else if (product.quantity >= maxStock) {
        status = 'excess';
      }

      // Sugestão de pedido (estoque de segurança + consumo médio de 30 dias)
      const safetyStock = avgDailyConsumption * 15; // 15 dias de segurança
      const reorderPoint = minStock + safetyStock;
      const reorderSuggestion =
        product.quantity < reorderPoint
          ? Math.ceil(avgDailyConsumption * 30 + safetyStock - product.quantity)
          : 0;

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity,
        minStock,
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
        daysUntilStockout,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        status,
        reorderSuggestion: Math.max(0, reorderSuggestion),
      } as StockIndicator;
    });
  }, [products, exits, entries, periodDays]);

  // Resumo geral
  const summary = useMemo(() => {
    const critical = indicators.filter((i) => i.status === 'critical').length;
    const warning = indicators.filter((i) => i.status === 'warning').length;
    const ok = indicators.filter((i) => i.status === 'ok').length;
    const excess = indicators.filter((i) => i.status === 'excess').length;

    const avgTurnover =
      indicators.length > 0
        ? indicators.reduce((acc, i) => acc + i.turnoverRate, 0) / indicators.length
        : 0;

    const productsNeedingReorder = indicators.filter(
      (i) => i.reorderSuggestion > 0
    );

    const productsRunningLow = indicators
      .filter((i) => i.daysUntilStockout !== null && i.daysUntilStockout <= 7)
      .sort((a, b) => (a.daysUntilStockout || 0) - (b.daysUntilStockout || 0));

    return {
      critical,
      warning,
      ok,
      excess,
      avgTurnover: Math.round(avgTurnover * 100) / 100,
      productsNeedingReorder,
      productsRunningLow,
    };
  }, [indicators]);

  return {
    indicators,
    summary,
  };
};
