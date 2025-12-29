import { useMemo } from "react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/lib/currency";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Calendar,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function PurchasesDashboard() {
  const { orders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  // Gastos por mês (últimos 6 meses)
  const monthlySpending = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthOrders = orders.filter(order => {
        const orderDate = parseISO(order.data_emissao);
        return isWithinInterval(orderDate, { start, end }) && 
               order.status !== 'cancelada';
      });
      
      const total = monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      
      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        monthFull: format(date, 'MMMM/yyyy', { locale: ptBR }),
        value: total,
        count: monthOrders.length,
      });
    }
    return months;
  }, [orders]);

  // Fornecedores mais usados
  const topSuppliers = useMemo(() => {
    const supplierStats: Record<string, { name: string; count: number; total: number }> = {};
    
    orders.forEach(order => {
      if (order.supplier_id && order.status !== 'cancelada') {
        const supplier = suppliers.find(s => s.id === order.supplier_id);
        if (supplier) {
          if (!supplierStats[supplier.id]) {
            supplierStats[supplier.id] = {
              name: supplier.name,
              count: 0,
              total: 0,
            };
          }
          supplierStats[supplier.id].count++;
          supplierStats[supplier.id].total += Number(order.total || 0);
        }
      }
    });
    
    return Object.values(supplierStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders, suppliers]);

  // Status das ordens
  const statusDistribution = useMemo(() => {
    const stats = {
      rascunho: { label: 'Rascunho', count: 0, color: 'hsl(var(--muted-foreground))' },
      enviada: { label: 'Enviada', count: 0, color: 'hsl(var(--primary))' },
      confirmada: { label: 'Confirmada', count: 0, color: 'hsl(var(--warning))' },
      recebida: { label: 'Recebida', count: 0, color: 'hsl(var(--success))' },
      cancelada: { label: 'Cancelada', count: 0, color: 'hsl(var(--destructive))' },
    };
    
    orders.forEach(order => {
      if (stats[order.status as keyof typeof stats]) {
        stats[order.status as keyof typeof stats].count++;
      }
    });
    
    return Object.entries(stats)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        name: data.label,
        value: data.count,
        color: data.color,
      }));
  }, [orders]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelada');
    const thisMonth = orders.filter(o => {
      const orderDate = parseISO(o.data_emissao);
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      return isWithinInterval(orderDate, { start, end }) && o.status !== 'cancelada';
    });
    
    return {
      totalOrders: orders.length,
      totalValue: activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      pendingOrders: orders.filter(o => ['rascunho', 'enviada', 'confirmada'].includes(o.status)).length,
      thisMonthValue: thisMonth.reduce((sum, o) => sum + Number(o.total || 0), 0),
      thisMonthCount: thisMonth.length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Ordens</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-warning">{stats.pendingOrders}</p>
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-chart-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Este Mês</p>
            <p className="text-lg font-bold">{formatCurrency(stats.thisMonthValue)}</p>
            <p className="text-xs text-muted-foreground">{stats.thisMonthCount} ordens</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Mês */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Gastos por Mês</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                labelFormatter={(label) => monthlySpending.find(m => m.month === label)?.monthFull || label}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fornecedores Mais Usados */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Top Fornecedores</h3>
          </div>
          {topSuppliers.length > 0 ? (
            <div className="space-y-4">
              {topSuppliers.map((supplier, index) => (
                <div key={supplier.name} className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {supplier.count} {supplier.count === 1 ? 'ordem' : 'ordens'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(supplier.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Status das Ordens */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Status das Ordens</h3>
          </div>
          {statusDistribution.length > 0 ? (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Ordens']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusDistribution.map((status, index) => (
                  <div key={status.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm flex-1">{status.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {status.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Tendência de Compras */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Tendência de Compras</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'value' ? formatCurrency(value) : value,
                  name === 'value' ? 'Valor' : 'Qtd. Ordens'
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Valor"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))' }}
                name="Qtd. Ordens"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
