import { TrendingUp, TrendingDown, RotateCcw, Building2, Star, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStockTurnover } from "@/hooks/useStockTurnover";
import { useSupplierPerformance } from "@/hooks/useSupplierPerformance";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export function StockTurnoverCard() {
  const { summary, topMovers, slowMovers, monthlyMovements } = useStockTurnover(6);

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-primary" />
        Giro de Estoque
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-2xl font-bold">{summary.averageTurnoverRate}</p>
          <p className="text-xs text-muted-foreground">Giro médio</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-2xl font-bold text-warning">{summary.criticalStockCount}</p>
          <p className="text-xs text-muted-foreground">Estoque crítico</p>
        </div>
      </div>

      {/* Movement Chart */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Movimentação mensal</p>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={monthlyMovements}>
            <defs>
              <linearGradient id="colorTurnoverEntries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTurnoverExits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={30} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="exits"
              name="Saídas"
              stroke="hsl(199, 89%, 48%)"
              fillOpacity={1}
              fill="url(#colorTurnoverExits)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top/Slow Movers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            Maior giro
          </p>
          <div className="space-y-1">
            {topMovers.slice(0, 3).map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[80px]">{item.productName}</span>
                <Badge variant="outline" className="text-xs">{item.turnoverRate}x</Badge>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            Menor giro
          </p>
          <div className="space-y-1">
            {slowMovers.slice(0, 3).map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[80px]">{item.productName}</span>
                <Badge variant="secondary" className="text-xs">{item.turnoverRate}x</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplierPerformanceCard() {
  const { getAllMetrics } = useSupplierPerformance();
  const { suppliers } = useSuppliers();
  const metrics = getAllMetrics();

  // Combine metrics with supplier names
  const supplierData = metrics.map((m) => {
    const supplier = suppliers.find((s) => s.id === m.supplierId);
    return {
      ...m,
      name: supplier?.name || 'Fornecedor',
    };
  }).sort((a, b) => b.avgQualityScore - a.avgQualityScore);

  if (supplierData.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Desempenho de Fornecedores
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma avaliação registrada</p>
          <p className="text-xs mt-1">Avalie seus fornecedores nas ordens de compra</p>
        </div>
      </div>
    );
  }

  // Calculate averages
  const avgOnTime = supplierData.length > 0
    ? Math.round(supplierData.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / supplierData.length)
    : 0;
  const avgQuality = supplierData.length > 0
    ? (supplierData.reduce((sum, s) => sum + s.avgQualityScore, 0) / supplierData.length).toFixed(1)
    : 0;

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        Desempenho de Fornecedores
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <p className="text-lg font-bold">{supplierData.length}</p>
          <p className="text-xs text-muted-foreground">Avaliados</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <p className="text-lg font-bold text-success">{avgOnTime}%</p>
          <p className="text-xs text-muted-foreground">No prazo</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="text-lg font-bold">{avgQuality}</span>
          </div>
          <p className="text-xs text-muted-foreground">Qualidade</p>
        </div>
      </div>

      {/* Top Suppliers */}
      <p className="text-xs text-muted-foreground mb-2">Melhores fornecedores</p>
      <div className="space-y-2">
        {supplierData.slice(0, 4).map((supplier) => (
          <div key={supplier.supplierId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{supplier.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs">{Math.round(supplier.onTimeDeliveryRate)}%</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="text-xs">{supplier.avgQualityScore.toFixed(1)}</span>
              </div>
              {supplier.avgPriceVariance !== 0 && (
                <Badge
                  variant={supplier.avgPriceVariance > 0 ? "destructive" : "default"}
                  className="text-xs"
                >
                  {supplier.avgPriceVariance > 0 ? "+" : ""}{supplier.avgPriceVariance.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
