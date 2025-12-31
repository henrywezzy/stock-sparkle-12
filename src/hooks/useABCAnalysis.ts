import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useExits } from "@/hooks/useExits";
import { subDays } from "date-fns";

export interface ABCItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  totalValue: number;
  totalExits: number;
  percentageValue: number;
  cumulativePercentage: number;
  classification: "A" | "B" | "C";
  color: string;
}

export interface ABCAnalysis {
  items: ABCItem[];
  summary: {
    classA: { count: number; valuePercentage: number; items: ABCItem[] };
    classB: { count: number; valuePercentage: number; items: ABCItem[] };
    classC: { count: number; valuePercentage: number; items: ABCItem[] };
  };
  isLoading: boolean;
}

export function useABCAnalysis(days: number = 90): ABCAnalysis {
  const { products, isLoading: loadingProducts } = useProducts();
  const { exits, isLoading: loadingExits } = useExits();

  const analysis = useMemo(() => {
    if (loadingProducts || loadingExits) {
      return {
        items: [],
        summary: {
          classA: { count: 0, valuePercentage: 0, items: [] },
          classB: { count: 0, valuePercentage: 0, items: [] },
          classC: { count: 0, valuePercentage: 0, items: [] },
        },
      };
    }

    const cutoffDate = subDays(new Date(), days);

    // Calcular valor total de saídas por produto
    const productStats: Map<string, { exits: number; value: number }> = new Map();

    exits
      .filter((e) => new Date(e.exit_date) >= cutoffDate)
      .forEach((exit) => {
        const product = products.find((p) => p.id === exit.product_id);
        if (!product) return;

        const current = productStats.get(exit.product_id) || { exits: 0, value: 0 };
        current.exits += exit.quantity;
        current.value += exit.quantity * (product.price || 0);
        productStats.set(exit.product_id, current);
      });

    // Calcular valor total
    let totalValue = 0;
    productStats.forEach((stats) => {
      totalValue += stats.value;
    });

    // Criar lista ordenada por valor
    const sortedProducts = products
      .map((product) => {
        const stats = productStats.get(product.id) || { exits: 0, value: 0 };
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.categories?.name || null,
          quantity: product.quantity,
          totalValue: stats.value,
          totalExits: stats.exits,
          percentageValue: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
          cumulativePercentage: 0,
          classification: "C" as "A" | "B" | "C",
          color: "",
        };
      })
      .filter((p) => p.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    // Calcular percentual acumulado e classificação
    let cumulative = 0;
    const classifiedProducts = sortedProducts.map((product) => {
      cumulative += product.percentageValue;
      let classification: "A" | "B" | "C" = "C";
      let color = "hsl(142, 76%, 36%)"; // Verde para C

      if (cumulative <= 80) {
        classification = "A";
        color = "hsl(0, 84%, 60%)"; // Vermelho para A (alta importância)
      } else if (cumulative <= 95) {
        classification = "B";
        color = "hsl(38, 92%, 50%)"; // Amarelo para B
      }

      return {
        ...product,
        cumulativePercentage: cumulative,
        classification,
        color,
      };
    });

    // Resumo por classe
    const classA = classifiedProducts.filter((p) => p.classification === "A");
    const classB = classifiedProducts.filter((p) => p.classification === "B");
    const classC = classifiedProducts.filter((p) => p.classification === "C");

    return {
      items: classifiedProducts,
      summary: {
        classA: {
          count: classA.length,
          valuePercentage: classA.reduce((sum, p) => sum + p.percentageValue, 0),
          items: classA,
        },
        classB: {
          count: classB.length,
          valuePercentage: classB.reduce((sum, p) => sum + p.percentageValue, 0),
          items: classB,
        },
        classC: {
          count: classC.length,
          valuePercentage: classC.reduce((sum, p) => sum + p.percentageValue, 0),
          items: classC,
        },
      },
    };
  }, [products, exits, days, loadingProducts, loadingExits]);

  return {
    ...analysis,
    isLoading: loadingProducts || loadingExits,
  };
}
