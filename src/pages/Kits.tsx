import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, Layers, AlertTriangle, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useKits, ProductKit, KitFormData } from '@/hooks/useKits';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';

export default function Kits() {
  const { kits, isLoading, createKit, updateKit, deleteKit, checkKitAvailability } = useKits();
  const { products } = useProducts();
  const { categories } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ProductKit | null>(null);
  const [kitToDelete, setKitToDelete] = useState<ProductKit | null>(null);
  
  const [formData, setFormData] = useState<KitFormData>({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    is_virtual: true,
    status: 'active',
    items: [],
  });

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(
    kits || [],
    9
  );

  const openDialog = (kit?: ProductKit) => {
    if (kit) {
      setEditingKit(kit);
      setFormData({
        name: kit.name,
        description: kit.description || '',
        sku: kit.sku || '',
        category_id: kit.category_id || '',
        is_virtual: kit.is_virtual ?? true,
        status: kit.status || 'active',
        items: kit.items?.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })) || [],
      });
    } else {
      setEditingKit(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        category_id: '',
        is_virtual: true,
        status: 'active',
        items: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingKit) {
      await updateKit.mutateAsync({ id: editingKit.id, ...formData });
    } else {
      await createKit.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (kitToDelete) {
      await deleteKit.mutateAsync(kitToDelete.id);
      setDeleteDialogOpen(false);
      setKitToDelete(null);
    }
  };

  const openDeleteDialog = (kit: ProductKit) => {
    setKitToDelete(kit);
    setDeleteDialogOpen(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1 }],
    });
  };

  const updateItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kits de Produtos"
        description="Monte kits com múltiplos produtos"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Kit
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedData.map((kit) => {
          const availability = checkKitAvailability(kit);
          
          return (
            <Card key={kit.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{kit.name}</CardTitle>
                      {kit.sku && (
                        <p className="text-sm text-muted-foreground">SKU: {kit.sku}</p>
                      )}
                    </div>
                  </div>
                  {availability.available ? (
                    <Badge variant="default" className="gap-1">
                      <Check className="w-3 h-3" />
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Indisponível
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {kit.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {kit.description}
                  </p>
                )}
                
                {/* Kit items */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Componentes:</p>
                  <div className="space-y-1">
                    {kit.items?.slice(0, 3).map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5"
                      >
                        <span className="truncate">{item.product?.name}</span>
                        <Badge variant="outline" className="ml-2">
                          x{item.quantity}
                        </Badge>
                      </div>
                    ))}
                    {(kit.items?.length || 0) > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{(kit.items?.length || 0) - 3} itens
                      </p>
                    )}
                  </div>
                </div>

                {/* Missing items warning */}
                {!availability.available && (
                  <div className="bg-destructive/10 rounded-lg p-2 mb-3">
                    <p className="text-xs text-destructive font-medium mb-1">Itens em falta:</p>
                    {availability.missing.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {item.product}: {item.available}/{item.required}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <Badge variant={kit.is_virtual ? 'outline' : 'secondary'}>
                    {kit.is_virtual ? 'Virtual' : 'Físico'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(kit)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(kit)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {paginatedData.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum kit cadastrado</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingKit ? 'Editar Kit' : 'Novo Kit'}
            </DialogTitle>
            <DialogDescription>
              {editingKit
                ? 'Atualize as informações do kit.'
                : 'Monte um kit com múltiplos produtos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Kit Admissão"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  placeholder="Ex: KIT-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do kit..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Kit Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Componentes do Kit *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => updateItem(index, 'product_id', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {formData.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione produtos ao kit
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                formData.items.length === 0 ||
                formData.items.some(i => !i.product_id) ||
                createKit.isPending ||
                updateKit.isPending
              }
            >
              {editingKit ? 'Salvar' : 'Criar Kit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Kit</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{kitToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
