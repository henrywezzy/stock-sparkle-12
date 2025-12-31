import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Building2, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { useLocations, Location, LocationFormData } from '@/hooks/useLocations';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';

export default function Locations() {
  const { locations, isLoading, createLocation, updateLocation, deleteLocation } = useLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    is_default: false,
    status: 'active',
  });

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(
    locations || [],
    10
  );

  const openDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        code: location.code || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        is_default: location.is_default || false,
        status: location.status || 'active',
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        is_default: false,
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingLocation) {
      await updateLocation.mutateAsync({ id: editingLocation.id, ...formData });
    } else {
      await createLocation.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (locationToDelete) {
      await deleteLocation.mutateAsync(locationToDelete.id);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const openDeleteDialog = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Localizações"
        description="Gerencie armazéns e filiais"
        actions={
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Localização
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedData.map((location) => (
          <Card key={location.id} className="relative">
            {location.is_default && (
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="gap-1">
                  <Star className="w-3 h-3" />
                  Padrão
                </Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  {location.code && (
                    <p className="text-sm text-muted-foreground">Código: {location.code}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(location.city || location.state) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[location.city, location.state].filter(Boolean).join(' - ')}
                  </span>
                </div>
              )}
              {location.address && (
                <p className="text-sm text-muted-foreground mb-3">{location.address}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                  {location.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(location)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(location)}
                    disabled={location.is_default}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Editar Localização' : 'Nova Localização'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Atualize as informações da localização.'
                : 'Adicione um novo armazém ou filial.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Filial São Paulo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="Ex: SP-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Rua, número, bairro"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  placeholder="SP"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Localização Padrão</Label>
                <p className="text-sm text-muted-foreground">
                  Usar como localização principal
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createLocation.isPending || updateLocation.isPending}
            >
              {editingLocation ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Localização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{locationToDelete?.name}"? Esta ação não pode ser desfeita.
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
