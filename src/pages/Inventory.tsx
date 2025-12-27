import { useState, useMemo } from "react";
import { Plus, Search, Archive, CheckCircle, AlertTriangle, ClipboardCheck, Loader2, Save, RotateCcw, History, Calendar, User, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useInventoryReports } from "@/hooks/useInventoryReports";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryCount {
  productId: string;
  systemQty: number;
  physicalQty: number | null;
  difference: number | null;
  status: 'pending' | 'counted' | 'divergent' | 'ok';
}

export default function Inventory() {
  const { products, isLoading, updateProduct } = useProducts();
  const { categories } = useCategories();
  const { addReport, getRecentReports, getReportStats } = useInventoryReports();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inventoryType, setInventoryType] = useState<'complete' | 'category' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [responsible, setResponsible] = useState("");
  const [isInventoryActive, setIsInventoryActive] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [activeTab, setActiveTab] = useState("inventory");

  const recentReports = getRecentReports(10);
  const reportStats = getReportStats();

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
      
      // Se inventário ativo por categoria, filtrar só pela categoria selecionada
      if (isInventoryActive && inventoryType === 'category' && selectedCategory) {
        return matchesSearch && p.category_id === selectedCategory;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter, isInventoryActive, inventoryType, selectedCategory]);

  // Calcular progresso do inventário
  const inventoryStats = useMemo(() => {
    const counted = Object.values(counts).filter(v => v !== null).length;
    const total = filteredProducts.length;
    const divergences = filteredProducts.filter(p => {
      const physicalQty = counts[p.id];
      return physicalQty !== null && physicalQty !== p.quantity;
    }).length;

    return {
      counted,
      total,
      pending: total - counted,
      divergences,
      progress: total > 0 ? Math.round((counted / total) * 100) : 0,
    };
  }, [counts, filteredProducts]);

  const handlePhysicalQtyChange = (productId: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setCounts(prev => ({ ...prev, [productId]: isNaN(numValue as number) ? null : numValue }));
  };

  const startInventory = () => {
    if (!responsible.trim()) {
      toast({ title: "Informe o responsável", variant: "destructive" });
      return;
    }
    if (inventoryType === 'category' && !selectedCategory) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      return;
    }
    
    setCounts({});
    setIsInventoryActive(true);
    setIsDialogOpen(false);
    toast({ 
      title: "Inventário iniciado!", 
      description: `Responsável: ${responsible}` 
    });
  };

  const finishInventory = async () => {
    const adjustments = filteredProducts
      .filter(p => counts[p.id] !== null && counts[p.id] !== p.quantity)
      .map(p => ({
        id: p.id,
        quantity: counts[p.id] as number,
      }));

    const divergences = filteredProducts.filter(p => {
      const physicalQty = counts[p.id];
      return physicalQty !== null && physicalQty !== p.quantity;
    }).length;

    // Registrar relatório
    addReport({
      date: new Date().toISOString(),
      type: inventoryType || 'complete',
      categoryName: inventoryType === 'category' 
        ? categories.find(c => c.id === selectedCategory)?.name 
        : undefined,
      responsible,
      totalItems: filteredProducts.length,
      countedItems: Object.values(counts).filter(v => v !== null).length,
      divergences,
      adjustments: adjustments.length,
      status: 'completed',
    });

    if (adjustments.length === 0) {
      toast({ title: "Inventário finalizado", description: "Nenhum ajuste necessário." });
    } else {
      // Aplicar ajustes
      for (const adj of adjustments) {
        await updateProduct.mutateAsync({ id: adj.id, quantity: adj.quantity });
      }
      toast({ 
        title: "Inventário finalizado!", 
        description: `${adjustments.length} produto(s) ajustado(s).` 
      });
    }

    setIsInventoryActive(false);
    setCounts({});
    setResponsible("");
    setInventoryType(null);
    setSelectedCategory("");
  };

  const cancelInventory = () => {
    // Registrar cancelamento
    addReport({
      date: new Date().toISOString(),
      type: inventoryType || 'complete',
      categoryName: inventoryType === 'category' 
        ? categories.find(c => c.id === selectedCategory)?.name 
        : undefined,
      responsible,
      totalItems: filteredProducts.length,
      countedItems: Object.values(counts).filter(v => v !== null).length,
      divergences: 0,
      adjustments: 0,
      status: 'cancelled',
    });
    setIsInventoryActive(false);
    setCounts({});
    setResponsible("");
    setInventoryType(null);
    setSelectedCategory("");
    toast({ title: "Inventário cancelado" });
  };

  const columns = [
    {
      key: "name",
      header: "Produto",
      render: (product: Product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.location || "—"}</p>
        </div>
      ),
    },
    { 
      key: "category", 
      header: "Categoria",
      render: (product: Product) => (
        <Badge 
          variant="outline" 
          style={{ 
            borderColor: product.categories?.color || undefined,
            color: product.categories?.color || undefined 
          }}
        >
          {product.categories?.name || "—"}
        </Badge>
      ),
    },
    {
      key: "systemQty",
      header: "Qtd. Sistema",
      render: (product: Product) => (
        <span className="font-medium">{product.quantity}</span>
      ),
    },
    {
      key: "physicalQty",
      header: "Qtd. Física",
      render: (product: Product) => (
        <Input
          type="number"
          className="w-24 h-8"
          placeholder="0"
          min={0}
          value={counts[product.id] ?? ''}
          onChange={(e) => handlePhysicalQtyChange(product.id, e.target.value)}
          disabled={!isInventoryActive}
        />
      ),
    },
    {
      key: "difference",
      header: "Diferença",
      render: (product: Product) => {
        const physicalQty = counts[product.id];
        if (physicalQty === null || physicalQty === undefined) {
          return <span className="text-muted-foreground">—</span>;
        }
        const diff = physicalQty - product.quantity;
        if (diff === 0) {
          return <span className="text-success font-medium">0</span>;
        }
        return (
          <span className={`font-medium ${diff > 0 ? 'text-success' : 'text-destructive'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => {
        const physicalQty = counts[product.id];
        if (!isInventoryActive) {
          return <Badge className="bg-muted text-muted-foreground">—</Badge>;
        }
        if (physicalQty === null || physicalQty === undefined) {
          return <Badge className="bg-muted text-muted-foreground">Pendente</Badge>;
        }
        const diff = physicalQty - product.quantity;
        if (diff === 0) {
          return <Badge className="bg-success/20 text-success">OK</Badge>;
        }
        return <Badge className="bg-warning/20 text-warning">Divergente</Badge>;
      },
    },
  ];

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
        title="Inventário"
        description="Realize contagens e auditorias do estoque"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Inventário" }]}
        actions={
          !isInventoryActive ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground glow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Inventário
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle>Iniciar Novo Inventário</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de inventário a ser realizado
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Tipo de Inventário</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        className={`p-4 rounded-lg border transition-all text-left ${
                          inventoryType === 'complete' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => setInventoryType('complete')}
                      >
                        <ClipboardCheck className="w-8 h-8 text-primary mb-2" />
                        <p className="font-medium">Completo</p>
                        <p className="text-sm text-muted-foreground">Todos os produtos</p>
                      </button>
                      <button 
                        className={`p-4 rounded-lg border transition-all text-left ${
                          inventoryType === 'category' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => setInventoryType('category')}
                      >
                        <Archive className="w-8 h-8 text-primary mb-2" />
                        <p className="font-medium">Por Categoria</p>
                        <p className="text-sm text-muted-foreground">Categoria específica</p>
                      </button>
                    </div>
                  </div>
                  
                  {inventoryType === 'category' && (
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="responsible">Responsável</Label>
                    <Input 
                      id="responsible" 
                      placeholder="Nome do responsável" 
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="gradient-primary text-primary-foreground"
                    onClick={startInventory}
                    disabled={!inventoryType}
                  >
                    Iniciar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelInventory}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={finishInventory}
              >
                <Save className="w-4 h-4 mr-2" />
                Finalizar
              </Button>
            </div>
          )
        }
      />

      {/* Progress Card */}
      {isInventoryActive && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Inventário em Andamento</h3>
              <p className="text-sm text-muted-foreground">
                {inventoryType === 'complete' ? 'Inventário Completo' : `Categoria: ${categories.find(c => c.id === selectedCategory)?.name}`}
                {' - Responsável: '}{responsible}
              </p>
            </div>
            <Badge className="bg-warning/20 text-warning">Em Progresso</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{inventoryStats.progress}%</span>
            </div>
            <Progress value={inventoryStats.progress} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm">
                <span className="font-medium">{inventoryStats.counted}</span> conferidos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm">
                <span className="font-medium">{inventoryStats.divergences}</span> divergências
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{inventoryStats.pending}</span> pendentes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Inventory and Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Contagem
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            {!isInventoryActive && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Table */}
          <DataTable columns={columns} data={filteredProducts} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Realizados</p>
                  <p className="text-xl font-bold">{reportStats.completedReports}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Divergências</p>
                  <p className="text-xl font-bold">{reportStats.totalDivergences}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ajustes</p>
                  <p className="text-xl font-bold">{reportStats.totalAdjustments}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa Média</p>
                  <p className="text-xl font-bold">{reportStats.avgDivergenceRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Últimos Inventários</h3>
              <p className="text-sm text-muted-foreground">Histórico dos últimos 10 inventários realizados</p>
            </div>
            
            {recentReports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum inventário realizado ainda</p>
                <p className="text-sm">Inicie um novo inventário para ver o histórico aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={report.status === 'completed' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                            {report.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                          <Badge variant="outline">
                            {report.type === 'complete' ? 'Completo' : `Categoria: ${report.categoryName}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(report.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {report.responsible}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Conferidos</p>
                          <p className="font-semibold">{report.countedItems}/{report.totalItems}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Divergências</p>
                          <p className={`font-semibold ${report.divergences > 0 ? 'text-warning' : 'text-success'}`}>
                            {report.divergences}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ajustes</p>
                          <p className="font-semibold">{report.adjustments}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
