import { FileBarChart, Download, Calendar, TrendingUp, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
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
} from "recharts";
import { toast } from "@/hooks/use-toast";

const monthlyData = [
  { month: "Jan", entries: 45, exits: 32, value: 15000 },
  { month: "Fev", entries: 52, exits: 41, value: 18500 },
  { month: "Mar", entries: 38, exits: 35, value: 12000 },
  { month: "Abr", entries: 61, exits: 48, value: 22000 },
  { month: "Mai", entries: 55, exits: 52, value: 19500 },
  { month: "Jun", entries: 67, exits: 58, value: 25000 },
];

const topProducts = [
  { name: "Parafuso Phillips 6mm", quantity: 2500 },
  { name: "Luva de Proteção", quantity: 850 },
  { name: "Fita Isolante 19mm", quantity: 620 },
  { name: "Cabo Elétrico 2.5mm", quantity: 580 },
  { name: "Óleo WD-40", quantity: 320 },
];

export default function Reports() {
  const handleExport = (format: string) => {
    toast({ title: "Exportando relatório", description: `Relatório em formato ${format} será baixado em instantes.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises e relatórios do almoxarifado"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Relatórios" }]}
        actions={
          <div className="flex gap-2">
            <Select defaultValue="month">
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
          <p className="text-3xl font-bold gradient-text">318</p>
          <p className="text-sm text-muted-foreground mt-1">+12% vs período anterior</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-success" />
            </div>
            <span className="text-muted-foreground">Entradas</span>
          </div>
          <p className="text-3xl font-bold text-success">184</p>
          <p className="text-sm text-muted-foreground mt-1">+8% vs período anterior</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-muted-foreground">Saídas</span>
          </div>
          <p className="text-3xl font-bold text-destructive">134</p>
          <p className="text-sm text-muted-foreground mt-1">+5% vs período anterior</p>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-muted-foreground">Valor Total</span>
          </div>
          <p className="text-3xl font-bold text-warning">R$ 112K</p>
          <p className="text-sm text-muted-foreground mt-1">+15% vs período anterior</p>
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
                formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Valor"]}
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

      {/* Top Products */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Produtos Mais Movimentados
        </h3>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted-foreground">{product.quantity} un</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${(product.quantity / topProducts[0].quantity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
