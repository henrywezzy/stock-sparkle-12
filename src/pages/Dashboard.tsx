import { useMemo } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  Users,
  HardHat,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useEntries } from "@/hooks/useEntries";
import { useExits } from "@/hooks/useExits";
import { useCategories } from "@/hooks/useCategories";
import { useEmployees } from "@/hooks/useEmployees";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";

const COLORS = ["hsl(199, 89%, 48%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(0, 84%, 60%)", "hsl(180, 70%, 45%)"];

export default function Dashboard() {
  const { products } = useProducts();
  const { entries } = useEntries();
  const { exits } = useExits();
  const { categories } = useCategories();
  const { employees } = useEmployees();
  const { isViewer } = useAuth();

  // Estatísticas gerais
  const totalProducts = products.length;
  const lowStockProducts = useMemo(() => 
    products.filter((p) => p.quantity <= (p.min_quantity || 10)),
    [products]
  );

  // Calcular entradas e saídas do mês atual
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthEntries = entries.filter((e) => 
      isWithinInterval(new Date(e.entry_date), { start: monthStart, end: monthEnd })
    );
    const monthExits = exits.filter((e) => 
      isWithinInterval(new Date(e.exit_date), { start: monthStart, end: monthEnd })
    );

    return {
      entriesCount: monthEntries.reduce((acc, e) => acc + e.quantity, 0),
      exitsCount: monthExits.reduce((acc, e) => acc + e.quantity, 0),
      entriesTotal: monthEntries.reduce((acc, e) => acc + (e.total_price || 0), 0),
    };
  }, [entries, exits]);

  // Dados para o gráfico de movimentação por mês (últimos 6 meses)
  const movementData = useMemo(() => {
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

      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        entries: monthEntries.reduce((acc, e) => acc + e.quantity, 0),
        exits: monthExits.reduce((acc, e) => acc + e.quantity, 0),
      });
    }
    return months;
  }, [entries, exits]);

  // Distribuição por categoria
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    products.forEach((product) => {
      const categoryName = product.categories?.name || "Sem categoria";
      distribution[categoryName] = (distribution[categoryName] || 0) + product.quantity;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  // Alertas de estoque - separar crítico e baixo
  const stockAlerts = useMemo(() => {
    return lowStockProducts.slice(0, 5).map((product) => {
      let status: "critical" | "warning" | "ok" = "ok";
      
      if (product.quantity === 0) {
        status = "critical";
      } else if (product.quantity <= (product.min_quantity || 10)) {
        status = "warning";
      }

      return {
        product: product.name,
        current: product.quantity,
        min: product.min_quantity || 10,
        status,
      };
    });
  }, [lowStockProducts]);

  // Contagem separada de estoque crítico e baixo
  const criticalStockCount = useMemo(() => 
    products.filter((p) => p.quantity === 0).length,
    [products]
  );
  
  const lowStockCount = useMemo(() => 
    products.filter((p) => p.quantity > 0 && p.quantity <= (p.min_quantity || 10)).length,
    [products]
  );

  // Estatísticas de funcionários
  const employeeStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const activeEmployees = employees.filter((e) => e.status === "active");
    const newThisMonth = employees.filter((e) => 
      isWithinInterval(new Date(e.created_at), { start: monthStart, end: monthEnd })
    );

    return {
      active: activeEmployees.length,
      newThisMonth: newThisMonth.length,
    };
  }, [employees]);

  // Status dos produtos (por validade)
  const productStatusData = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let expired = 0;
    let expiring = 0;
    let valid = 0;

    products.forEach((product) => {
      if (product.expiry_date) {
        const expiryDate = new Date(product.expiry_date);
        if (expiryDate < today) {
          expired += product.quantity;
        } else if (expiryDate <= thirtyDaysFromNow) {
          expiring += product.quantity;
        } else {
          valid += product.quantity;
        }
      } else {
        valid += product.quantity;
      }
    });

    return [
      { name: "Válidos", value: valid },
      { name: "Vencendo", value: expiring },
      { name: "Vencidos", value: expired },
    ];
  }, [products]);

  // Últimas movimentações
  const recentMovements = useMemo(() => {
    const allMovements = [
      ...entries.slice(0, 5).map((e) => ({
        type: "entry" as const,
        product: e.products?.name || "Produto",
        quantity: e.quantity,
        date: new Date(e.entry_date),
      })),
      ...exits.slice(0, 5).map((e) => ({
        type: "exit" as const,
        product: e.products?.name || "Produto",
        quantity: e.quantity,
        date: new Date(e.exit_date),
      })),
    ];

    return allMovements
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [entries, exits]);

  // Se for visualizador, mostrar dashboard simplificado
  if (isViewer) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Visão geral do almoxarifado"
        />

        {/* Stats Grid - Apenas total e categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total de Produtos"
            value={totalProducts}
            icon={Package}
          />
          <StatCard
            title="Categorias"
            value={categories.length}
            icon={Package}
          />
          <StatCard
            title="Estoque Crítico"
            value={criticalStockCount}
            icon={AlertTriangle}
            className={criticalStockCount > 0 ? "border-destructive/50" : ""}
          />
        </div>

        {/* Low Stock Alert Banner */}
        {criticalStockCount > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3 bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">
                <span className="text-destructive">{criticalStockCount} produto(s) sem estoque</span>
              </p>
              <p className="text-sm text-muted-foreground">Consulte a página de produtos para mais detalhes</p>
            </div>
          </div>
        )}

        {/* Category Distribution */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Distribuição por Categoria
          </h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="transparent"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Product Status */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Status dos Produtos (Validade)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={productStatusData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                fill="hsl(199, 89%, 48%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do almoxarifado e movimentações"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Produtos"
          value={totalProducts}
          icon={Package}
          trend={{ value: products.length > 0 ? Math.round((products.length / 100) * 10) : 0, isPositive: true }}
        />
        <StatCard
          title="Entradas do Mês"
          value={currentMonthStats.entriesCount}
          icon={ArrowDownToLine}
          trend={{ value: currentMonthStats.entriesCount > 0 ? 8 : 0, isPositive: true }}
        />
        <StatCard
          title="Saídas do Mês"
          value={currentMonthStats.exitsCount}
          icon={ArrowUpFromLine}
          trend={{ value: currentMonthStats.exitsCount > 0 ? 5 : 0, isPositive: false }}
        />
        <StatCard
          title="Estoque Crítico"
          value={criticalStockCount}
          icon={AlertTriangle}
          className={criticalStockCount > 0 ? "border-destructive/50" : ""}
        />
      </div>

      {/* Low Stock Alert Banner */}
      {(criticalStockCount > 0 || lowStockCount > 0) && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${criticalStockCount > 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-warning/10 border border-warning/30'}`}>
          <AlertTriangle className={`w-5 h-5 ${criticalStockCount > 0 ? 'text-destructive' : 'text-warning'}`} />
          <div>
            <p className="font-medium">
              {criticalStockCount > 0 && <span className="text-destructive">{criticalStockCount} produto(s) sem estoque (crítico)</span>}
              {criticalStockCount > 0 && lowStockCount > 0 && " | "}
              {lowStockCount > 0 && <span className="text-warning">{lowStockCount} produto(s) com estoque baixo</span>}
            </p>
            <p className="text-sm text-muted-foreground">Verifique a lista de alertas abaixo para mais detalhes</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Movimentações por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={movementData}>
              <defs>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                }}
              />
              <Area
                type="monotone"
                dataKey="entries"
                name="Entradas"
                stroke="hsl(142, 76%, 36%)"
                fillOpacity={1}
                fill="url(#colorEntries)"
              />
              <Area
                type="monotone"
                dataKey="exits"
                name="Saídas"
                stroke="hsl(0, 84%, 60%)"
                fillOpacity={1}
                fill="url(#colorExits)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Distribuição por Categoria
          </h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="transparent"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Alertas de Estoque
          </h3>
          <div className="space-y-4">
            {stockAlerts.length > 0 ? (
              stockAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.product}</p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {alert.current} | Mínimo: {alert.min}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.status === "critical"
                        ? "bg-destructive/20 text-destructive"
                        : alert.status === "warning"
                        ? "bg-warning/20 text-warning"
                        : "bg-success/20 text-success"
                    }`}
                  >
                    {alert.status === "critical" ? "Crítico" : alert.status === "warning" ? "Atenção" : "OK"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Todos os produtos estão com estoque adequado
              </p>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Últimas Movimentações
          </h3>
          <div className="space-y-4">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      movement.type === "entry" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {movement.type === "entry" ? (
                        <ArrowDownToLine className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[120px]">{movement.product}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(movement.date, "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${
                    movement.type === "entry" ? "text-success" : "text-destructive"
                  }`}>
                    {movement.type === "entry" ? "+" : "-"}{movement.quantity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma movimentação recente
              </p>
            )}
          </div>
        </div>

        {/* Product Status */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Status dos Produtos
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={productStatusData}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
              <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(215, 20%, 55%)" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(222, 47%, 16%)",
                  borderRadius: "8px",
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                fill="hsl(199, 89%, 48%)"
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Employee Summary */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Resumo Funcionários</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <p className="text-lg font-bold">{employeeStats.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/50 text-center">
                <p className="text-lg font-bold text-success">+{employeeStats.newThisMonth}</p>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
