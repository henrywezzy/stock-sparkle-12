import { useMemo, useState } from "react";
import { FileBarChart, Download, TrendingUp, TrendingDown, Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, Target, BarChart3, LineChart as LineChartIcon, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useEntries } from "@/hooks/useEntries";
import { useExits } from "@/hooks/useExits";
import { useCategories } from "@/hooks/useCategories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useStockIndicators } from "@/hooks/useStockIndicators";
import { useABCAnalysis, ABCFilters } from "@/hooks/useABCAnalysis";
import { useDemandForecast, DemandFilters } from "@/hooks/useDemandForecast";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ReportFiltersComponent, ReportFilters } from "@/components/filters/ReportFilters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = ["hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)", "hsl(199, 89%, 48%)", "hsl(280, 65%, 60%)", "hsl(180, 70%, 45%)"];

export default function Reports() {
  const { products, isLoading: productsLoading } = useProducts();
  const { entries, isLoading: entriesLoading } = useEntries();
  const { exits, isLoading: exitsLoading } = useExits();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { indicators, summary } = useStockIndicators(30);
  
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filtros avançados para ABC e Previsão
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    categoryId: "all",
    supplierId: "all",
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Converter filtros para formato dos hooks
  const abcFilters: ABCFilters = {
    categoryId: reportFilters.categoryId,
    supplierId: reportFilters.supplierId,
    dateFrom: reportFilters.dateFrom,
    dateTo: reportFilters.dateTo,
  };

  const demandFilters: DemandFilters = {
    categoryId: reportFilters.categoryId,
    supplierId: reportFilters.supplierId,
    dateFrom: reportFilters.dateFrom,
    dateTo: reportFilters.dateTo,
  };

  const { items: abcItems, summary: abcSummary, isLoading: abcLoading } = useABCAnalysis(90, abcFilters);
  const { items: forecastItems, summary: forecastSummary, isLoading: forecastLoading } = useDemandForecast(90, demandFilters);
  
  // Paginação para tabelas
  const abcPagination = usePagination(abcItems, { itemsPerPage: 10 });
  const forecastPagination = usePagination(forecastItems, { itemsPerPage: 10 });

  const isLoading = productsLoading || entriesLoading || exitsLoading || abcLoading || forecastLoading;

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
        balance: entriesQty - exitsQty,
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

  // Dados do gráfico de Curva ABC
  const abcChartData = useMemo(() => {
    return [
      { 
        name: "Classe A", 
        produtos: abcSummary.classA.count, 
        valor: abcSummary.classA.valuePercentage.toFixed(1),
        color: "hsl(0, 84%, 60%)" 
      },
      { 
        name: "Classe B", 
        produtos: abcSummary.classB.count, 
        valor: abcSummary.classB.valuePercentage.toFixed(1),
        color: "hsl(38, 92%, 50%)" 
      },
      { 
        name: "Classe C", 
        produtos: abcSummary.classC.count, 
        valor: abcSummary.classC.valuePercentage.toFixed(1),
        color: "hsl(142, 76%, 36%)" 
      },
    ];
  }, [abcSummary]);

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
        title="Relatórios Avançados"
        description="Análises, tendências, previsão de demanda e classificação ABC"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Relatórios" }]}
        actions={
          <div className="flex gap-2">
            <ReportFiltersComponent
              filters={reportFilters}
              onFiltersChange={setReportFilters}
              categories={categories}
              suppliers={suppliers}
            />
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
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="abc" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Curva ABC
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4" />
            Previsão de Demanda
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                <AreaChart data={monthlyData}>
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Valor"
                    stroke="hsl(199, 89%, 48%)"
                    fill="hsl(199, 89%, 48%)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Status and Top Products */}
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
        </TabsContent>

        {/* ABC Analysis Tab */}
        <TabsContent value="abc" className="space-y-6">
          {/* ABC Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-6 border-l-4 border-destructive">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg">Classe A</h4>
                <Badge className="bg-destructive/20 text-destructive">Alta Importância</Badge>
              </div>
              <p className="text-3xl font-bold text-destructive">{abcSummary.classA.count}</p>
              <p className="text-sm text-muted-foreground">
                {abcSummary.classA.valuePercentage.toFixed(1)}% do valor total
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Produtos que representam ~80% do valor movimentado
              </p>
            </div>
            <div className="glass rounded-xl p-6 border-l-4 border-warning">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg">Classe B</h4>
                <Badge className="bg-warning/20 text-warning">Média Importância</Badge>
              </div>
              <p className="text-3xl font-bold text-warning">{abcSummary.classB.count}</p>
              <p className="text-sm text-muted-foreground">
                {abcSummary.classB.valuePercentage.toFixed(1)}% do valor total
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Produtos que representam ~15% do valor movimentado
              </p>
            </div>
            <div className="glass rounded-xl p-6 border-l-4 border-success">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg">Classe C</h4>
                <Badge className="bg-success/20 text-success">Baixa Importância</Badge>
              </div>
              <p className="text-3xl font-bold text-success">{abcSummary.classC.count}</p>
              <p className="text-sm text-muted-foreground">
                {abcSummary.classC.valuePercentage.toFixed(1)}% do valor total
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Produtos que representam ~5% do valor movimentado
              </p>
            </div>
          </div>

          {/* ABC Chart */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribuição da Curva ABC
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={abcItems.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215, 20%, 55%)" 
                  fontSize={10}
                  tickFormatter={(value) => value.substring(0, 10) + (value.length > 10 ? "..." : "")}
                />
                <YAxis yAxisId="left" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(199, 89%, 48%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 10%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "cumulativePercentage" ? `${value.toFixed(1)}%` : formatCurrency(value),
                    name === "cumulativePercentage" ? "% Acumulado" : "Valor"
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalValue" name="Valor" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="% Acumulado" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ABC Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Produtos Classificados (últimos 90 dias)
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                  <TableHead className="text-right">% Acumulado</TableHead>
                  <TableHead>Classe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abcPagination.paginatedData.map((item) => (
                  <TableRow key={item.id} className="border-border/30">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.sku || "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell className="text-right">{item.percentageValue.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.cumulativePercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.classification === "A"
                            ? "bg-destructive/20 text-destructive"
                            : item.classification === "B"
                            ? "bg-warning/20 text-warning"
                            : "bg-success/20 text-success"
                        }
                      >
                        {item.classification}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={abcPagination.currentPage}
              totalPages={abcPagination.totalPages}
              startIndex={abcPagination.startIndex}
              endIndex={abcPagination.endIndex}
              totalItems={abcPagination.totalItems}
              onPageChange={abcPagination.goToPage}
              hasNextPage={abcPagination.hasNextPage}
              hasPrevPage={abcPagination.hasPrevPage}
            />
          </div>
        </TabsContent>

        {/* Demand Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-muted-foreground">Produtos em Risco</span>
              </div>
              <p className="text-3xl font-bold text-destructive">{forecastSummary.totalProductsAtRisk}</p>
              <p className="text-sm text-muted-foreground mt-1">ruptura em até 14 dias</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-warning" />
                </div>
                <span className="text-muted-foreground">Média de Dias até Ruptura</span>
              </div>
              <p className="text-3xl font-bold text-warning">{forecastSummary.averageStockoutDays}</p>
              <p className="text-sm text-muted-foreground mt-1">dias em média</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Demanda Prevista (30d)</span>
              </div>
              <p className="text-3xl font-bold gradient-text">{forecastSummary.totalForecastedDemand30Days}</p>
              <p className="text-sm text-muted-foreground mt-1">unidades</p>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-primary" />
                Previsão de Demanda por Produto
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Consumo/Dia</TableHead>
                  <TableHead className="text-right">Dias até Ruptura</TableHead>
                  <TableHead className="text-right">Previsão 30d</TableHead>
                  <TableHead>Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastPagination.paginatedData.map((item) => (
                  <TableRow key={item.id} className="border-border/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{item.avgDailyConsumption.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {item.daysUntilStockout !== null ? (
                        <Badge
                          className={
                            item.daysUntilStockout <= 7
                              ? "bg-destructive/20 text-destructive"
                              : item.daysUntilStockout <= 14
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }
                        >
                          {item.daysUntilStockout} dias
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.forecastedDemand30Days}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : item.trend === "down" ? (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        ) : (
                          <Activity className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span
                          className={
                            item.trend === "up"
                              ? "text-success"
                              : item.trend === "down"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {item.trendPercentage > 0 ? "+" : ""}{item.trendPercentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={forecastPagination.currentPage}
              totalPages={forecastPagination.totalPages}
              startIndex={forecastPagination.startIndex}
              endIndex={forecastPagination.endIndex}
              totalItems={forecastPagination.totalItems}
              onPageChange={forecastPagination.goToPage}
              hasNextPage={forecastPagination.hasNextPage}
              hasPrevPage={forecastPagination.hasPrevPage}
            />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Balance Chart */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Balanço de Estoque (Entradas - Saídas)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyData}>
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
                <Line type="monotone" dataKey="balance" name="Balanço" stroke="hsl(199, 89%, 48%)" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
