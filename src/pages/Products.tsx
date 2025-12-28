import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Package, Loader2, AlertTriangle, Calendar, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product, ProductFormData } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { ColumnSettings } from "@/components/ui/column-settings";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/currency";
import { GenericReportDialog, ReportColumn, ReportSummary } from "@/components/reports/GenericReportDialog";
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

// Colunas padrão para a tabela
const DEFAULT_COLUMNS = [
  { key: "sku", label: "ID (SKU)", visible: true },
  { key: "name", label: "Produto", visible: true },
  { key: "category", label: "Categoria", visible: true },
  { key: "quantity", label: "Quantidade", visible: true },
  { key: "min_quantity", label: "Qtd. Mínima", visible: false },
  { key: "unit", label: "Unidade", visible: true },
  { key: "price", label: "Preço Unit.", visible: true },
  { key: "location", label: "Localização", visible: true },
  { key: "supplier", label: "Fornecedor", visible: false },
  { key: "status", label: "Status", visible: true },
  { key: "updated_at", label: "Atualizado", visible: false },
  { key: "actions", label: "Ações", visible: true },
];

export default function Products() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { canEdit, canDelete, isViewer } = useAuth();

  const {
    columns,
    visibleColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useColumnPreferences("products", DEFAULT_COLUMNS);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    brand: "",
    quantity: 0,
    min_quantity: 10,
    unit: "un",
    price: 0,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
      const matchesSupplier = selectedSupplier === "all" || p.supplier_id === selectedSupplier;

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [products, searchTerm, selectedCategory, selectedSupplier]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= (p.min_quantity || 10));
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.quantity * (p.price || 0)), 0);
  }, [products]);

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      quantity: 0,
      min_quantity: 10,
      unit: "un",
      price: 0,
    });
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || "",
        brand: product.brand || "",
        category_id: product.category_id || undefined,
        supplier_id: product.supplier_id || undefined,
        quantity: product.quantity,
        min_quantity: product.min_quantity || 10,
        unit: product.unit || "un",
        location: product.location || "",
        price: product.price || 0,
        description: product.description || "",
      });
    } else {
      resetForm();
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }
    
    if (formData.quantity === undefined || formData.quantity === null || isNaN(formData.quantity)) {
      errors.quantity = "Quantidade é obrigatória e deve ser um número";
    }
    
    if (formData.min_quantity === undefined || formData.min_quantity === null || isNaN(formData.min_quantity)) {
      errors.min_quantity = "Estoque mínimo é obrigatório e deve ser um número";
    }
    
    if (formData.price === undefined || formData.price === null || formData.price <= 0) {
      errors.price = "Preço é obrigatório e deve ser maior que zero";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Don't send SKU on create (it's auto-generated or not editable)
    const dataToSend = { ...formData };
    if (!editingProduct) {
      delete dataToSend.sku;
    }

    if (editingProduct) {
      // Remove sku from update as it should not be editable
      const { sku, ...updateData } = dataToSend;
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        ...updateData,
      });
    } else {
      await createProduct.mutateAsync(dataToSend);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingProductId) return;
    await deleteProduct.mutateAsync(deletingProductId);
    setIsDeleteDialogOpen(false);
    setDeletingProductId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingProductId(id);
    setIsDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSupplier("all");
  };

  const renderCell = (product: Product, columnKey: string) => {
    switch (columnKey) {
      case "sku":
        return (
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {product.sku || "—"}
          </span>
        );
      case "name":
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${product.categories?.color || '#3B82F6'}20` }}
            >
              <Package className="w-4 h-4" style={{ color: product.categories?.color || '#3B82F6' }} />
            </div>
            <div className="min-w-0">
              <span className="font-medium text-sm block truncate max-w-[200px]">{product.name}</span>
              {product.description && (
                <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                  {product.description}
                </span>
              )}
            </div>
          </div>
        );
      case "category":
        return product.categories?.name ? (
          <Badge 
            variant="secondary" 
            style={{ 
              backgroundColor: `${product.categories.color}20`, 
              color: product.categories.color 
            }}
          >
            {product.categories.name}
          </Badge>
        ) : "—";
      case "quantity":
        const isCriticalStock = product.quantity === 0;
        const isLowStock = product.quantity > 0 && product.quantity <= (product.min_quantity || 10);
        return (
          <span className={`font-semibold ${isCriticalStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-foreground'}`}>
            {product.quantity}
          </span>
        );
      case "min_quantity":
        return product.min_quantity || 10;
      case "unit":
        return product.unit || "un";
      case "price":
        return isViewer ? "—" : formatCurrency(product.price || 0);
      case "location":
        return product.location || "—";
      case "supplier":
        return product.suppliers?.name || "—";
      case "status":
        const critical = product.quantity === 0;
        const low = product.quantity > 0 && product.quantity <= (product.min_quantity || 10);
        return (
          <Badge
            className={
              critical
                ? "bg-destructive/20 text-destructive"
                : low
                ? "bg-warning/20 text-warning"
                : "bg-success/20 text-success"
            }
          >
            {critical ? "Crítico" : low ? "Baixo" : "Normal"}
          </Badge>
        );
      case "updated_at":
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(product.updated_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        );
      case "actions":
        return (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => handleOpenDialog(product)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => openDeleteDialog(product.id)}
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
        title="Produtos"
        description="Gerencie todos os produtos do almoxarifado"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Produtos" }]}
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
              <Button
                className="gradient-primary text-primary-foreground glow-sm"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <DataFilters
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por nome, SKU, categoria..."
        showCategoryFilter
        categories={categories.map((c) => ({ value: c.id, label: c.name }))}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showSupplierFilter
        suppliers={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        onClearFilters={clearFilters}
      />

      {/* Stats */}
      <div className={`grid gap-3 sm:gap-4 ${isViewer ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{products.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Estoque Baixo</p>
            <p className="text-xl sm:text-2xl font-bold">{lowStockProducts.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Categorias</p>
            <p className="text-xl sm:text-2xl font-bold">{categories.length}</p>
          </div>
        </div>
        {!isViewer && (
          <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <span className="text-lg sm:text-xl font-bold text-warning">R$</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
          {canEdit && (
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro produto
            </Button>
          )}
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  {visibleColumns.map((col) => (
                    <TableHead key={col.key} className="text-muted-foreground font-semibold">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-secondary/30 border-border/50 transition-colors"
                  >
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>
                        {renderCell(product, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Altere as informações do produto" : "Preencha as informações do produto"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Parafuso Phillips 6mm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU (ID)</Label>
                <Input
                  id="sku"
                  value={formData.sku || (editingProduct ? "" : "Gerado automaticamente")}
                  disabled
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand || ""}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Gedore, Starrett..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Label htmlFor="supplier">Fornecedor</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Estoque Atual *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setFormData({ ...formData, quantity: value === "" ? 0 : parseInt(value) });
                    }
                  }}
                  placeholder="0"
                  className={formErrors.quantity ? "border-destructive" : ""}
                />
                {formErrors.quantity && (
                  <span className="text-xs text-destructive">{formErrors.quantity}</span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStock">Estoque Mínimo *</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.min_quantity ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setFormData({ ...formData, min_quantity: value === "" ? 0 : parseInt(value) });
                    }
                  }}
                  placeholder="10"
                  className={formErrors.min_quantity ? "border-destructive" : ""}
                />
                {formErrors.min_quantity && (
                  <span className="text-xs text-destructive">{formErrors.min_quantity}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Unitário *</Label>
                <CurrencyInput
                  id="price"
                  value={formData.price || 0}
                  onChange={(value) => setFormData({ ...formData, price: value })}
                  className={formErrors.price ? "border-destructive" : ""}
                />
                {formErrors.price && (
                  <span className="text-xs text-destructive">{formErrors.price}</span>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: A1-P1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto..."
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
              disabled={!formData.name || createProduct.isPending || updateProduct.isPending}
            >
              {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Products Report Dialog */}
      <GenericReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        title="Relatório de Produtos"
        subtitle={`Total de ${filteredProducts.length} produtos no estoque`}
        fileName="relatorio-produtos"
        metadata={[
          { label: "Data", value: format(new Date(), "dd/MM/yyyy", { locale: ptBR }) },
          { label: "Total Produtos", value: String(products.length) },
          { label: "Estoque Baixo", value: String(lowStockProducts.length) },
          { label: "Categorias", value: String(categories.length) },
        ]}
        summaries={[
          { label: "Total Produtos", value: products.length, color: "primary" },
          { label: "Estoque Baixo", value: lowStockProducts.length, color: "destructive" },
          { label: "Valor Total", value: formatCurrency(totalValue), color: "success" },
          { label: "Categorias", value: categories.length, color: "muted" },
        ]}
        columns={[
          { key: "sku", header: "SKU" },
          { key: "name", header: "Produto" },
          { key: "category", header: "Categoria", format: (_, row) => row.categories?.name || "—" },
          { key: "quantity", header: "Qtd.", align: "center" },
          { key: "min_quantity", header: "Mín.", align: "center", format: (v) => String(v || 10) },
          { key: "price", header: "Preço", align: "right", format: (v) => formatCurrency(v || 0) },
          { key: "location", header: "Localização", format: (v) => v || "—" },
          { key: "status", header: "Status", format: (_, row) => {
            if (row.quantity === 0) return "Crítico";
            if (row.quantity <= (row.min_quantity || 10)) return "Baixo";
            return "Normal";
          }},
        ]}
        data={filteredProducts}
      />
    </div>
  );
}
