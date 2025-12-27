import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Clock, 
  ClipboardList, 
  Eye, 
  Package,
  Loader2,
  Trash2,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRequisitions, RequisitionFormData, Requisition } from "@/hooks/useRequisitions";
import { useProducts } from "@/hooks/useProducts";
import { useEmployees } from "@/hooks/useEmployees";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-warning/20 text-warning", icon: Clock },
  approved: { label: "Aprovada", color: "bg-success/20 text-success", icon: Check },
  rejected: { label: "Rejeitada", color: "bg-destructive/20 text-destructive", icon: X },
  in_separation: { label: "Em Separação", color: "bg-primary/20 text-primary", icon: Package },
  delivered: { label: "Entregue", color: "bg-emerald-500/20 text-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", color: "bg-primary/20 text-primary" },
  high: { label: "Alta", color: "bg-warning/20 text-warning" },
  urgent: { label: "Urgente", color: "bg-destructive/20 text-destructive" },
};

export default function Requisitions() {
  const { 
    requisitions, 
    isLoading, 
    stats,
    createRequisition,
    approveRequisition,
    rejectRequisition,
    startSeparation,
    markAsDelivered,
    cancelRequisition,
    deleteRequisition
  } = useRequisitions();
  const { products } = useProducts();
  const { employees } = useEmployees();
  const { canEdit, canDelete, isAdmin, userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [formData, setFormData] = useState<RequisitionFormData>({
    product_id: "",
    employee_id: "",
    quantity: 1,
    priority: "normal",
    notes: "",
  });

  // Filtros
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requested_by?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requisitions, searchTerm, statusFilter]);

  // Agrupar por status para tabs
  const pendingRequisitions = filteredRequisitions.filter(r => r.status === 'pending');
  const approvedRequisitions = filteredRequisitions.filter(r => r.status === 'approved');
  const inProgressRequisitions = filteredRequisitions.filter(r => r.status === 'in_separation');

  const resetForm = () => {
    setFormData({
      product_id: "",
      employee_id: "",
      quantity: 1,
      priority: "normal",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.product_id || formData.quantity <= 0) return;

    await createRequisition.mutateAsync(formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleApprove = async (id: string) => {
    await approveRequisition(id);
  };

  const handleReject = async () => {
    if (!selectedRequisition) return;
    await rejectRequisition(selectedRequisition.id, rejectReason);
    setIsRejectDialogOpen(false);
    setSelectedRequisition(null);
    setRejectReason("");
  };

  const handleStartSeparation = async (id: string) => {
    await startSeparation(id);
  };

  const handleMarkDelivered = async (id: string) => {
    await markAsDelivered(id);
  };

  const handleCancel = async (id: string) => {
    await cancelRequisition(id);
  };

  const handleDelete = async () => {
    if (!selectedRequisition) return;
    await deleteRequisition.mutateAsync(selectedRequisition.id);
    setIsDeleteDialogOpen(false);
    setSelectedRequisition(null);
  };

  const openViewDialog = (req: Requisition) => {
    setSelectedRequisition(req);
    setIsViewDialogOpen(true);
  };

  const openRejectDialog = (req: Requisition) => {
    setSelectedRequisition(req);
    setIsRejectDialogOpen(true);
  };

  const openDeleteDialog = (req: Requisition) => {
    setSelectedRequisition(req);
    setIsDeleteDialogOpen(true);
  };

  const renderStatusBadge = (status: Requisition['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderPriorityBadge = (priority: Requisition['priority']) => {
    const config = PRIORITY_CONFIG[priority];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const renderActions = (req: Requisition) => {
    const canManage = isAdmin || userRole === 'almoxarife';

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => openViewDialog(req)}
        >
          <Eye className="w-4 h-4" />
        </Button>

        {req.status === "pending" && canManage && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-success"
              onClick={() => handleApprove(req.id)}
              title="Aprovar"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => openRejectDialog(req)}
              title="Rejeitar"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}

        {req.status === "approved" && canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => handleStartSeparation(req.id)}
            title="Iniciar Separação"
          >
            <PlayCircle className="w-4 h-4" />
          </Button>
        )}

        {req.status === "in_separation" && canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-success"
            onClick={() => handleMarkDelivered(req.id)}
            title="Marcar como Entregue"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        )}

        {(req.status === "pending" || req.status === "approved") && canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-warning"
            onClick={() => handleCancel(req.id)}
            title="Cancelar"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => openDeleteDialog(req)}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  const RequisitionTable = ({ data }: { data: Requisition[] }) => (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground">Produto</TableHead>
              <TableHead className="text-muted-foreground">Qtd</TableHead>
              <TableHead className="text-muted-foreground">Solicitante</TableHead>
              <TableHead className="text-muted-foreground">Prioridade</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma requisição encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((req) => (
                <TableRow key={req.id} className="border-border">
                  <TableCell className="text-sm">
                    {format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{req.products?.name || "—"}</p>
                        {req.products?.sku && (
                          <p className="text-xs text-muted-foreground font-mono">{req.products.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{req.quantity}</span>
                    {req.products?.quantity !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (disp: {req.products.quantity})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{req.employees?.name || req.requested_by || "—"}</p>
                      {req.employees?.department && (
                        <p className="text-xs text-muted-foreground">{req.employees.department}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{renderPriorityBadge(req.priority)}</TableCell>
                  <TableCell>{renderStatusBadge(req.status)}</TableCell>
                  <TableCell>{renderActions(req)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisições"
        description="Gerencie as solicitações de materiais"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Requisições" }]}
        actions={
          <Button
            className="gradient-primary text-primary-foreground glow-sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Requisição
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold">{stats.pending}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-xl font-bold">{stats.approved}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Em Separação</p>
            <p className="text-xl font-bold">{stats.inSeparation}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-xl font-bold">{stats.delivered}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <X className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rejeitadas</p>
            <p className="text-xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto, solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="in_separation">Em Separação</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for workflow */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">
            Todas ({filteredRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pendentes ({pendingRequisitions.length})
            {pendingRequisitions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Para Separar ({approvedRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({inProgressRequisitions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <RequisitionTable data={filteredRequisitions} />
        </TabsContent>
        <TabsContent value="pending">
          <RequisitionTable data={pendingRequisitions} />
        </TabsContent>
        <TabsContent value="approved">
          <RequisitionTable data={approvedRequisitions} />
        </TabsContent>
        <TabsContent value="in_progress">
          <RequisitionTable data={inProgressRequisitions} />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Requisição de Material</DialogTitle>
            <DialogDescription>
              Solicite materiais do almoxarifado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Produto *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          (Disp: {product.quantity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Funcionário/Setor</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} {emp.department && `- ${emp.department}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Justificativa/Observações</Label>
              <Textarea
                placeholder="Motivo da solicitação..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={!formData.product_id || formData.quantity <= 0 || createRequisition.isPending}
            >
              {createRequisition.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Enviar Requisição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="glass border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Requisição</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Produto</Label>
                  <p className="font-medium">{selectedRequisition.products?.name}</p>
                  {selectedRequisition.products?.sku && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {selectedRequisition.products.sku}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantidade</Label>
                  <p className="font-medium">{selectedRequisition.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{renderStatusBadge(selectedRequisition.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prioridade</Label>
                  <div className="mt-1">{renderPriorityBadge(selectedRequisition.priority)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Solicitante</Label>
                  <p className="font-medium">
                    {selectedRequisition.employees?.name || selectedRequisition.requested_by || "—"}
                  </p>
                  {selectedRequisition.employees?.department && (
                    <p className="text-sm text-muted-foreground">{selectedRequisition.employees.department}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequisition.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {selectedRequisition.approved_by && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Aprovado por</Label>
                    <p className="font-medium">{selectedRequisition.approved_by}</p>
                  </div>
                  {selectedRequisition.approved_at && (
                    <div>
                      <Label className="text-muted-foreground">Data Aprovação</Label>
                      <p className="font-medium">
                        {format(new Date(selectedRequisition.approved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedRequisition.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm mt-1 p-3 bg-secondary/50 rounded-lg">{selectedRequisition.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Rejeitar Requisição
            </AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. Isso será registrado para consulta posterior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReject}
            >
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Requisição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
