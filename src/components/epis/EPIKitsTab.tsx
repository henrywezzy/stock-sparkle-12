import { useState } from 'react';
import { Plus, Pencil, Trash2, Layers, AlertTriangle, Check, HardHat } from 'lucide-react';
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
import { useEPIs, EPI } from '@/hooks/useEPIs';
import { useAuth } from '@/contexts/AuthContext';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EPIKitItem {
  id: string;
  epi_id: string;
  quantity: number;
  epi?: EPI;
}

interface EPIKit {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  status: string | null;
  items?: EPIKitItem[];
}

interface KitFormData {
  name: string;
  description: string;
  sku: string;
  status: string;
  items: { epi_id: string; quantity: number }[];
}

export function EPIKitsTab() {
  const { epis } = useEPIs();
  const { canEdit, canDelete } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<EPIKit | null>(null);
  const [kitToDelete, setKitToDelete] = useState<EPIKit | null>(null);
  
  const [formData, setFormData] = useState<KitFormData>({
    name: '',
    description: '',
    sku: '',
    status: 'active',
    items: [],
  });

  // Fetch EPI Kits from product_kits table filtered by EPI-related items
  const { data: kits = [], isLoading } = useQuery({
    queryKey: ['epi-kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_kits')
        .select(`
          *,
          kit_items (
            id,
            product_id,
            quantity
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to EPIKit format - for now, we'll use these as EPI kits
      // In a real scenario, you'd have a separate epi_kits table
      return (data || []).map(kit => ({
        id: kit.id,
        name: kit.name,
        description: kit.description,
        sku: kit.sku,
        status: kit.status,
        items: kit.kit_items?.map((item: any) => ({
          id: item.id,
          epi_id: item.product_id, // Using product_id as epi_id for now
          quantity: item.quantity,
          epi: epis.find(e => e.id === item.product_id)
        })) || []
      })) as EPIKit[];
    },
    enabled: epis.length > 0
  });

  const createKit = useMutation({
    mutationFn: async (data: KitFormData) => {
      const { data: kit, error: kitError } = await supabase
        .from('product_kits')
        .insert({
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          status: data.status,
          is_virtual: true,
        })
        .select()
        .single();

      if (kitError) throw kitError;

      // Insert kit items
      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('kit_items')
          .insert(
            data.items.map(item => ({
              kit_id: kit.id,
              product_id: item.epi_id,
              quantity: item.quantity,
            }))
          );
        if (itemsError) throw itemsError;
      }

      return kit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-kits'] });
      toast({ title: 'Kit de EPI criado com sucesso!' });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar kit', description: error.message, variant: 'destructive' });
    }
  });

  const updateKit = useMutation({
    mutationFn: async ({ id, ...data }: KitFormData & { id: string }) => {
      const { error: kitError } = await supabase
        .from('product_kits')
        .update({
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          status: data.status,
        })
        .eq('id', id);

      if (kitError) throw kitError;

      // Delete existing items and re-insert
      await supabase.from('kit_items').delete().eq('kit_id', id);

      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('kit_items')
          .insert(
            data.items.map(item => ({
              kit_id: id,
              product_id: item.epi_id,
              quantity: item.quantity,
            }))
          );
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-kits'] });
      toast({ title: 'Kit atualizado com sucesso!' });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar kit', description: error.message, variant: 'destructive' });
    }
  });

  const deleteKit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_kits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-kits'] });
      toast({ title: 'Kit excluído com sucesso!' });
      setDeleteDialogOpen(false);
      setKitToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir kit', description: error.message, variant: 'destructive' });
    }
  });

  const pagination = usePagination(kits, { itemsPerPage: 6 });

  const checkKitAvailability = (kit: EPIKit) => {
    const missing: { epi: string; available: number; required: number }[] = [];
    let available = true;

    kit.items?.forEach(item => {
      const epi = epis.find(e => e.id === item.epi_id);
      if (epi && epi.quantity < item.quantity) {
        available = false;
        missing.push({
          epi: epi.name,
          available: epi.quantity,
          required: item.quantity,
        });
      }
    });

    return { available, missing };
  };

  const openDialog = (kit?: EPIKit) => {
    if (kit) {
      setEditingKit(kit);
      setFormData({
        name: kit.name,
        description: kit.description || '',
        sku: kit.sku || '',
        status: kit.status || 'active',
        items: kit.items?.map(item => ({
          epi_id: item.epi_id,
          quantity: item.quantity
        })) || [],
      });
    } else {
      setEditingKit(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
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
  };

  const handleDelete = async () => {
    if (kitToDelete) {
      await deleteKit.mutateAsync(kitToDelete.id);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { epi_id: '', quantity: 1 }],
    });
  };

  const updateItem = (index: number, field: 'epi_id' | 'quantity', value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando kits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Monte kits de EPIs para entrega facilitada aos funcionários
        </p>
        {canEdit && (
          <Button onClick={() => openDialog()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Kit
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pagination.paginatedData.map((kit) => {
          const availability = checkKitAvailability(kit);
          
          return (
            <Card key={kit.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{kit.name}</CardTitle>
                      {kit.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {kit.sku}</p>
                      )}
                    </div>
                  </div>
                  {availability.available ? (
                    <Badge variant="default" className="gap-1 text-xs bg-success/20 text-success">
                      <Check className="w-3 h-3" />
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      Indisponível
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {kit.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {kit.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-muted-foreground">EPIs do Kit:</p>
                  <div className="space-y-1">
                    {kit.items?.slice(0, 3).map((item) => {
                      const epi = epis.find(e => e.id === item.epi_id);
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-2 py-1"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <HardHat className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate text-xs">{epi?.name || 'EPI não encontrado'}</span>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                      );
                    })}
                    {(kit.items?.length || 0) > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{(kit.items?.length || 0) - 3} itens
                      </p>
                    )}
                  </div>
                </div>

                {!availability.available && (
                  <div className="bg-destructive/10 rounded-lg p-2 mb-3">
                    <p className="text-xs text-destructive font-medium mb-1">EPIs em falta:</p>
                    {availability.missing.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {item.epi}: {item.available}/{item.required}
                      </p>
                    ))}
                  </div>
                )}

                {(canEdit || canDelete) && (
                  <div className="flex items-center justify-end pt-2 border-t gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(kit)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setKitToDelete(kit); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {pagination.paginatedData.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum kit de EPI cadastrado</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
          onPageChange={pagination.goToPage}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKit ? 'Editar Kit de EPI' : 'Novo Kit de EPI'}</DialogTitle>
            <DialogDescription>
              {editingKit ? 'Atualize as informações do kit.' : 'Monte um kit com múltiplos EPIs.'}
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
                  placeholder="Ex: KIT-EPI-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do kit..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>EPIs do Kit *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.epi_id}
                    onValueChange={(value) => updateItem(index, 'epi_id', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um EPI" />
                    </SelectTrigger>
                    <SelectContent>
                      {epis.map((epi) => (
                        <SelectItem key={epi.id} value={epi.id}>
                          {epi.name}
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {formData.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione EPIs ao kit
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
                formData.items.some(i => !i.epi_id) ||
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