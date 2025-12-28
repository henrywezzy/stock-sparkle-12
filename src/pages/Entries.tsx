import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, ArrowDownToLine, Calendar, Loader2, X, Package, Hash, Zap, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GenericReportDialog, ReportColumn, ReportSummary } from "@/components/reports/GenericReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntries, Entry, EntryFormData } from "@/hooks/useEntries";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { ColumnSettings } from "@/components/ui/column-settings";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/currency";
import { QuickEntryDialog } from "@/components/entries/QuickEntryDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataFilters } from "@/components/filters/DataFilters";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Colunas padrão para a tabela
const DEFAULT_COLUMNS = [
  { key: "date", label: "Data", visible: true },
  { key: "sku", label: "ID (SKU)", visible: true },
  { key: "product", label: "Produto", visible: true },
  { key: "quantity", label: "Quantidade", visible: true },
  { key: "unit_price", label: "Preço Unit.", visible: true },
  { key: "total", label: "Total", visible: true },
  { key: "supplier", label: "Fornecedor", visible: true },
  { key: "invoice", label: "Nota Fiscal", visible: false },
  { key: "received_by", label: "Responsável", visible: false },
  { key: "notes", label: "Observações", visible: false },
  { key: "actions", label: "Ações", visible: true },
];

// Função para gerar SKU no formato CATEGORIA-TIPO-VALOR-LOTE
const generateSKU = (
  categoryName?: string,
  productName?: string,
  variant?: string,
  batchNumber?: number
) => {
  const sanitize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 4);

  const category = categoryName ? sanitize(categoryName) : "GER";
  const type = productName ? sanitize(productName) : "PROD";
  const value = variant ? sanitize(variant) : "STD";
  const batch = String(batchNumber || Math.floor(Math.random() * 999) + 1).padStart(3, "0");

  return `${category}-${type}-${value}-${batch}`;
};

