import { useState } from 'react';
import { Plus, ArrowRight, Check, X, Clock, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTransfers, TransferFormData } from '@/hooks/useTransfers';
import { useLocations } from '@/hooks/useLocations';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_transit: { label: 'Em Trânsito', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function Transfers() {
  const { transfers, isLoading, createTransfer, approveTransfer, cancelTransfer } = useTransfers();
  const { locations } = useLocations();
  const { products } = useProducts();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<TransferFormData>({
    from_location_id: '',
    to_location_id: '',
    product_id: '',
    quantity: 1,
    notes: '',
    requested_by: user?.email || '',
  });

  const pagination = usePagination(transfers || [], { itemsPerPage: 10 });

  const handleSubmit = async () => {
    await createTransfer.mutateAsync(formData);
    setDialogOpen(false);
    setFormData({
      from_location_id: '',
      to_location_id: '',
      product_id: '',
      quantity: 1,
      notes: '',
      requested_by: user?.email || '',
    });
  };

  const handleApprove = async (id: string) => {
    await approveTransfer.mutateAsync({ 
      id, 
      approved_by: user?.email || 'Sistema' 
    });
  };

  const handleCancel = async (id: string) => {
    await cancelTransfer.mutateAsync(id);
  };

  // Stats
  const pendingCount = transfers?.filter(t => t.status === 'pending').length || 0;
  const completedCount = transfers?.filter(t => t.status === 'completed').length || 0;
  const thisMonthCount = transfers?.filter(t => {
    const date = new Date(t.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length || 0;

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferências"
        description="Movimentação de estoque entre localizações"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transferência
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{thisMonthCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead></TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedData.map((transfer) => {
                const status = statusConfig[transfer.status || 'pending'];
                return (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.product?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {transfer.from_location?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      {transfer.to_location?.name || 'N/A'}
                    </TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(transfer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {transfer.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(transfer.id)}
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(transfer.id)}
                            title="Cancelar"
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {pagination.paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma transferência encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
            <DialogDescription>
              Mova produtos entre localizações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.quantity} un)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem *</Label>
                <Select
                  value={formData.from_location_id}
                  onValueChange={(value) => setFormData({ ...formData, from_location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="De onde" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location) => (
                      <SelectItem 
                        key={location.id} 
                        value={location.id}
                        disabled={location.id === formData.to_location_id}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Select
                  value={formData.to_location_id}
                  onValueChange={(value) => setFormData({ ...formData, to_location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Para onde" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location) => (
                      <SelectItem 
                        key={location.id} 
                        value={location.id}
                        disabled={location.id === formData.from_location_id}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Motivo da transferência..."
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
              disabled={
                !formData.product_id ||
                !formData.from_location_id ||
                !formData.to_location_id ||
                formData.quantity < 1 ||
                createTransfer.isPending
              }
            >
              Criar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
