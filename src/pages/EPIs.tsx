import { useState } from "react";
import { Plus, Search, Edit, Trash2, HardHat, AlertTriangle, CheckCircle, Clock, FileText, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GenericReportDialog, ReportColumn, ReportSummary } from "@/components/reports/GenericReportDialog";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateInput } from "@/components/ui/date-input";
import { useEPIs, EPI } from "@/hooks/useEPIs";
import { useEPIDeliveries, EPIDelivery } from "@/hooks/useEPIDeliveries";
import { useEmployees } from "@/hooks/useEmployees";
import { useTermosEntrega, TermoEntrega } from "@/hooks/useTermosEntrega";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryTermDialog } from "@/components/epis/DeliveryTermDialog";
import { TermoViewDialog } from "@/components/epis/TermoViewDialog";
import { ExportDropdown } from "@/components/ui/export-dropdown";
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
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EPIs() {
  const { epis, isLoading, createEPI, deleteEPI, stats: epiStats } = useEPIs();
  const { deliveries, stats: deliveryStats, createDelivery } = useEPIDeliveries();
  const { employees } = useEmployees();
  const { termos } = useTermosEntrega();
  const { canEdit, canDelete } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isTermoDialogOpen, setIsTermoDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedTermo, setSelectedTermo] = useState<TermoEntrega | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEPIIds, setSelectedEPIIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Form state for new EPI
  const [newEPI, setNewEPI] = useState({
    name: "",
    category: "",
    ca_number: "",
    default_validity_days: 365,
    quantity: 0,
    min_quantity: 5,
  });

  // Form state for delivery
  const [newDelivery, setNewDelivery] = useState({
    employee_id: "",
    epi_id: "",
    quantity: 1,
    delivery_date: new Date().toISOString().split("T")[0],
  });

  const filteredEPIs = epis.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEPI = async () => {
    if (!newEPI.name) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    await createEPI.mutateAsync(newEPI);
    setIsDialogOpen(false);
    setNewEPI({ name: "", category: "", ca_number: "", default_validity_days: 365, quantity: 0, min_quantity: 5 });
  };

  const handleCreateDelivery = async () => {
    if (!newDelivery.employee_id || !newDelivery.epi_id) {
      toast({ title: "Selecione funcionário e EPI", variant: "destructive" });
      return;
    }
    await createDelivery.mutateAsync(newDelivery);
    setIsDeliveryDialogOpen(false);
    setNewDelivery({ employee_id: "", epi_id: "", quantity: 1, delivery_date: new Date().toISOString().split("T")[0] });
  };

  const handleSelectEPI = (epiId: string, checked: boolean) => {
    setSelectedEPIIds(prev => 
      checked ? [...prev, epiId] : prev.filter(id => id !== epiId)
    );
  };

  const handleSelectAllEPIs = (checked: boolean) => {
    setSelectedEPIIds(checked ? filteredEPIs.map(e => e.id) : []);
  };

  const handleBulkDeleteEPIs = async () => {
    for (const id of selectedEPIIds) {
      await deleteEPI.mutateAsync(id);
    }
    setSelectedEPIIds([]);
    setIsBulkDeleteDialogOpen(false);
    toast({ title: `${selectedEPIIds.length} EPIs excluídos com sucesso` });
  };

  const getExportData = () => {
    const dataToExport = selectedEPIIds.length > 0 
      ? filteredEPIs.filter(e => selectedEPIIds.includes(e.id))
      : filteredEPIs;
    return dataToExport.map(epi => ({
      Nome: epi.name,
      Categoria: epi.category || '-',
      CA: epi.ca_number || '-',
      Estoque: epi.quantity,
      'Estoque Mínimo': epi.min_quantity || 5,
      'Validade (dias)': epi.default_validity_days || 365,
      Status: epi.quantity <= (epi.min_quantity || 5) ? 'Estoque Baixo' : 'Normal',
    }));
  };

  const epiColumns = [
    {
      key: "select",
      header: () => (
        <Checkbox
          checked={selectedEPIIds.length === filteredEPIs.length && filteredEPIs.length > 0}
          onCheckedChange={handleSelectAllEPIs}
        />
      ),
      render: (epi: EPI) => (
        <Checkbox
          checked={selectedEPIIds.includes(epi.id)}
          onCheckedChange={(checked) => handleSelectEPI(epi.id, checked as boolean)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "name",
      header: "EPI",
      render: (epi: EPI) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{epi.name}</p>
            <p className="text-sm text-muted-foreground">CA: {epi.ca_number || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Categoria", render: (epi: EPI) => epi.category || '-' },
    {
      key: "quantity",
      header: "Estoque",
      render: (epi: EPI) => (
        <div>
          <span className="font-medium">{epi.quantity}</span>
          <span className="text-muted-foreground ml-1">un</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (epi: EPI) => (
        <Badge
          variant={epi.quantity <= (epi.min_quantity || 5) ? "destructive" : "default"}
          className={
            epi.quantity <= (epi.min_quantity || 5)
              ? "bg-destructive/20 text-destructive"
              : "bg-success/20 text-success"
          }
        >
          {epi.quantity <= (epi.min_quantity || 5) ? "Estoque Baixo" : "Normal"}
        </Badge>
      ),
    },
    {
      key: "validity",
      header: "Validade (dias)",
      render: (epi: EPI) => <span>{epi.default_validity_days || 365}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (epi: EPI) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteEPI.mutate(epi.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const deliveryColumns = [
    {
      key: "employee",
      header: "Funcionário",
      render: (delivery: EPIDelivery) => (
        <span className="font-medium">{delivery.employees?.name || '-'}</span>
      ),
    },
    {
      key: "epi",
      header: "EPI",
      render: (delivery: EPIDelivery) => (
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-primary" />
          <span>{delivery.epis?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: "deliveryDate",
      header: "Data Entrega",
      render: (delivery: EPIDelivery) => (
        <span>{format(new Date(delivery.delivery_date), "dd/MM/yyyy", { locale: ptBR })}</span>
      ),
    },
    {
      key: "expiryDate",
      header: "Vencimento",
      render: (delivery: EPIDelivery) => (
        <span>{delivery.expiry_date ? format(new Date(delivery.expiry_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (delivery: EPIDelivery) => {
        const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
          in_use: { label: "Em uso", color: "bg-success/20 text-success", icon: CheckCircle },
          returned: { label: "Devolvido", color: "bg-muted text-muted-foreground", icon: Clock },
          expired: { label: "Vencido", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
        };
        const config = statusConfig[delivery.status || 'in_use'];
        const Icon = config.icon;
        return (
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de EPIs"
        description="Controle de equipamentos de proteção individual"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Gestão de Pessoas" },
          { label: "EPIs" },
        ]}
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReportOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Relatório</span>
              </Button>
              <Button variant="outline" onClick={() => setIsTermoDialogOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Termo de Entrega
              </Button>
              <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrega
              </Button>
              <Button className="gradient-primary text-primary-foreground glow-sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo EPI
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Relatório</span>
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <HardHat className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de EPIs</p>
            <p className="text-2xl font-bold">{epiStats.total}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Em Uso</p>
            <p className="text-2xl font-bold">{deliveryStats.inUse}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencendo (30d)</p>
            <p className="text-2xl font-bold">{deliveryStats.expiringSoon}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="text-2xl font-bold">{deliveryStats.expired}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="inventory">Inventário de EPIs</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="termos">Termos ({termos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar EPIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              {selectedEPIIds.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedEPIIds.length} selecionado(s)
                  </span>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                </>
              )}
              <ExportDropdown
                title="Relatório de EPIs"
                filename="epis"
                columns={[
                  { key: 'Nome', header: 'Nome' },
                  { key: 'Categoria', header: 'Categoria' },
                  { key: 'CA', header: 'CA' },
                  { key: 'Estoque', header: 'Estoque' },
                  { key: 'Estoque Mínimo', header: 'Estoque Mínimo' },
                  { key: 'Validade (dias)', header: 'Validade (dias)' },
                  { key: 'Status', header: 'Status' },
                ]}
                data={getExportData()}
                disabled={filteredEPIs.length === 0}
                selectedCount={selectedEPIIds.length}
              />
            </div>
          </div>
          <DataTable columns={epiColumns} data={filteredEPIs} />
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <DataTable columns={deliveryColumns} data={deliveries} />
        </TabsContent>

        <TabsContent value="termos" className="space-y-4">
          <DataTable 
            columns={[
              { key: "numero", header: "Número", render: (t: TermoEntrega) => t.numero },
              { key: "employee", header: "Funcionário", render: (t: TermoEntrega) => t.employees?.name || '-' },
              { key: "date", header: "Data", render: (t: TermoEntrega) => format(new Date(t.data_emissao), "dd/MM/yyyy", { locale: ptBR }) },
              { key: "items", header: "Itens", render: (t: TermoEntrega) => `${t.termo_epis?.length || 0} EPIs` },
              { key: "actions", header: "Ações", render: (t: TermoEntrega) => (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => { setSelectedTermo(t); setIsViewDialogOpen(true); }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )},
            ]} 
            data={termos} 
          />
        </TabsContent>
      </Tabs>

      {/* New EPI Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo EPI</DialogTitle>
            <DialogDescription>Preencha as informações do EPI</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome do EPI *</Label>
              <Input value={newEPI.name} onChange={(e) => setNewEPI({ ...newEPI, name: e.target.value })} placeholder="Ex: Capacete de Segurança" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={newEPI.category} onValueChange={(v) => setNewEPI({ ...newEPI, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proteção da Cabeça">Proteção da Cabeça</SelectItem>
                    <SelectItem value="Proteção das Mãos">Proteção das Mãos</SelectItem>
                    <SelectItem value="Proteção Visual">Proteção Visual</SelectItem>
                    <SelectItem value="Proteção Auditiva">Proteção Auditiva</SelectItem>
                    <SelectItem value="Proteção dos Pés">Proteção dos Pés</SelectItem>
                    <SelectItem value="Proteção Respiratória">Proteção Respiratória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>CA (Certificado)</Label>
                <Input value={newEPI.ca_number} onChange={(e) => setNewEPI({ ...newEPI, ca_number: e.target.value })} placeholder="00000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Validade (dias)</Label>
                <Input type="number" value={newEPI.default_validity_days} onChange={(e) => setNewEPI({ ...newEPI, default_validity_days: parseInt(e.target.value) || 365 })} />
              </div>
              <div className="grid gap-2">
                <Label>Estoque Inicial</Label>
                <Input type="number" value={newEPI.quantity} onChange={(e) => setNewEPI({ ...newEPI, quantity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={newEPI.min_quantity} onChange={(e) => setNewEPI({ ...newEPI, min_quantity: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateEPI} disabled={createEPI.isPending}>
              {createEPI.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Registrar Entrega de EPI</DialogTitle>
            <DialogDescription>Vincule um EPI a um funcionário</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Funcionário</Label>
              <Select value={newDelivery.employee_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>EPI</Label>
              <Select value={newDelivery.epi_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, epi_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
                <SelectContent>
                  {epis.filter(e => e.quantity > 0).map((epi) => (
                    <SelectItem key={epi.id} value={epi.id}>{epi.name} (Estoque: {epi.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data de Entrega</Label>
                <DateInput 
                  value={newDelivery.delivery_date} 
                  onChange={(date) => setNewDelivery({ ...newDelivery, delivery_date: date })} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={newDelivery.quantity} onChange={(e) => setNewDelivery({ ...newDelivery, quantity: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateDelivery} disabled={createDelivery.isPending}>
              {createDelivery.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Term Dialog */}
      <DeliveryTermDialog open={isTermoDialogOpen} onOpenChange={setIsTermoDialogOpen} />

      {/* View Termo Dialog */}
      <TermoViewDialog 
        open={isViewDialogOpen} 
        onOpenChange={setIsViewDialogOpen} 
        termo={selectedTermo}
      />

      {/* EPIs Report Dialog */}
      <GenericReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        title="Relatório de EPIs"
        subtitle={`Total de ${epis.length} EPIs cadastrados`}
        fileName="relatorio-epis"
        metadata={[
          { label: "Data", value: format(new Date(), "dd/MM/yyyy", { locale: ptBR }) },
          { label: "Total EPIs", value: String(epiStats.total) },
          { label: "Em Uso", value: String(deliveryStats.inUse) },
          { label: "Vencidos", value: String(deliveryStats.expired) },
        ]}
        summaries={[
          { label: "Total EPIs", value: epiStats.total, color: "primary" },
          { label: "Em Uso", value: deliveryStats.inUse, color: "success" },
          { label: "Vencendo (30d)", value: deliveryStats.expiringSoon, color: "warning" },
          { label: "Vencidos", value: deliveryStats.expired, color: "destructive" },
        ]}
        columns={[
          { key: "name", header: "EPI" },
          { key: "category", header: "Categoria", format: (v) => v || "—" },
          { key: "ca_number", header: "CA", format: (v) => v || "—" },
          { key: "quantity", header: "Estoque", align: "center" },
          { key: "min_quantity", header: "Mínimo", align: "center", format: (v) => String(v || 5) },
          { key: "default_validity_days", header: "Validade (dias)", align: "center", format: (v) => String(v || 365) },
          { key: "status", header: "Status", format: (_, row) => {
            return row.quantity <= (row.min_quantity || 5) ? "Baixo" : "Normal";
          }},
        ]}
        data={filteredEPIs}
      />

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedEPIIds.length} EPI(s) selecionado(s)?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteEPIs}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedEPIIds.length} EPI(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
