import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  Users,
  HardHat,
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
  Legend,
} from "recharts";
import { movementData, categoryDistribution, products, entries, exits, stockAlerts } from "@/data/mockData";

const COLORS = ["hsl(199, 89%, 48%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(0, 84%, 60%)", "hsl(180, 70%, 45%)"];

export default function Dashboard() {
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock).length;
  const totalEntries = entries.reduce((acc, e) => acc + e.quantity, 0);
  const totalExits = exits.reduce((acc, e) => acc + e.quantity, 0);

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
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Entradas do Mês"
          value={totalEntries}
          icon={ArrowDownToLine}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Saídas do Mês"
          value={totalExits}
          icon={ArrowUpFromLine}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Estoque Baixo"
          value={lowStockProducts}
          icon={AlertTriangle}
          className={lowStockProducts > 0 ? "border-warning/50" : ""}
        />
      </div>

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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            {stockAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div>
                  <p className="font-medium">{alert.product}</p>
                  <p className="text-sm text-muted-foreground">
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
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Resumo Funcionários
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground">Total Ativos</span>
              <span className="font-bold text-lg">48</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground">Novos este mês</span>
              <span className="font-bold text-lg text-success">+5</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground">Com EPIs vencendo</span>
              <span className="font-bold text-lg text-warning">12</span>
            </div>
          </div>
        </div>

        {/* EPI Summary */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Status EPIs
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: "Em uso", value: 156 },
                { name: "Vencidos", value: 23 },
                { name: "Vencendo", value: 45 },
              ]}
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
              <Bar dataKey="value" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
