import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Package, Loader2, HardHat, Shield, Users, ChevronRight, Building2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, Category, CategoryFormData } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useEPIs } from "@/hooks/useEPIs";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
import { useEPISuppliers } from "@/hooks/useEPISuppliers";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const colorOptions = [
  { value: "#3B82F6", name: "Azul" },
  { value: "#22C55E", name: "Verde" },
  { value: "#F97316", name: "Laranja" },
  { value: "#A855F7", name: "Roxo" },
  { value: "#06B6D4", name: "Ciano" },
  { value: "#EC4899", name: "Rosa" },
  { value: "#EAB308", name: "Amarelo" },
  { value: "#EF4444", name: "Vermelho" },
];

// EPI category colors
const epiCategoryColors: Record<string, string> = {
  "Proteção da Cabeça": "#F97316",
  "Proteção das Mãos": "#3B82F6",
  "Proteção Visual": "#06B6D4",
  "Proteção Auditiva": "#A855F7",
  "Proteção dos Pés": "#22C55E",
  "Proteção Respiratória": "#EC4899",
};

export default function Categories() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { products } = useProducts();
  const { epis, isLoading: isLoadingEPIs } = useEPIs();
  const { suppliers } = useSuppliers();
  const { allSupplierCategories } = useSupplierCategories();
  const { getSuppliersForEPICategory, setSuppliersForEPICategory } = useEPISuppliers();
  const { canEdit, canDelete } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEPISupplierDialogOpen, setIsEPISupplierDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [selectedEPICategory, setSelectedEPICategory] = useState<string | null>(null);
  const [selectedEPISuppliers, setSelectedEPISuppliers] = useState<string[]>([]);
  const [expandedEPICategory, setExpandedEPICategory] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Paginação
  const categoriesPagination = usePagination(filteredCategories, { itemsPerPage: 10 });

  // Group EPIs by category
  const episByCategory = useMemo(() => {
    const grouped: Record<string, typeof epis> = {};
    epis.forEach(epi => {
      const category = epi.category || "Sem categoria";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(epi);
    });
    return grouped;
  }, [epis]);

  const filteredEPICategories = useMemo(() => {
    return Object.entries(episByCategory).filter(([category]) =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [episByCategory, searchTerm]);

  // Paginação para EPIs
  const epiCategoriesPagination = usePagination(filteredEPICategories, { itemsPerPage: 10 });

  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  const getSuppliersForCategory = (categoryId: string) => {
    const supplierIds = allSupplierCategories
      .filter(sc => sc.category_id === categoryId)
      .map(sc => sc.supplier_id);
    return suppliers.filter(s => supplierIds.includes(s.id));
  };

  const getEPICategorySuppliers = (epiCategory: string) => {
    const supplierIds = getSuppliersForEPICategory(epiCategory);
    return suppliers.filter(s => supplierIds.includes(s.id));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color || "#3B82F6",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        ...formData,
      });
    } else {
      await createCategory.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingCategoryId) return;
    await deleteCategory.mutateAsync(deletingCategoryId);
    setIsDeleteDialogOpen(false);
    setDeletingCategoryId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingCategoryId(id);
    setIsDeleteDialogOpen(true);
  };

  const openEPISupplierDialog = (epiCategory: string) => {
    setSelectedEPICategory(epiCategory);
    setSelectedEPISuppliers(getSuppliersForEPICategory(epiCategory));
    setIsEPISupplierDialogOpen(true);
  };

  const handleSaveEPISuppliers = async () => {
    if (!selectedEPICategory) return;
    await setSuppliersForEPICategory.mutateAsync({
      epiCategory: selectedEPICategory,
      supplierIds: selectedEPISuppliers,
    });
    setIsEPISupplierDialogOpen(false);
    setSelectedEPICategory(null);
    setSelectedEPISuppliers([]);
  };

  const toggleEPISupplier = (supplierId: string) => {
    setSelectedEPISuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  if (isLoading || isLoadingEPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize seus produtos e EPIs por categorias"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Categorias" }]}
        actions={
          canEdit && (
            <Button
              className="gradient-primary text-primary-foreground glow-sm"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Categoria</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-secondary/50 border-border/50"
        />
      </div>

      {/* Tabs for Products and EPIs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="epis" className="flex items-center gap-2">
            <HardHat className="w-4 h-4" />
            EPIs ({Object.keys(episByCategory).length})
          </TabsTrigger>
        </TabsList>

        {/* Products Categories */}
        <TabsContent value="products">
          {filteredCategories.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeira categoria
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesPagination.paginatedData.map((category) => {
                  const categorySuppliers = getSuppliersForCategory(category.id);
                  return (
                    <div
                      key={category.id}
                      className="glass rounded-xl p-4 sm:p-6 glass-hover animate-slide-up"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: category.color || "#3B82F6" }}
                          >
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{category.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {getProductCount(category.id)} produtos
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleOpenDialog(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => openDeleteDialog(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-4 line-clamp-2">
                        {category.description || "Sem descrição"}
                      </p>
                      {categorySuppliers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>{categorySuppliers.length} fornecedor{categorySuppliers.length !== 1 ? 'es' : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <TablePagination
                currentPage={categoriesPagination.currentPage}
                totalPages={categoriesPagination.totalPages}
                startIndex={categoriesPagination.startIndex}
                endIndex={categoriesPagination.endIndex}
                totalItems={categoriesPagination.totalItems}
                onPageChange={categoriesPagination.goToPage}
                hasNextPage={categoriesPagination.hasNextPage}
                hasPrevPage={categoriesPagination.hasPrevPage}
              />
            </>
          )}
        </TabsContent>

        {/* EPIs Categories - Clean professional design */}
        <TabsContent value="epis">
          {filteredEPICategories.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <HardHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma categoria de EPI encontrada</p>
              <p className="text-xs text-muted-foreground mt-2">
                As categorias de EPI são criadas automaticamente ao cadastrar EPIs
              </p>
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {epiCategoriesPagination.paginatedData.map(([category, episList]) => {
                const categorySuppliers = getEPICategorySuppliers(category);
                const isExpanded = expandedEPICategory === category;
                const totalStock = episList.reduce((sum, epi) => sum + epi.quantity, 0);
                const lowStockCount = episList.filter(epi => epi.quantity <= (epi.min_quantity || 5)).length;

                return (
                  <div
                    key={category}
                    className="glass rounded-xl overflow-hidden animate-slide-up"
                  >
                    {/* Main row - clickable to expand */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => setExpandedEPICategory(isExpanded ? null : category)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: epiCategoryColors[category] || "#6B7280" }}
                        >
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{category}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{episList.length} EPI{episList.length !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{totalStock} un</span>
                            {lowStockCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-destructive">{lowStockCount} baixo estoque</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Suppliers indicator */}
                        {categorySuppliers.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{categorySuppliers.length}</span>
                          </div>
                        ) : canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEPISupplierDialog(category);
                            }}
                          >
                            <Users className="w-3.5 h-3.5 mr-1" />
                            Vincular
                          </Button>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-secondary/20">
                        {/* EPIs list */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Itens
                            </span>
                          </div>
                          <div className="grid gap-2">
                            {episList.map(epi => (
                              <div
                                key={epi.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                              >
                                <span className="text-sm truncate flex-1">{epi.name}</span>
                                <div className="flex items-center gap-2">
                                  {epi.ca_number && (
                                    <span className="text-xs text-muted-foreground">
                                      CA: {epi.ca_number}
                                    </span>
                                  )}
                                  <Badge
                                    variant={epi.quantity <= (epi.min_quantity || 5) ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {epi.quantity} un
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Suppliers section */}
                        <div className="border-t border-border/50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Fornecedores Vinculados
                            </span>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openEPISupplierDialog(category)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Gerenciar
                              </Button>
                            )}
                          </div>
                          {categorySuppliers.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {categorySuppliers.map(supplier => (
                                <Badge key={supplier.id} variant="outline" className="text-xs">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  {supplier.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Nenhum fornecedor vinculado a esta categoria
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
              );
              })}
            </div>
            <TablePagination
              currentPage={epiCategoriesPagination.currentPage}
              totalPages={epiCategoriesPagination.totalPages}
              startIndex={epiCategoriesPagination.startIndex}
              endIndex={epiCategoriesPagination.endIndex}
              totalItems={epiCategoriesPagination.totalItems}
              onPageChange={epiCategoriesPagination.goToPage}
              hasNextPage={epiCategoriesPagination.hasNextPage}
              hasPrevPage={epiCategoriesPagination.hasPrevPage}
            />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Adicionar Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Altere as informações da categoria" : "Crie uma nova categoria para organizar seus produtos"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ferramentas Manuais"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color.value
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={!formData.name || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? "Salvar" : "Cadastrar"}
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
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
              {getProductCount(deletingCategoryId || "") > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Atenção: Existem {getProductCount(deletingCategoryId || "")} produtos nesta categoria.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EPI Supplier Dialog */}
      <Dialog open={isEPISupplierDialogOpen} onOpenChange={setIsEPISupplierDialogOpen}>
        <DialogContent className="glass border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Fornecedores</DialogTitle>
            <DialogDescription>
              Selecione os fornecedores para a categoria: <strong>{selectedEPICategory}</strong>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum fornecedor cadastrado
                </p>
              ) : (
                suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => toggleEPISupplier(supplier.id)}
                  >
                    <Checkbox
                      checked={selectedEPISuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleEPISupplier(supplier.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{supplier.name}</p>
                      {supplier.cnpj && (
                        <p className="text-xs text-muted-foreground">{supplier.cnpj}</p>
                      )}
                    </div>
                    <Badge
                      variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEPISupplierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleSaveEPISuppliers}
              disabled={setSuppliersForEPICategory.isPending}
            >
              {setSuppliersForEPICategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar ({selectedEPISuppliers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}