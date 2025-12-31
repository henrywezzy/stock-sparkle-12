import { useState } from 'react';
import { Plus, Pencil, Trash2, Wrench, MapPin, Calendar, FileText } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssets, Asset, AssetFormData } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativo', variant: 'default' },
  maintenance: { label: 'Manutenção', variant: 'secondary' },
  retired: { label: 'Aposentado', variant: 'destructive' },
};

const departments = [
  'Produção',
  'Manutenção',
  'Logística',
  'Administrativo',
  'TI',
  'Qualidade',
  'Segurança',
];

export default function Assets() {
  const { assets, assetConsumption, isLoading, createAsset, updateAsset, deleteAsset } = useAssets();
  const { locations } = useLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    asset_tag: '',
    serial_number: '',
    model: '',
    manufacturer: '',
    location_id: '',
    department: '',
    status: 'active',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
  });

  const assetsPagination = usePagination(assets || [], { itemsPerPage: 9 });
  const consumptionPagination = usePagination(assetConsumption || [], { itemsPerPage: 10 });

  const openDialog = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name,
        asset_tag: asset.asset_tag || '',
        serial_number: asset.serial_number || '',
        model: asset.model || '',
        manufacturer: asset.manufacturer || '',
        location_id: asset.location_id || '',
        department: asset.department || '',
        status: asset.status || 'active',
        purchase_date: asset.purchase_date || '',
        warranty_expiry: asset.warranty_expiry || '',
        notes: asset.notes || '',
      });
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        asset_tag: '',
        serial_number: '',
        model: '',
        manufacturer: '',
        location_id: '',
        department: '',
        status: 'active',
        purchase_date: '',
        warranty_expiry: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const dataToSubmit = {
      ...formData,
      location_id: formData.location_id || undefined,
      purchase_date: formData.purchase_date || undefined,
      warranty_expiry: formData.warranty_expiry || undefined,
    };

    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, ...dataToSubmit });
    } else {
      await createAsset.mutateAsync(dataToSubmit);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (assetToDelete) {
      await deleteAsset.mutateAsync(assetToDelete.id);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    }
  };

  const openDeleteDialog = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  // Stats
  const activeCount = assets?.filter(a => a.status === 'active').length || 0;
  const maintenanceCount = assets?.filter(a => a.status === 'maintenance').length || 0;
  const totalConsumption = assetConsumption?.length || 0;

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ativos / Equipamentos"
        description="Gerencie máquinas e equipamentos"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Ativo
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{activeCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{maintenanceCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consumo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{totalConsumption}</span>
              <span className="text-sm text-muted-foreground">saídas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Equipamentos</TabsTrigger>
          <TabsTrigger value="consumption">Consumo</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assetsPagination.paginatedData.map((asset) => {
              const status = statusConfig[asset.status || 'active'];
              
              return (
                <Card key={asset.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{asset.name}</CardTitle>
                          {asset.asset_tag && (
                            <p className="text-sm text-muted-foreground">Tag: {asset.asset_tag}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      {asset.manufacturer && asset.model && (
                        <p>{asset.manufacturer} - {asset.model}</p>
                      )}
                      {asset.serial_number && (
                        <p>S/N: {asset.serial_number}</p>
                      )}
                      {asset.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {asset.location.name}
                        </div>
                      )}
                      {asset.department && (
                        <p>Depto: {asset.department}</p>
                      )}
                      {asset.warranty_expiry && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Garantia até: {format(new Date(asset.warranty_expiry), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(asset)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(asset)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {assetsPagination.paginatedData.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ativo cadastrado</p>
              </div>
            )}
          </div>

          {assetsPagination.totalPages > 1 && (
            <TablePagination
              currentPage={assetsPagination.currentPage}
              totalPages={assetsPagination.totalPages}
              startIndex={assetsPagination.startIndex}
              endIndex={assetsPagination.endIndex}
              totalItems={assetsPagination.totalItems}
              onPageChange={assetsPagination.goToPage}
              hasNextPage={assetsPagination.hasNextPage}
              hasPrevPage={assetsPagination.hasPrevPage}
            />
          )}
        </TabsContent>

        <TabsContent value="consumption">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumptionPagination.paginatedData.map((exit: any) => (
                    <TableRow key={exit.id}>
                      <TableCell>
                        {format(new Date(exit.exit_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {exit.asset?.name}
                        {exit.asset?.asset_tag && (
                          <span className="text-muted-foreground ml-1">
                            ({exit.asset.asset_tag})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{exit.product?.name}</TableCell>
                      <TableCell>{exit.quantity}</TableCell>
                    </TableRow>
                  ))}
                  {consumptionPagination.paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum consumo registrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {consumptionPagination.totalPages > 1 && (
            <TablePagination
              currentPage={consumptionPagination.currentPage}
              totalPages={consumptionPagination.totalPages}
              startIndex={consumptionPagination.startIndex}
              endIndex={consumptionPagination.endIndex}
              totalItems={consumptionPagination.totalItems}
              onPageChange={consumptionPagination.goToPage}
              hasNextPage={consumptionPagination.hasNextPage}
              hasPrevPage={consumptionPagination.hasPrevPage}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? 'Atualize as informações do equipamento.'
                : 'Cadastre um novo equipamento ou máquina.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Compressor Industrial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tag / Patrimônio</Label>
                <Input
                  placeholder="Ex: EQUIP-001"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fabricante</Label>
                <Input
                  placeholder="Ex: Atlas Copco"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  placeholder="Ex: GA 22"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input
                placeholder="Ex: SN-123456789"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Localização</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Compra</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Garantia até</Label>
                <Input
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="retired">Aposentado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createAsset.isPending || updateAsset.isPending}
            >
              {editingAsset ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ativo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{assetToDelete?.name}"? Esta ação não pode ser desfeita.
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
