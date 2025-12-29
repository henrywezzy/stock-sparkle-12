import { useState, useMemo } from "react";
import { 
  ShoppingCart, 
  Check, 
  X, 
  AlertTriangle, 
  TrendingDown,
  Package,
  DollarSign,
  History,
  Truck,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  ClipboardList,
  Plus,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GenericReportDialog, ReportColumn, ReportSummary } from "@/components/reports/GenericReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/hooks/useProducts";
import { useEntries } from "@/hooks/useEntries";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useEPIs } from "@/hooks/useEPIs";
import { useAuth } from "@/contexts/AuthContext";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { ColumnSettings } from "@/components/ui/column-settings";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataFilters } from "@/components/filters/DataFilters";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PurchaseOrderDialog } from "@/components/purchases/PurchaseOrderDialog";
import { PurchaseOrdersListDialog } from "@/components/purchases/PurchaseOrdersListDialog";
import { PurchasesDashboard } from "@/components/purchases/PurchasesDashboard";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";

// Colunas padrão para a tabela
const DEFAULT_COLUMNS = [
  { key: "type", label: "Tipo", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "sku", label: "ID (SKU)", visible: true },
  { key: "product", label: "Produto", visible: true },
  { key: "current_stock", label: "Estoque Atual", visible: true },
  { key: "min_stock", label: "Estoque Mínimo", visible: true },
  { key: "suggested_qty", label: "Qtd. Sugerida", visible: true },
  { key: "last_price", label: "Último Preço", visible: true },
  { key: "supplier", label: "Fornecedor", visible: true },
  { key: "actions", label: "Ações", visible: true },
];

interface PurchaseSuggestion {
  type: 'product' | 'epi';
  product: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    min_quantity: number | null;
    max_quantity: number | null;
    supplier_id: string | null;
  };
  status: 'critical' | 'low';
  suggestedQuantity: number;
  lastPurchases: {
    date: string;
    quantity: number;
    unit_price: number | null;
    supplier_name: string | null;
    supplier_id: string | null;
  }[];
}

