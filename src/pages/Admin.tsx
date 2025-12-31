import { useState } from "react";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Crown,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  RefreshCw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAdminMetrics, OrganizationWithDetails } from "@/hooks/useAdminMetrics";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from "recharts";

const PLAN_COLORS = {
  trial: "#6b7280",
  basic: "#3b82f6",
  professional: "#8b5cf6",
  enterprise: "#f59e0b",
};

const STATUS_CONFIG = {
  active: { label: "Ativo", variant: "default" as const, color: "bg-green-500" },
  trialing: { label: "Trial", variant: "secondary" as const, color: "bg-blue-500" },
  canceled: { label: "Cancelado", variant: "destructive" as const, color: "bg-red-500" },
  past_due: { label: "Atrasado", variant: "outline" as const, color: "bg-amber-500" },
  expired: { label: "Expirado", variant: "outline" as const, color: "bg-gray-500" },
};

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  loading 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType; 
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs ${
                trend === "up" ? "text-green-500" : 
                trend === "down" ? "text-red-500" : "text-muted-foreground"
              }`}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : 
                 trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationsTable({ 
  organizations, 
  loading 
}: { 
  organizations: OrganizationWithDetails[] | undefined;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const filteredOrgs = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.cnpj?.includes(search) ||
      org.slug?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || org.subscription_status === statusFilter;
    const matchesPlan = planFilter === "all" || org.plan_type === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou slug..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trialing">Trial</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="professional">Profissional</SelectItem>
            <SelectItem value="enterprise">Empresarial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organização</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma organização encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs?.map((org) => {
                const statusConfig = STATUS_CONFIG[org.subscription_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.expired;
                
                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.cnpj || org.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: PLAN_COLORS[org.plan_type as keyof typeof PLAN_COLORS],
                          color: PLAN_COLORS[org.plan_type as keyof typeof PLAN_COLORS]
                        }}
                      >
                        {org.plan_type === "trial" ? "Trial" :
                         org.plan_type === "basic" ? "Básico" :
                         org.plan_type === "professional" ? "Profissional" : "Empresarial"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{org.member_count || 0}</span>
                        <span className="text-muted-foreground">/ {org.max_users}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(org.created_at), "dd/MM/yyyy")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(org.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renovar trial
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredOrgs?.length || 0} de {organizations?.length || 0} organizações
      </p>
    </div>
  );
}

export default function Admin() {
  const { organizations, metrics, isLoading } = useAdminMetrics();

  const pieData = metrics ? [
    { name: "Trial", value: metrics.organizationsByPlan.trial, color: PLAN_COLORS.trial },
    { name: "Básico", value: metrics.organizationsByPlan.basic, color: PLAN_COLORS.basic },
    { name: "Profissional", value: metrics.organizationsByPlan.professional, color: PLAN_COLORS.professional },
    { name: "Empresarial", value: metrics.organizationsByPlan.enterprise, color: PLAN_COLORS.enterprise },
  ].filter(d => d.value > 0) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Administrativo"
        description="Gerencie clientes, visualize métricas e acompanhe o desempenho do SaaS"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics?.mrr || 0)}
          subtitle={`ARR: ${formatCurrency(metrics?.arr || 0)}`}
          icon={DollarSign}
          trend={metrics?.growthRate && metrics.growthRate > 0 ? "up" : metrics?.growthRate && metrics.growthRate < 0 ? "down" : "neutral"}
          trendValue={`${metrics?.growthRate?.toFixed(1) || 0}%`}
          loading={isLoading}
        />
        <MetricCard
          title="Clientes Ativos"
          value={metrics?.activeOrganizations || 0}
          subtitle={`${metrics?.trialingOrganizations || 0} em trial`}
          icon={Building2}
          trend="up"
          trendValue={`+${metrics?.newOrganizationsThisMonth || 0} este mês`}
          loading={isLoading}
        />
        <MetricCard
          title="Churn Rate"
          value={`${metrics?.churnRate?.toFixed(1) || 0}%`}
          subtitle={`${metrics?.canceledOrganizations || 0} cancelamentos`}
          icon={TrendingDown}
          trend={metrics?.churnRate && metrics.churnRate > 5 ? "down" : "up"}
          trendValue={metrics?.churnRate && metrics.churnRate > 5 ? "Alto" : "Saudável"}
          loading={isLoading}
        />
        <MetricCard
          title="Conversão Trial"
          value={`${metrics?.trialConversionRate?.toFixed(1) || 0}%`}
          subtitle={`ARPU: ${formatCurrency(metrics?.averageRevenuePerUser || 0)}`}
          icon={Activity}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução do MRR nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics?.revenueByMonth || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
            <CardDescription>Clientes por tipo de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, "Clientes"]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: plan.color }}
                        />
                        <span className="text-sm">{plan.name}</span>
                      </div>
                      <span className="text-sm font-medium">{plan.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.activeOrganizations || 0}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.trialingOrganizations || 0}</p>
                <p className="text-xs text-muted-foreground">Em Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.expiredOrganizations || 0}</p>
                <p className="text-xs text-muted-foreground">Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.canceledOrganizations || 0}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizações</CardTitle>
          <CardDescription>Lista completa de clientes e suas assinaturas</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationsTable organizations={organizations} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
