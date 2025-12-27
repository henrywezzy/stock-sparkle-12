import { useState, useMemo } from "react";
import { Plus, Search, Archive, CheckCircle, AlertTriangle, ClipboardCheck, Loader2, Save, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inventoryType, setInventoryType] = useState<'complete' | 'category' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [responsible, setResponsible] = useState("");
  const [isInventoryActive, setIsInventoryActive] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});

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
    </div>
  );
}