export default function Purchases() {
  const { products, isLoading: loadingProducts } = useProducts();
  const { entries } = useEntries();
  const { suppliers } = useSuppliers();
  const { epis, isLoading: loadingEPIs } = useEPIs();
  const { canEdit } = useAuth();
  const { toast } = useToast();

  const {
    columns,
    visibleColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useColumnPreferences("purchases", DEFAULT_COLUMNS);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "low">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "epi">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PurchaseSuggestion | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [ordersListDialogOpen, setOrdersListDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sugestoes" | "dashboard">("sugestoes");
  
  // Form state for purchase confirmation
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string>("");
  
  const { getStatistics } = usePurchaseOrders();

  // Gerar sugestões de compra baseado em produtos e EPIs com estoque baixo/crítico
  const purchaseSuggestions = useMemo(() => {
    const suggestions: PurchaseSuggestion[] = [];

    // Add products with low stock
    products.forEach((product) => {
      const minQty = product.min_quantity || 10;
      const maxQty = product.max_quantity || 100;
      
      const isCritical = product.quantity <= minQty * 0.5;
      const isLow = product.quantity <= minQty && !isCritical;
      
      if (!isCritical && !isLow) return;

      const productEntries = entries
        .filter((entry) => entry.product_id === product.id && entry.unit_price)
        .slice(0, 5)
        .map((entry) => ({
          date: entry.entry_date,
          quantity: entry.quantity,
          unit_price: entry.unit_price,
          supplier_name: entry.suppliers?.name || null,
          supplier_id: entry.supplier_id,
        }));

      const suggestedQuantity = Math.max(minQty - product.quantity, 0);
      if (suggestedQuantity <= 0) return;

      suggestions.push({
        type: 'product',
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          min_quantity: minQty,
          max_quantity: maxQty,
          supplier_id: product.supplier_id,
        },
        status: isCritical ? 'critical' : 'low',
        suggestedQuantity,
        lastPurchases: productEntries,
      });
    });

    // Add EPIs with low stock
    epis.forEach((epi) => {
      const minQty = epi.min_quantity || 5;
      
      const isCritical = epi.quantity <= minQty * 0.5;
      const isLow = epi.quantity <= minQty && !isCritical;
      
      if (!isCritical && !isLow) return;

      const suggestedQuantity = Math.max(minQty - epi.quantity, 0);
      if (suggestedQuantity <= 0) return;

      suggestions.push({
        type: 'epi',
        product: {
          id: epi.id,
          name: epi.name,
          sku: epi.ca_number,
          quantity: epi.quantity,
          min_quantity: minQty,
          max_quantity: null,
          supplier_id: null,
        },
        status: isCritical ? 'critical' : 'low',
        suggestedQuantity,
        lastPurchases: [],
      });
    });

    // Sort: critical first, then by quantity
    return suggestions.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1;
      if (a.status !== 'critical' && b.status === 'critical') return 1;
      return a.product.quantity - b.product.quantity;
    });
  }, [products, entries, epis]);

  // Filtrar sugestões
  const filteredSuggestions = useMemo(() => {
    return purchaseSuggestions.filter((suggestion) => {
      const matchesSearch =
        suggestion.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || suggestion.status === statusFilter;

      const matchesType =
        typeFilter === "all" || suggestion.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [purchaseSuggestions, searchTerm, statusFilter, typeFilter]);

  const toggleRow = (productId: string) => {
    setExpandedRow(expandedRow === productId ? null : productId);
  };

  const handleConfirmPurchase = (suggestion: PurchaseSuggestion) => {
    setSelectedProduct(suggestion);
    setPurchaseQuantity(suggestion.suggestedQuantity);
    const bestPrice = getBestPrice(suggestion.lastPurchases);
    setPurchasePrice(bestPrice?.unit_price?.toString() || "");
    setPurchaseSupplierId(bestPrice?.supplier_id || suggestion.product.supplier_id || "");
    setConfirmDialogOpen(true);
  };

  const handleRejectPurchase = (suggestion: PurchaseSuggestion) => {
    setSelectedProduct(suggestion);
    setRejectDialogOpen(true);
  };

  const { createEntry } = useEntries();

  const confirmPurchase = async () => {
    if (selectedProduct && purchaseQuantity > 0) {
      try {
        // Registrar a entrada
        await createEntry.mutateAsync({
          product_id: selectedProduct.product.id,
          quantity: purchaseQuantity,
          unit_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
          total_price: purchasePrice ? parseFloat(purchasePrice) * purchaseQuantity : undefined,
          supplier_id: purchaseSupplierId || undefined,
          entry_date: new Date().toISOString(),
        });

        const newStock = selectedProduct.product.quantity + purchaseQuantity;
        const minQty = selectedProduct.product.min_quantity || 10;
        
        if (newStock >= minQty) {
          toast({
            title: "Compra registrada!",
            description: `${purchaseQuantity} unidades de ${selectedProduct.product.name} adicionadas ao estoque. Estoque normalizado!`,
          });
        } else {
          const remaining = minQty - newStock;
          toast({
            title: "Compra registrada!",
            description: `${purchaseQuantity} unidades adicionadas. Ainda faltam ${remaining} unidades para atingir o estoque mínimo.`,
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao registrar compra",
          description: "Ocorreu um erro ao registrar a entrada.",
          variant: "destructive",
        });
      }
    }
    setConfirmDialogOpen(false);
    setSelectedProduct(null);
    setPurchaseQuantity(0);
    setPurchasePrice("");
    setPurchaseSupplierId("");
  };

  const rejectPurchase = () => {
    if (selectedProduct) {
      toast({
        title: "Compra rejeitada",
        description: `Sugestão de compra de ${selectedProduct.product.name} foi rejeitada.`,
        variant: "destructive",
      });
    }
    setRejectDialogOpen(false);
    setSelectedProduct(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "—";
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "—";
  };

  const getBestPrice = (lastPurchases: PurchaseSuggestion['lastPurchases']) => {
    if (lastPurchases.length === 0) return null;
    const pricesWithValues = lastPurchases.filter((p) => p.unit_price);
    if (pricesWithValues.length === 0) return null;
    return pricesWithValues.reduce((min, p) => 
      (p.unit_price || 0) < (min.unit_price || Infinity) ? p : min
    );
  };

  const renderCell = (suggestion: PurchaseSuggestion, columnKey: string) => {
    const bestPrice = getBestPrice(suggestion.lastPurchases);

    switch (columnKey) {
      case "type":
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              suggestion.type === 'epi' 
                ? "bg-primary/20 text-primary border-primary/30" 
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {suggestion.type === 'epi' ? 'EPI' : 'Produto'}
          </Badge>
        );
      case "status":
        return (
          <Badge
            variant={suggestion.status === 'critical' ? 'destructive' : 'secondary'}
            className={cn(
              "font-medium",
              suggestion.status === 'critical' 
                ? "bg-destructive/20 text-destructive border-destructive/30" 
                : "bg-warning/20 text-warning border-warning/30"
            )}
          >
            {suggestion.status === 'critical' ? (
              <><AlertTriangle className="w-3 h-3 mr-1" /> Crítico</>
            ) : (
              <><TrendingDown className="w-3 h-3 mr-1" /> Baixo</>
            )}
          </Badge>
        );
      case "sku":
        return (
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {suggestion.product.sku || "—"}
          </span>
        );
      case "product":
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">{suggestion.product.name}</span>
          </div>
        );
      case "current_stock":
        return (
          <span className={cn(
            "font-semibold",
            suggestion.status === 'critical' ? "text-destructive" : "text-warning"
          )}>
            {suggestion.product.quantity}
          </span>
        );
      case "min_stock":
        return suggestion.product.min_quantity || 10;
      case "suggested_qty":
        return (
          <span className="font-semibold text-success">
            +{suggestion.suggestedQuantity}
          </span>
        );
      case "last_price":
        return bestPrice?.unit_price 
          ? formatCurrency(bestPrice.unit_price) 
          : "—";
      case "supplier":
        return bestPrice?.supplier_name || getSupplierName(suggestion.product.supplier_id);
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmPurchase(suggestion);
              }}
              title="Confirmar compra"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                handleRejectPurchase(suggestion);
              }}
              title="Rejeitar sugestão"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return "—";
    }
  };

  if (loadingProducts || loadingEPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const criticalCount = purchaseSuggestions.filter((s) => s.status === 'critical').length;
  const lowCount = purchaseSuggestions.filter((s) => s.status === 'low').length;
  const epiCount = purchaseSuggestions.filter((s) => s.type === 'epi').length;
  const productCount = purchaseSuggestions.filter((s) => s.type === 'product').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Compras"
        description="Gerencie sugestões de compras e ordens de compra"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Compras" }]}
        actions={
          <div className="flex items-center gap-2">
            {/* Menu Cascata para Ordens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ordens</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setOrdersListDialogOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Consultar Ordens
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setOrderDialogOpen(true)}
                  disabled={filteredSuggestions.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Nova Ordem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Relatório</span>
            </Button>
            <ColumnSettings
              columns={columns}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetToDefaults}
            />
          </div>
        }
      />
      
      {/* Tabs para alternar entre Sugestões e Dashboard */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sugestoes" | "dashboard")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sugestoes" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sugestoes" className="mt-4 space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{purchaseSuggestions.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Crítico</p>
            <p className="text-xl sm:text-2xl font-bold text-destructive">{criticalCount}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Baixo</p>
            <p className="text-xl sm:text-2xl font-bold text-warning">{lowCount}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Valor Est.</p>
            <p className="text-lg sm:text-xl font-bold">
              {formatCurrency(
                purchaseSuggestions.reduce((total, s) => {
                  const bestPrice = getBestPrice(s.lastPurchases);
                  return total + (bestPrice?.unit_price || 0) * s.suggestedQuantity;
                }, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <DataFilters
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar por produto ou SKU..."
          onClearFilters={clearFilters}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="flex-1 sm:flex-none"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "critical" ? "destructive" : "outline"}
            onClick={() => setStatusFilter("critical")}
            className={cn(
              "flex-1 sm:flex-none",
              statusFilter === "critical" ? "" : "text-destructive border-destructive/50 hover:bg-destructive/10"
            )}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Críticos ({criticalCount})
          </Button>
          <Button
            variant={statusFilter === "low" ? "secondary" : "outline"}
            onClick={() => setStatusFilter("low")}
            className={cn(
              "flex-1 sm:flex-none",
              statusFilter === "low" ? "bg-warning/20 text-warning hover:bg-warning/30" : "text-warning border-warning/50 hover:bg-warning/10"
            )}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Baixos ({lowCount})
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            onClick={() => setTypeFilter("all")}
            size="sm"
          >
            Todos os Tipos
          </Button>
          <Button
            variant={typeFilter === "product" ? "secondary" : "outline"}
            onClick={() => setTypeFilter("product")}
            size="sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Produtos ({productCount})
          </Button>
          <Button
            variant={typeFilter === "epi" ? "secondary" : "outline"}
            onClick={() => setTypeFilter("epi")}
            size="sm"
            className={typeFilter === "epi" ? "bg-primary/20 text-primary" : ""}
          >
            EPIs ({epiCount})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                {visibleColumns.map((col) => (
                  <TableHead key={col.key} className="text-muted-foreground font-medium">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuggestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 opacity-50" />
                      <p>Nenhum produto com estoque baixo ou crítico</p>
                      <p className="text-sm">Todos os produtos estão com estoque adequado!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <>
                    <TableRow
                      key={suggestion.product.id}
                      className={cn(
                        "border-border cursor-pointer transition-colors",
                        suggestion.status === 'critical' && "bg-destructive/5",
                        suggestion.status === 'low' && "bg-warning/5",
                        expandedRow === suggestion.product.id && "bg-secondary/50"
                      )}
                      onClick={() => toggleRow(suggestion.product.id)}
                    >
                      <TableCell className="w-10">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expandedRow === suggestion.product.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell key={col.key}>
                          {renderCell(suggestion, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedRow === suggestion.product.id && (
                      <TableRow key={`${suggestion.product.id}-details`} className="bg-secondary/30 border-border">
                        <TableCell colSpan={visibleColumns.length + 1}>
                          <div className="py-4 px-2">
                            <div className="flex items-center gap-2 mb-3">
                              <History className="w-4 h-4 text-muted-foreground" />
                              <h4 className="font-medium text-sm">Histórico de Compras</h4>
                            </div>
                            {suggestion.lastPurchases.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhum histórico de compra encontrado para este produto.
                              </p>
                            ) : (
                              <div className="grid gap-2">
                                {suggestion.lastPurchases.map((purchase, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Truck className="w-4 h-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {purchase.supplier_name || "Fornecedor não informado"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(purchase.date), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-sm">
                                        {purchase.unit_price ? formatCurrency(purchase.unit_price) : "—"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {purchase.quantity} unidades
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-4">
          <PurchasesDashboard />
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              Registrar Compra
            </DialogTitle>
            <DialogDescription>
              Informe os detalhes da compra realizada
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-success" />
                  <div>
                    <p className="font-semibold">{selectedProduct.product.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedProduct.product.sku || "Sem SKU"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm p-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Estoque Atual</p>
                  <p className="font-semibold text-destructive">{selectedProduct.product.quantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Mínimo</p>
                  <p className="font-semibold">{selectedProduct.product.min_quantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Sugerido</p>
                  <p className="font-semibold text-success">+{selectedProduct.suggestedQuantity}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade Comprada *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(e.target.value === "" ? 0 : parseInt(e.target.value))}
                    placeholder="Quantidade"
                  />
                  {purchaseQuantity > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Novo estoque: {selectedProduct.product.quantity + purchaseQuantity} unidades
                      {selectedProduct.product.quantity + purchaseQuantity >= (selectedProduct.product.min_quantity || 10)
                        ? <span className="text-success ml-1">(estoque normalizado)</span>
                        : <span className="text-warning ml-1">(ainda abaixo do mínimo)</span>
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço Unitário (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0,00"
                  />
                  {purchasePrice && purchaseQuantity > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(parseFloat(purchasePrice) * purchaseQuantity)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Select value={purchaseSupplierId} onValueChange={setPurchaseSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmPurchase} 
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={purchaseQuantity <= 0 || createEntry.isPending}
            >
              {createEntry.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Registrar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              Rejeitar Sugestão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar esta sugestão de compra?
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-destructive" />
                <div>
                  <p className="font-semibold">{selectedProduct.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: {selectedProduct.product.quantity} unidades
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={rejectPurchase}>
              <X className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchases Report Dialog */}
      <GenericReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        title="Relatório de Compras Sugeridas"
        subtitle={`${filteredSuggestions.length} itens precisam de reposição`}
        fileName="relatorio-compras"
        metadata={[
          { label: "Data", value: format(new Date(), "dd/MM/yyyy", { locale: ptBR }) },
          { label: "Total Sugestões", value: String(purchaseSuggestions.length) },
          { label: "Críticos", value: String(criticalCount) },
          { label: "Estoque Baixo", value: String(lowCount) },
        ]}
        summaries={[
          { label: "Total Sugestões", value: purchaseSuggestions.length, color: "primary" },
          { label: "Crítico", value: criticalCount, color: "destructive" },
          { label: "Baixo", value: lowCount, color: "warning" },
          { 
            label: "Valor Estimado", 
            value: formatCurrency(purchaseSuggestions.reduce((total, s) => {
              const bestPrice = getBestPrice(s.lastPurchases);
              return total + (bestPrice?.unit_price || 0) * s.suggestedQuantity;
            }, 0)), 
            color: "success" 
          },
        ]}
        columns={[
          { key: "type", header: "Tipo", format: (_, row) => row.type === 'epi' ? 'EPI' : 'Produto' },
          { key: "product", header: "Item", format: (_, row) => row.product.name },
          { key: "status", header: "Status", format: (_, row) => row.status === 'critical' ? 'Crítico' : 'Baixo' },
          { key: "current", header: "Atual", align: "center", format: (_, row) => String(row.product.quantity) },
          { key: "min", header: "Mínimo", align: "center", format: (_, row) => String(row.product.min_quantity || 10) },
          { key: "suggested", header: "Sugerido", align: "center", format: (_, row) => `+${row.suggestedQuantity}` },
          { key: "price", header: "Últ. Preço", align: "right", format: (_, row) => {
            const best = getBestPrice(row.lastPurchases);
            return best?.unit_price ? formatCurrency(best.unit_price) : "—";
          }},
          { key: "total", header: "Total Est.", align: "right", format: (_, row) => {
            const best = getBestPrice(row.lastPurchases);
            return best?.unit_price ? formatCurrency(best.unit_price * row.suggestedQuantity) : "—";
          }},
        ]}
        data={filteredSuggestions}
      />

      {/* Purchase Order Dialog */}
      <PurchaseOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        suggestions={filteredSuggestions}
      />

      {/* Purchase Orders List Dialog */}
      <PurchaseOrdersListDialog
        open={ordersListDialogOpen}
        onOpenChange={setOrdersListDialogOpen}
      />
    </div>
  );
}
