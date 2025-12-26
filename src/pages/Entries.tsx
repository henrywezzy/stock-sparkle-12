import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit, Trash2, ArrowDownToLine, Calendar, Loader2, X, Package, Hash } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntries, Entry, EntryFormData } from "@/hooks/useEntries";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataFilters } from "@/components/filters/DataFilters";
import { useToast } from "@/hooks/use-toast";

// Função para gerar SKU automático
const generateSKU = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PRD-${timestamp.slice(-4)}${random}`;
};

export default function Entries() {
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useEntries();
  const { products, createProduct } = useProducts();
  const { suppliers } = useSuppliers();
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  // Buscar produto por SKU
  const searchProductBySKU = (sku: string) => {
    if (!sku.trim()) {
      setFoundProduct(null);
      setIsNewProduct(false);
      return;
    }
    
    setIsSearching(true);
    const product = products.find(
      (p) => p.sku?.toLowerCase() === sku.toLowerCase()
    );
    
    if (product) {
      setFoundProduct(product);
      setFormData((prev) => ({ ...prev, product_id: product.id }));
      setIsNewProduct(false);
      toast({
        title: "Produto encontrado!",
        description: `${product.name} (${product.sku})`,
      });
    } else {
      setFoundProduct(null);
      setIsNewProduct(false);
      toast({
        title: "Produto não encontrado",
        description: "Nenhum produto com este ID foi encontrado.",
        variant: "destructive",
      });
    }
    setIsSearching(false);
  };

  // Buscar produto por nome (autocomplete)
  const filteredProducts = useMemo(() => {
    if (!productNameSearch.trim()) return [];
    return products.filter((p) =>
      p.name.toLowerCase().includes(productNameSearch.toLowerCase())
    ).slice(0, 5);
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
    setFormData((prev) => ({ ...prev, product_id: "" }));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.received_by?.toLowerCase().includes(searchTerm.toLowerCase());

      const entryDate = new Date(entry.entry_date);
      const matchesDateFrom = !dateFrom || entryDate >= dateFrom;
      const matchesDateTo = !dateTo || entryDate <= dateTo;
      const matchesSupplier = selectedSupplier === "all" || entry.supplier_id === selectedSupplier;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesSupplier;
    });
  }, [entries, searchTerm, dateFrom, dateTo, selectedSupplier]);

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
    setProductSearchMode("name");
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
        const newSku = generateSKU();
        const newProduct = await createProduct.mutateAsync({
          name: productNameSearch.trim(),
          sku: newSku,
          quantity: 0, // Será atualizado pela entrada
          supplier_id: formData.supplier_id || undefined,
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
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedSupplier("all");
  };

  const columns = [
    {
      key: "date",
      header: "Data",
      render: (entry: Entry) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <span className="text-sm">{format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: "product",
      header: "Produto",
      render: (entry: Entry) => {
        const product = products.find((p) => p.id === entry.product_id);
        return (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-4 h-4 text-success" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">
                {entry.products?.name || "—"}
              </span>
              {product?.sku && (
                <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "quantity",
      header: "Qtd",
      render: (entry: Entry) => (
        <span className="font-semibold text-success">+{entry.quantity}</span>
      ),
    },
    {
      key: "supplier",
      header: "Fornecedor",
      className: "hidden md:table-cell",
      render: (entry: Entry) => entry.suppliers?.name || "—",
    },
    {
      key: "received_by",
      header: "Responsável",
      className: "hidden lg:table-cell",
      render: (entry: Entry) => entry.received_by || "—",
    },
    {
      key: "actions",
      header: "",
      render: (entry: Entry) => (
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
      ),
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Entradas"
        description="Registre e gerencie todas as entradas de produtos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Entradas" }]}
        actions={
          canEdit && (
            <Button
              className="gradient-primary text-primary-foreground glow-sm"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Entrada</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )
        }
      />

      {/* Filters */}
      <DataFilters
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por produto, fornecedor..."
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
            <p className="text-xl sm:text-2xl font-bold">{entries.reduce((acc, e) => acc + e.quantity, 0)}</p>
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
      <div className="overflow-x-auto">
        <DataTable columns={columns} data={filteredEntries} />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Editar Entrada" : "Registrar Nova Entrada"}</DialogTitle>
            <DialogDescription>
              {editingEntry ? "Altere as informações da entrada" : "Busque por ID ou nome do produto, ou cadastre um novo"}
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

            {/* Product Search by ID */}
            {productSearchMode === "id" && (
              <div className="grid gap-2">
                <Label htmlFor="product_id">ID do Produto (SKU)</Label>
                <div className="flex gap-2">
                  <Input
                    id="product_id"
                    value={productIdSearch}
                    onChange={(e) => setProductIdSearch(e.target.value.toUpperCase())}
                    placeholder="Ex: PRD-A1B2XYZ"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    onClick={() => searchProductBySKU(productIdSearch)}
                    disabled={isSearching || !productIdSearch.trim()}
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
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

            {/* New Product Indicator */}
            {isNewProduct && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <Plus className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Novo produto será criado</p>
                  <p className="text-xs text-muted-foreground">
                    "{productNameSearch}" • Um ID será gerado automaticamente
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price">Preço Unitário</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price || ""}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
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
              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita e o estoque do produto será ajustado.
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
    </div>
  );
}