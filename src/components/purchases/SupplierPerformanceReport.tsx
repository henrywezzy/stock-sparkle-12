import { useState, useMemo } from "react";
import {
  Building2,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trophy,
  Medal,
  Award,
  Download,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSupplierPerformance, SupplierMetrics } from "@/hooks/useSupplierPerformance";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/lib/currency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface SupplierPerformanceReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierPerformanceReport({ open, onOpenChange }: SupplierPerformanceReportProps) {
  const { getAllMetrics, performances } = useSupplierPerformance();
  const { suppliers } = useSuppliers();
  const [sortBy, setSortBy] = useState<"quality" | "delivery" | "price">("quality");

  const metrics = getAllMetrics();

  // Combine metrics with supplier data
  const supplierData = useMemo(() => {
    return metrics.map((m) => {
      const supplier = suppliers.find((s) => s.id === m.supplierId);
      return {
        ...m,
        name: supplier?.name || "Fornecedor",
        rating: supplier?.rating || 0,
      };
    });
  }, [metrics, suppliers]);

  // Sort based on selected criteria
  const sortedSuppliers = useMemo(() => {
    const sorted = [...supplierData];
    switch (sortBy) {
      case "quality":
        return sorted.sort((a, b) => b.avgQualityScore - a.avgQualityScore);
      case "delivery":
        return sorted.sort((a, b) => b.onTimeDeliveryRate - a.onTimeDeliveryRate);
      case "price":
        return sorted.sort((a, b) => a.avgPriceVariance - b.avgPriceVariance);
      default:
        return sorted;
    }
  }, [supplierData, sortBy]);

  // Overall statistics
  const overallStats = useMemo(() => {
    if (supplierData.length === 0) {
      return {
        totalOrders: 0,
        avgQuality: 0,
        avgOnTime: 0,
        avgPriceVariance: 0,
      };
    }

    const totalOrders = supplierData.reduce((sum, s) => sum + s.totalOrders, 0);
    const avgQuality = supplierData.reduce((sum, s) => sum + s.avgQualityScore, 0) / supplierData.length;
    const avgOnTime = supplierData.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / supplierData.length;
    const avgPriceVariance = supplierData.reduce((sum, s) => sum + s.avgPriceVariance, 0) / supplierData.length;

    return { totalOrders, avgQuality, avgOnTime, avgPriceVariance };
  }, [supplierData]);

  // Chart data for bar chart
  const chartData = useMemo(() => {
    return sortedSuppliers.slice(0, 10).map((s) => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + "..." : s.name,
      qualidade: s.avgQualityScore,
      prazo: s.onTimeDeliveryRate,
      preco: 100 - Math.abs(s.avgPriceVariance),
    }));
  }, [sortedSuppliers]);

  // Radar chart data for top supplier
  const radarData = useMemo(() => {
    if (sortedSuppliers.length === 0) return [];
    const top = sortedSuppliers[0];
    return [
      { subject: "Qualidade", value: top.avgQualityScore * 20, fullMark: 100 },
      { subject: "Prazo", value: top.onTimeDeliveryRate, fullMark: 100 },
      { subject: "Preço", value: Math.max(0, 100 - Math.abs(top.avgPriceVariance)), fullMark: 100 },
      { subject: "Pedidos", value: Math.min(top.totalOrders * 10, 100), fullMark: 100 },
    ];
  }, [sortedSuppliers]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-warning" />;
      case 1:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-success";
    if (score >= 3) return "text-warning";
    return "text-destructive";
  };

  if (supplierData.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Relatório de Fornecedores
            </DialogTitle>
            <DialogDescription>
              Análise de desempenho dos fornecedores
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-sm mt-2">
              As avaliações são registradas automaticamente ao receber ordens de compra.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Relatório de Desempenho de Fornecedores
          </DialogTitle>
          <DialogDescription>
            Ranking e análise de desempenho baseado em {overallStats.totalOrders} avaliações
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold">{supplierData.length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                  <span className="text-2xl font-bold">{overallStats.avgQuality.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Qualidade Média</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-success">{Math.round(overallStats.avgOnTime)}%</p>
                <p className="text-xs text-muted-foreground">Entregas no Prazo</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className={`text-2xl font-bold ${overallStats.avgPriceVariance > 0 ? "text-destructive" : "text-success"}`}>
                  {overallStats.avgPriceVariance > 0 ? "+" : ""}{overallStats.avgPriceVariance.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Variação de Preço</p>
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ranking de Fornecedores</h3>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Por Qualidade</SelectItem>
                  <SelectItem value="delivery">Por Prazo</SelectItem>
                  <SelectItem value="price">Por Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comparison Chart */}
            {chartData.length > 0 && (
              <div className="glass rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Comparativo de Desempenho</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="qualidade" name="Qualidade (%)" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ranking List */}
            <div className="space-y-3">
              {sortedSuppliers.map((supplier, index) => (
                <div
                  key={supplier.supplierId}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? "bg-warning/5 border-warning/30" : "bg-secondary/30 border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {supplier.totalOrders} pedido(s) avaliado(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quality Score */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${supplier.avgQualityScore > 0 ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                          <span className={`font-bold ${getScoreColor(supplier.avgQualityScore)}`}>
                            {supplier.avgQualityScore > 0 ? supplier.avgQualityScore.toFixed(1) : "—"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Qualidade</p>
                      </div>

                      {/* On-time Rate */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-bold">{Math.round(supplier.onTimeDeliveryRate)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">No Prazo</p>
                      </div>

                      {/* Price Variance */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {supplier.avgPriceVariance > 0 ? (
                            <TrendingUp className="w-4 h-4 text-destructive" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-success" />
                          )}
                          <span className={`font-bold ${supplier.avgPriceVariance > 0 ? "text-destructive" : "text-success"}`}>
                            {supplier.avgPriceVariance > 0 ? "+" : ""}{supplier.avgPriceVariance.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Preço</p>
                      </div>

                      {/* Avg Delivery Days */}
                      <div className="text-center hidden sm:block">
                        <span className="font-bold">{supplier.avgDeliveryDays.toFixed(0)} dias</span>
                        <p className="text-xs text-muted-foreground">Prazo médio</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Qualidade</span>
                        <span>{((supplier.avgQualityScore / 5) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(supplier.avgQualityScore / 5) * 100} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Prazo</span>
                        <span>{Math.round(supplier.onTimeDeliveryRate)}%</span>
                      </div>
                      <Progress value={supplier.onTimeDeliveryRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Custo-benefício</span>
                        <span>{Math.max(0, 100 - Math.abs(supplier.avgPriceVariance)).toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.max(0, 100 - Math.abs(supplier.avgPriceVariance))} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}