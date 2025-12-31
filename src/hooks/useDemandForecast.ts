import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useExits } from "@/hooks/useExits";
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DemandForecastItem {
  id: string;
  name: string;
  sku: string | null;
  currentStock: number;
  avgDailyConsumption: number;
  avgWeeklyConsumption: number;
  avgMonthlyConsumption: number;
  daysUntilStockout: number | null;
  forecastedDemand7Days: number;
  forecastedDemand30Days: number;
  forecastedDemand90Days: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  consumptionHistory: { period: string; quantity: number }[];
}

export interface DemandForecastSummary {
  totalProductsAtRisk: number;
  averageStockoutDays: number;
  totalForecastedDemand30Days: number;
}

export function useDemandForecast(historyDays: number = 90) {
  const { products, isLoading: loadingProducts } = useProducts();
  const { exits, isLoading: loadingExits } = useExits();

  const forecast = useMemo(() => {
    if (loadingProducts || loadingExits) {
      return { items: [], summary: { totalProductsAtRisk: 0, averageStockoutDays: 0, totalForecastedDemand30Days: 0 } };
    }

    const cutoffDate = subDays(new Date(), historyDays);
    const recentCutoff = subDays(new Date(), 30);

    const items: DemandForecastItem[] = products.map((product) => {
      // Filtrar saídas do produto no período
      const productExits = exits.filter(
        (e) => e.product_id === product.id && new Date(e.exit_date) >= cutoffDate
      );

      const recentExits = productExits.filter((e) => new Date(e.exit_date) >= recentCutoff);
      const olderExits = productExits.filter((e) => new Date(e.exit_date) < recentCutoff);

      // Calcular consumo total
      const totalConsumption = productExits.reduce((sum, e) => sum + e.quantity, 0);
      const recentConsumption = recentExits.reduce((sum, e) => sum + e.quantity, 0);
      const olderConsumption = olderExits.reduce((sum, e) => sum + e.quantity, 0);

      // Calcular médias
      const daysInPeriod = Math.max(differenceInDays(new Date(), cutoffDate), 1);
      const avgDailyConsumption = totalConsumption / daysInPeriod;
      const avgWeeklyConsumption = avgDailyConsumption * 7;
      const avgMonthlyConsumption = avgDailyConsumption * 30;

      // Calcular tendência (comparar últimos 30 dias com os 60 anteriores)
      const recentDays = Math.min(30, historyDays);
      const olderDays = historyDays - recentDays;
      const recentAvg = recentDays > 0 ? recentConsumption / recentDays : 0;
      const olderAvg = olderDays > 0 ? olderConsumption / olderDays : 0;

      let trend: "up" | "down" | "stable" = "stable";
      let trendPercentage = 0;

      if (olderAvg > 0) {
        trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (trendPercentage > 10) trend = "up";
        else if (trendPercentage < -10) trend = "down";
      }

      // Dias até ruptura
      const daysUntilStockout = avgDailyConsumption > 0 
        ? Math.floor(product.quantity / avgDailyConsumption) 
        : null;

      // Previsões
      const forecastedDemand7Days = Math.ceil(avgDailyConsumption * 7);
      const forecastedDemand30Days = Math.ceil(avgDailyConsumption * 30);
      const forecastedDemand90Days = Math.ceil(avgDailyConsumption * 90);

      // Ponto de reposição (estoque mínimo + lead time de 7 dias)
      const leadTimeDays = 7;
      const reorderPoint = Math.ceil(avgDailyConsumption * leadTimeDays) + (product.min_quantity || 10);

      // Quantidade sugerida para pedido
      const suggestedOrderQty = Math.max(
        0,
        (product.max_quantity || 100) - product.quantity
      );

      // Histórico de consumo por semana (últimas 12 semanas)
      const consumptionHistory: { period: string; quantity: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(new Date(), i * 7), { locale: ptBR });
        const weekEnd = endOfWeek(subDays(new Date(), i * 7), { locale: ptBR });
        
        const weekConsumption = productExits
          .filter((e) => isWithinInterval(new Date(e.exit_date), { start: weekStart, end: weekEnd }))
          .reduce((sum, e) => sum + e.quantity, 0);

        consumptionHistory.push({
          period: format(weekStart, "dd/MM", { locale: ptBR }),
          quantity: weekConsumption,
        });
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.quantity,
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
        avgWeeklyConsumption: Math.round(avgWeeklyConsumption * 100) / 100,
        avgMonthlyConsumption: Math.round(avgMonthlyConsumption * 100) / 100,
        daysUntilStockout,
        forecastedDemand7Days,
        forecastedDemand30Days,
        forecastedDemand90Days,
        reorderPoint,
        suggestedOrderQty,
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        consumptionHistory,
      };
    });

    // Filtrar apenas produtos com consumo
    const activeItems = items.filter((i) => i.avgDailyConsumption > 0);

    // Resumo
    const productsAtRisk = activeItems.filter(
      (i) => i.daysUntilStockout !== null && i.daysUntilStockout <= 14
    );
    const avgStockoutDays = productsAtRisk.length > 0
      ? productsAtRisk.reduce((sum, i) => sum + (i.daysUntilStockout || 0), 0) / productsAtRisk.length
      : 0;

    return {
      items: activeItems.sort((a, b) => (a.daysUntilStockout || 999) - (b.daysUntilStockout || 999)),
      summary: {
        totalProductsAtRisk: productsAtRisk.length,
        averageStockoutDays: Math.round(avgStockoutDays),
        totalForecastedDemand30Days: activeItems.reduce((sum, i) => sum + i.forecastedDemand30Days, 0),
      },
    };
  }, [products, exits, historyDays, loadingProducts, loadingExits]);

  return {
    ...forecast,
    isLoading: loadingProducts || loadingExits,
  };
}
