import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Package, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product, ProductFormData } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
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

export default function Products() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { canEdit, canDelete } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    quantity: 0,
    min_quantity: 10,
    unit: "un",
    price: 0,
  });

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= (p.min_quantity || 10));
  }, [products]);

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: 0,
      min_quantity: 10,
      unit: "un",
      price: 0,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || "",
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
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    if (editingProduct) {
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        ...formData,
      });
    } else {
      await createProduct.mutateAsync(formData);
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
          canEdit && (
            <Button
              className="gradient-primary text-primary-foreground glow-sm"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Categorias</p>
            <p className="text-xl sm:text-2xl font-bold">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
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
      </div>

      {/* Products Grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="glass rounded-xl p-4 sm:p-6 glass-hover animate-slide-up"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${product.categories?.color || '#3B82F6'}20` }}
                  >
                    <Package className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: product.categories?.color || '#3B82F6' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{product.sku || "Sem SKU"}</p>
                  </div>
                </div>
                <Badge
                  className={
                    product.quantity <= (product.min_quantity || 10)
                      ? "bg-destructive/20 text-destructive shrink-0"
                      : "bg-success/20 text-success shrink-0"
                  }
                >
                  {product.quantity <= (product.min_quantity || 10) ? "Baixo" : "Normal"}
                </Badge>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span>{product.categories?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">
                    {product.quantity} {product.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Localização:</span>
                  <span>{product.location || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-medium">R$ {(product.price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-muted-foreground hover:text-primary text-xs sm:text-sm"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => openDeleteDialog(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
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
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="PRD000"
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
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
                    <SelectItem value="kg">Quilograma</SelectItem>
                    <SelectItem value="l">Litro</SelectItem>
                    <SelectItem value="cx">Caixa</SelectItem>
                    <SelectItem value="pc">Peça</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.min_quantity || 10}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Unitário</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
        <AlertDialogContent>
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
    </div>
  );
}