export default function Entries() {
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useEntries();
  const { products, createProduct } = useProducts();
  const { suppliers } = useSuppliers();
  const { categories } = useCategories();
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  const {
    columns,
    visibleColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useColumnPreferences("entries", DEFAULT_COLUMNS);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");

  // Product search state
  const [productSearchMode, setProductSearchMode] = useState<"id" | "name">("name");
  const [productIdSearch, setProductIdSearch] = useState("");
  const [productNameSearch, setProductNameSearch] = useState("");
  const [foundProduct, setFoundProduct] = useState<typeof products[0] | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // New product fields
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductVariant, setNewProductVariant] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");

  // SKU autocomplete for ID search
  const filteredProductsBySKU = useMemo(() => {
    if (!productIdSearch.trim()) return [];
    return products
      .filter((p) => p.sku?.toLowerCase().startsWith(productIdSearch.toLowerCase()))
      .slice(0, 8);
  }, [products, productIdSearch]);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);

  // Form state
  const [formData, setFormData] = useState<EntryFormData>({
    product_id: "",
    supplier_id: "",
    quantity: 0,
    unit_price: 0,
    received_by: "",
    invoice_number: "",
    notes: "",
  });

  // Select product from SKU suggestions
  const selectProductFromSKU = (product: typeof products[0]) => {
    setFoundProduct(product);
    setProductIdSearch(product.sku || "");
    setFormData((prev) => ({ ...prev, product_id: product.id }));
    setIsNewProduct(false);
    setShowSkuSuggestions(false);
    toast({
      title: "Produto encontrado!",
      description: `${product.name} (${product.sku})`,
    });
  };

  // Buscar produto por nome (autocomplete)
  const filteredProducts = useMemo(() => {
    if (!productNameSearch.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(productNameSearch.toLowerCase()))
      .slice(0, 5);
  }, [products, productNameSearch]);

  const selectProduct = (product: typeof products[0]) => {
    setFoundProduct(product);
    setProductNameSearch(product.name);
    setFormData((prev) => ({ ...prev, product_id: product.id }));
    setIsNewProduct(false);
  };

  const createNewProduct = () => {
    if (!productNameSearch.trim()) return;
    setIsNewProduct(true);
    setFoundProduct(null);
    setFormData((prev) => ({ ...prev, product_id: "" }));
  };

  const clearProductSelection = () => {
    setFoundProduct(null);
    setProductIdSearch("");
    setProductNameSearch("");
    setIsNewProduct(false);
    setNewProductCategory("");
    setNewProductVariant("");
    setFormData((prev) => ({ ...prev, product_id: "" }));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const product = products.find((p) => p.id === entry.product_id);
      const matchesSearch =
        entry.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.received_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const entryDate = new Date(entry.entry_date);
      const matchesDateFrom = !dateFrom || entryDate >= dateFrom;
      const matchesDateTo = !dateTo || entryDate <= dateTo;
      const matchesSupplier = selectedSupplier === "all" || entry.supplier_id === selectedSupplier;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesSupplier;
    });
  }, [entries, products, searchTerm, dateFrom, dateTo, selectedSupplier]);

  const resetForm = () => {
    setFormData({
      product_id: "",
      supplier_id: "",
      quantity: 0,
      unit_price: 0,
      received_by: "",
      invoice_number: "",
      notes: "",
    });
    setEditingEntry(null);
    setFoundProduct(null);
    setProductIdSearch("");
    setProductNameSearch("");
    setIsNewProduct(false);
    setNewProductCategory("");
    setNewProductVariant("");
    setNewProductUnit("un");
    setProductSearchMode("name");
    setShowSkuSuggestions(false);
  };

  const handleOpenDialog = (entry?: Entry) => {
    if (entry) {
      setEditingEntry(entry);
      const product = products.find((p) => p.id === entry.product_id);
      setFoundProduct(product || null);
      setProductNameSearch(product?.name || "");
      setProductIdSearch(product?.sku || "");
      setFormData({
        product_id: entry.product_id,
        supplier_id: entry.supplier_id || "",
        quantity: entry.quantity,
        unit_price: entry.unit_price || 0,
        received_by: entry.received_by || "",
        invoice_number: entry.invoice_number || "",
        notes: entry.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (formData.quantity <= 0) return;

    let productId = formData.product_id;

    // Se é um novo produto, criar primeiro
    if (isNewProduct && productNameSearch.trim()) {
      try {
        const categoryObj = categories.find((c) => c.id === newProductCategory);
        const newSku = generateSKU(
          categoryObj?.name,
          productNameSearch,
          newProductVariant
        );

        const newProduct = await createProduct.mutateAsync({
          name: productNameSearch.trim(),
          sku: newSku,
          quantity: 0,
          category_id: newProductCategory || undefined,
          supplier_id: formData.supplier_id || undefined,
          unit: newProductUnit,
        });
        productId = newProduct.id;

        toast({
          title: "Novo produto criado!",
          description: `${productNameSearch} foi cadastrado com ID: ${newSku}`,
        });
      } catch (error) {
        toast({
          title: "Erro ao criar produto",
          description: "Não foi possível cadastrar o novo produto.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!productId) {
      toast({
        title: "Selecione um produto",
        description: "Busque por ID ou nome, ou crie um novo produto.",
        variant: "destructive",
      });
      return;
    }

    const total = (formData.unit_price || 0) * formData.quantity;

    if (editingEntry) {
      await updateEntry.mutateAsync({
        id: editingEntry.id,
        ...formData,
        product_id: productId,
        total_price: total,
      });
    } else {
      await createEntry.mutateAsync({
        ...formData,
        product_id: productId,
        total_price: total,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingEntryId) return;
    await deleteEntry.mutateAsync(deletingEntryId);
    setIsDeleteDialogOpen(false);
    setDeletingEntryId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingEntryId(id);
    setIsDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedSupplier("all");
  };

  const renderCell = (entry: Entry, columnKey: string) => {
    const product = products.find((p) => p.id === entry.product_id);

    switch (columnKey) {
      case "date":
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        );
      case "sku":
        return (
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {product?.sku || "—"}
          </span>
        );
      case "product":
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-4 h-4 text-success" />
            </div>
            <span className="font-medium text-sm">{entry.products?.name || "—"}</span>
          </div>
        );
      case "quantity":
        return <span className="font-semibold text-success">+{entry.quantity}</span>;
      case "unit_price":
        return entry.unit_price
          ? formatCurrency(entry.unit_price)
          : "—";
      case "total":
        return entry.total_price
          ? formatCurrency(entry.total_price)
          : "—";
      case "supplier":
        return entry.suppliers?.name || "—";
      case "invoice":
        return entry.invoice_number || "—";
      case "received_by":
        return entry.received_by || "—";
      case "notes":
        return entry.notes ? (
          <span className="max-w-[150px] truncate block" title={entry.notes}>
            {entry.notes}
          </span>
        ) : (
          "—"
        );
      case "actions":
        return (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => handleOpenDialog(entry)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => openDeleteDialog(entry.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      default:
        return "—";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Entradas"
        description="Registre e gerencie todas as entradas de produtos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Entradas" }]}
        actions={
          <div className="flex items-center gap-2">
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
            {canEdit && (
              <>
                <QuickEntryDialog
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">Rápida</span>
                    </Button>
                  }
                />
                <Button
                  className="gradient-primary text-primary-foreground glow-sm"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nova Entrada</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Filters */}
      <DataFilters
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por produto, SKU, fornecedor..."
        showDateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        showSupplierFilter
        suppliers={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        onClearFilters={clearFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{entries.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl font-bold text-warning">∑</span>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Itens</p>
            <p className="text-xl sm:text-2xl font-bold">
              {entries.reduce((acc, e) => acc + e.quantity, 0)}
            </p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Filtrados</p>
            <p className="text-xl sm:text-2xl font-bold">{filteredEntries.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {visibleColumns.map((col) => (
                  <TableHead key={col.key} className="text-muted-foreground">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma entrada encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-border">
                    {visibleColumns.map((col) => (
                      <TableCell key={`${entry.id}-${col.key}`}>
                        {renderCell(entry, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Editar Entrada" : "Registrar Nova Entrada"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Altere as informações da entrada"
                : "Busque por ID ou nome do produto, ou cadastre um novo"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Product Search Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={productSearchMode === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setProductSearchMode("name");
                  clearProductSelection();
                }}
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Por Nome
              </Button>
              <Button
                type="button"
                variant={productSearchMode === "id" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setProductSearchMode("id");
                  clearProductSelection();
                }}
                className="flex-1"
              >
                <Hash className="w-4 h-4 mr-2" />
                Por ID (SKU)
              </Button>
            </div>

            {/* Product Search by ID with Autocomplete */}
            {productSearchMode === "id" && (
              <div className="grid gap-2">
                <Label htmlFor="product_id">ID do Produto (SKU)</Label>
                <div className="relative">
                  <Input
                    id="product_id"
                    value={productIdSearch}
                    onChange={(e) => {
                      setProductIdSearch(e.target.value.toUpperCase());
                      setShowSkuSuggestions(true);
                      setFoundProduct(null);
                      setFormData((prev) => ({ ...prev, product_id: "" }));
                    }}
                    onFocus={() => setShowSkuSuggestions(true)}
                    placeholder="Digite o início do SKU..."
                    className="font-mono"
                  />
                  {showSkuSuggestions && productIdSearch && !foundProduct && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredProductsBySKU.length > 0 ? (
                        filteredProductsBySKU.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProductFromSKU(product)}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium">{product.sku}</span>
                              <span className="text-xs text-muted-foreground">{product.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Estoque: {product.quantity}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          Nenhum produto encontrado com este SKU
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Search by Name */}
            {productSearchMode === "name" && (
              <div className="grid gap-2">
                <Label htmlFor="product_name">Nome do Produto *</Label>
                <div className="relative">
                  <Input
                    id="product_name"
                    value={productNameSearch}
                    onChange={(e) => {
                      setProductNameSearch(e.target.value);
                      setFoundProduct(null);
                      setIsNewProduct(false);
                      setFormData((prev) => ({ ...prev, product_id: "" }));
                    }}
                    placeholder="Digite o nome do produto..."
                  />
                  {productNameSearch && !foundProduct && !isNewProduct && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        <>
                          {filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => selectProduct(product)}
                              className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium">{product.name}</span>
                                {product.sku && (
                                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                                    {product.sku}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Estoque: {product.quantity}
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={createNewProduct}
                            className="w-full px-4 py-2 text-left hover:bg-muted border-t border-border flex items-center gap-2 text-primary"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Criar novo produto: "{productNameSearch}"</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={createNewProduct}
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-primary"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Criar novo produto: "{productNameSearch}"</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Product Display */}
            {foundProduct && (
              <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Package className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{foundProduct.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {foundProduct.sku || "Sem ID"} • Estoque atual: {foundProduct.quantity}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearProductSelection}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* New Product Fields */}
            {isNewProduct && (
              <>
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <Plus className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Novo produto será criado</p>
                    <p className="text-xs text-muted-foreground">
                      "{productNameSearch}" • SKU será gerado automaticamente
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearProductSelection}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newProductCategory}
                      onValueChange={setNewProductCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
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
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unidade de Medida</Label>
                    <Select
                      value={newProductUnit}
                      onValueChange={setNewProductUnit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="mm">Milímetro</SelectItem>
                        <SelectItem value="cm">Centímetro</SelectItem>
                        <SelectItem value="kg">Quilograma</SelectItem>
                        <SelectItem value="g">Grama</SelectItem>
                        <SelectItem value="l">Litro</SelectItem>
                        <SelectItem value="ml">Mililitro</SelectItem>
                        <SelectItem value="cx">Caixa</SelectItem>
                        <SelectItem value="pc">Peça</SelectItem>
                        <SelectItem value="par">Par</SelectItem>
                        <SelectItem value="rolo">Rolo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="variant">Variante/Tamanho</Label>
                  <Input
                    id="variant"
                    value={newProductVariant}
                    onChange={(e) => setNewProductVariant(e.target.value)}
                    placeholder="Ex: P, M, G, 100ml, 500g"
                  />
                </div>

                {/* SKU Preview */}
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">SKU gerado:</p>
                  <p className="font-mono text-sm font-medium">
                    {generateSKU(
                      categories.find((c) => c.id === newProductCategory)?.name,
                      productNameSearch,
                      newProductVariant
                    )}
                  </p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setFormData({ ...formData, quantity: value === "" ? 0 : parseInt(value) });
                    }
                  }}
                  placeholder="Quantidade"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price">Preço Unitário</Label>
                <CurrencyInput
                  id="unit_price"
                  value={formData.unit_price || 0}
                  onChange={(value) =>
                    setFormData({ ...formData, unit_price: value })
                  }
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="received_by">Responsável</Label>
                <Input
                  id="received_by"
                  value={formData.received_by || ""}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice">Nota Fiscal</Label>
                <Input
                  id="invoice"
                  value={formData.invoice_number || ""}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Número da NF"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={
                (!formData.product_id && !isNewProduct) ||
                formData.quantity <= 0 ||
                createEntry.isPending ||
                updateEntry.isPending ||
                createProduct.isPending
              }
            >
              {(createEntry.isPending || updateEntry.isPending || createProduct.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingEntry ? "Salvar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita e
              o estoque do produto será ajustado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEntry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Entries Report Dialog */}
      <GenericReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        title="Relatório de Entradas"
        subtitle={`Total de ${filteredEntries.length} entradas registradas`}
        fileName="relatorio-entradas"
        metadata={[
          { label: "Data", value: format(new Date(), "dd/MM/yyyy", { locale: ptBR }) },
          { label: "Total Entradas", value: String(entries.length) },
          { label: "Itens Recebidos", value: String(entries.reduce((acc, e) => acc + e.quantity, 0)) },
          { label: "Valor Total", value: formatCurrency(entries.reduce((acc, e) => acc + (e.total_price || 0), 0)) },
        ]}
        summaries={[
          { label: "Total Entradas", value: entries.length, color: "primary" },
          { label: "Itens", value: entries.reduce((acc, e) => acc + e.quantity, 0), color: "success" },
          { label: "Valor Total", value: formatCurrency(entries.reduce((acc, e) => acc + (e.total_price || 0), 0)), color: "warning" },
        ]}
        columns={[
          { key: "entry_date", header: "Data", format: (v) => format(new Date(v), "dd/MM/yyyy", { locale: ptBR }) },
          { key: "products", header: "Produto", format: (v) => v?.name || "—" },
          { key: "quantity", header: "Qtd.", align: "center" },
          { key: "unit_price", header: "Preço Unit.", align: "right", format: (v) => v ? formatCurrency(v) : "—" },
          { key: "total_price", header: "Total", align: "right", format: (v) => v ? formatCurrency(v) : "—" },
          { key: "suppliers", header: "Fornecedor", format: (v) => v?.name || "—" },
          { key: "invoice_number", header: "NF", format: (v) => v || "—" },
        ]}
        data={filteredEntries}
      />
    </div>
  );
}
