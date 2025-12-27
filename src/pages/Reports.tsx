import { useMemo, useState } from "react";
import { FileBarChart, Download, TrendingUp, Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useEntries } from "@/hooks/useEntries";
import { useExits } from "@/hooks/useExits";
import { useStockIndicators } from "@/hooks/useStockIndicators";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = ["hsl(199, 89%, 48%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(0, 84%, 60%)", "hsl(180, 70%, 45%)"];

export default function Reports() {
  const { products, isLoading: productsLoading } = useProducts();
  const { entries, isLoading: entriesLoading } = useEntries();
  const { exits, isLoading: exitsLoading } = useExits();
  const { indicators, summary } = useStockIndicators(30);
  
  const [period, setPeriod] = useState("month");

  const isLoading = productsLoading || entriesLoading || exitsLoading;

  // Período selecionado em dias
  const periodDays = useMemo(() => {
    switch (period) {
      case "week": return 7;
      case "month": return 30;
      case "quarter": return 90;
      case "year": return 365;
      default: return 30;
    }
  }, [period]);

  // Dados mensais para gráficos (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthEntries = entries.filter((e) =>
        isWithinInterval(new Date(e.entry_date), { start: monthStart, end: monthEnd })
      );
      const monthExits = exits.filter((e) =>
        isWithinInterval(new Date(e.exit_date), { start: monthStart, end: monthEnd })
      );

      const entriesQty = monthEntries.reduce((acc, e) => acc + e.quantity, 0);
      const exitsQty = monthExits.reduce((acc, e) => acc + e.quantity, 0);
      const entriesValue = monthEntries.reduce((acc, e) => acc + (e.total_price || 0), 0);

      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        entries: entriesQty,
        exits: exitsQty,
        value: entriesValue,
      });
    }
    return months;
  }, [entries, exits]);

  // Resumo geral do período
  const periodStats = useMemo(() => {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const periodEntries = entries.filter((e) =>
      new Date(e.entry_date) >= periodStart
    );
    const periodExits = exits.filter((e) =>
      new Date(e.exit_date) >= periodStart
    );

    const entriesQty = periodEntries.reduce((acc, e) => acc + e.quantity, 0);
    const exitsQty = periodExits.reduce((acc, e) => acc + e.quantity, 0);
    const entriesValue = periodEntries.reduce((acc, e) => acc + (e.total_price || 0), 0);

    return {
      totalMovements: periodEntries.length + periodExits.length,
      entriesCount: periodEntries.length,
      entriesQty,
      exitsCount: periodExits.length,
      exitsQty,
      totalValue: entriesValue,
    };
  }, [entries, exits, periodDays]);

  // Top produtos mais movimentados
  const topProducts = useMemo(() => {
    const productMovements: Record<string, { name: string; quantity: number }> = {};

    exits.forEach((e) => {
      const productName = e.products?.name || "Produto";
      if (!productMovements[e.product_id]) {
        productMovements[e.product_id] = { name: productName, quantity: 0 };
      }
      productMovements[e.product_id].quantity += e.quantity;
    });

    return Object.values(productMovements)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [exits]);

  // Status do estoque para gráfico de pizza
  const stockStatusData = useMemo(() => {
    return [
      { name: "OK", value: summary.ok, color: "hsl(142, 76%, 36%)" },
      { name: "Baixo", value: summary.warning, color: "hsl(38, 92%, 50%)" },
      { name: "Crítico", value: summary.critical, color: "hsl(0, 84%, 60%)" },
      { name: "Excesso", value: summary.excess, color: "hsl(199, 89%, 48%)" },
    ].filter(item => item.value > 0);
  }, [summary]);

  const handleExport = (exportFormat: string) => {
    toast({ title: "Exportando relatório", description: `Relatório em formato ${exportFormat} será baixado em instantes.` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises e relatórios do almoxarifado"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Relatórios" }]}
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="year">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("PDF")}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("Excel")}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <span className="text-muted-foreground">Total Movimentado</span>
          </div>
          <p className="text-3xl font-bold gradient-text">{periodStats.totalMovements}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {periodStats.entriesQty + periodStats.exitsQty} itens
          </p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-success" />
            </div>
            <span className="text-muted-foreground">Entradas</span>
          </div>
          <p className="text-3xl font-bold text-success">{periodStats.entriesCount}</p>
          <p className="text-sm text-muted-foreground mt-1">+{periodStats.entriesQty} itens</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-muted-foreground">Saídas</span>
          </div>
          <p className="text-3xl font-bold text-destructive">{periodStats.exitsCount}</p>
          <p className="text-sm text-muted-foreground mt-1">-{periodStats.exitsQty} itens</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-muted-foreground">Valor Total</span>
          </div>
          <p className="text-3xl font-bold text-warning">{formatCurrency(periodStats.totalValue)}</p>
          <p className="text-sm text-muted-foreground mt-1">em entradas</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            Movimentações por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(222, 47%, 16%)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="entries" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exits" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Value Chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Valor Movimentado (R$)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(222, 47%, 16%)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatCurrency(value), "Valor"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Valor"
                stroke="hsl(199, 89%, 48%)"
                strokeWidth={3}
                dot={{ fill: "hsl(199, 89%, 48%)", r: 4 }}
                activeDot={{ r: 6, fill: "hsl(199, 89%, 48%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Indicators and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Pie Chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Status do Estoque
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 10%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">OK</span>
                </div>
                <span className="font-medium">{summary.ok}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm">Baixo</span>
                </div>
                <span className="font-medium">{summary.warning}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Crítico</span>
                </div>
                <span className="font-medium">{summary.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm">Excesso</span>
                </div>
                <span className="font-medium">{summary.excess}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Giro médio: <span className="font-medium text-foreground">{summary.avgTurnover}x</span>
            </p>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Produtos Mais Movimentados
          </h3>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma saída registrada
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate max-w-[200px]">{product.name}</span>
                      <span className="text-muted-foreground text-sm">{product.quantity} un</span>
                    </div>
                    <Progress 
                      value={(product.quantity / (topProducts[0]?.quantity || 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Products Running Low */}
      {summary.productsRunningLow.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Produtos com Previsão de Ruptura (próximos 7 dias)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.productsRunningLow.slice(0, 6).map((indicator) => (
              <div key={indicator.productId} className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                <p className="font-medium text-sm truncate">{indicator.productName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    Estoque: {indicator.currentStock}
                  </span>
                  <Badge className="bg-warning/20 text-warning">
                    {indicator.daysUntilStockout === 0 
                      ? "Zerado hoje" 
                      : `${indicator.daysUntilStockout} dia(s)`
                    }
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consumo: {indicator.avgDailyConsumption}/dia • Sugestão: +{indicator.reorderSuggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
