import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, ArrowUpFromLine, Calendar, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExits, Exit, ExitFormData } from "@/hooks/useExits";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataFilters } from "@/components/filters/DataFilters";

export default function Exits() {
  const { exits, isLoading, createExit, updateExit, deleteExit } = useExits();
  const { products } = useProducts();
  const { employees } = useEmployees();
  const { canEdit, canDelete } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExit, setEditingExit] = useState<Exit | null>(null);
  const [deletingExitId, setDeletingExitId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<ExitFormData>({
    product_id: "",
    employee_id: "",
    quantity: 0,
    destination: "",
    reason: "",
    notes: "",
  });

  const filteredExits = useMemo(() => {
    return exits.filter((exit) => {
      const matchesSearch =
        exit.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exit.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exit.destination?.toLowerCase().includes(searchTerm.toLowerCase());

      const exitDate = new Date(exit.exit_date);
      const matchesDateFrom = !dateFrom || exitDate >= dateFrom;
      const matchesDateTo = !dateTo || exitDate <= dateTo;
      const matchesEmployee = selectedEmployee === "all" || exit.employee_id === selectedEmployee;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesEmployee;
    });
  }, [exits, searchTerm, dateFrom, dateTo, selectedEmployee]);

  const resetForm = () => {
    setFormData({
      product_id: "",
      employee_id: "",
      quantity: 0,
      destination: "",
      reason: "",
      notes: "",
    });
    setEditingExit(null);
  };

  const handleOpenDialog = (exit?: Exit) => {
    if (exit) {
      setEditingExit(exit);
      setFormData({
        product_id: exit.product_id,
        employee_id: exit.employee_id || "",
        quantity: exit.quantity,
        destination: exit.destination || "",
        reason: exit.reason || "",
        notes: exit.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.product_id || formData.quantity <= 0) return;

    if (editingExit) {
      await updateExit.mutateAsync({
        id: editingExit.id,
        ...formData,
      });
    } else {
      await createExit.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingExitId) return;
    await deleteExit.mutateAsync(deletingExitId);
    setIsDeleteDialogOpen(false);
    setDeletingExitId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingExitId(id);
    setIsDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedEmployee("all");
  };

  const columns = [
    {
      key: "date",
      header: "Data",
      render: (exit: Exit) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <span className="text-sm">{format(new Date(exit.exit_date), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: "product",
      header: "Produto",
      render: (exit: Exit) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <ArrowUpFromLine className="w-4 h-4 text-destructive" />
          </div>
          <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{exit.products?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qtd",
      render: (exit: Exit) => (
        <span className="font-semibold text-destructive">-{exit.quantity}</span>
      ),
    },
    {
      key: "destination",
      header: "Destino",
      className: "hidden md:table-cell",
      render: (exit: Exit) => exit.destination || "—",
    },
    {
      key: "employee",
      header: "Funcionário",
      className: "hidden lg:table-cell",
      render: (exit: Exit) => exit.employees?.name || "—",
    },
    {
      key: "actions",
      header: "",
      render: (exit: Exit) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => handleOpenDialog(exit)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => openDeleteDialog(exit.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

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
        title="Saídas"
        description="Registre e gerencie todas as saídas de produtos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Saídas" }]}
        actions={
          canEdit && (
            <Button
              className="gradient-primary text-primary-foreground glow-sm"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Saída</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )
        }
      />

      {/* Filters */}
      <DataFilters
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por produto, funcionário..."
        showDateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        showEmployeeFilter
        employees={employees.map((e) => ({ value: e.id, label: e.name }))}
        selectedEmployee={selectedEmployee}
        onEmployeeChange={setSelectedEmployee}
        onClearFilters={clearFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{exits.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl font-bold text-warning">∑</span>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Itens</p>
            <p className="text-xl sm:text-2xl font-bold">{exits.reduce((acc, e) => acc + e.quantity, 0)}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Filtrados</p>
            <p className="text-xl sm:text-2xl font-bold">{filteredExits.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DataTable columns={columns} data={filteredExits} />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExit ? "Editar Saída" : "Registrar Nova Saída"}</DialogTitle>
            <DialogDescription>
              {editingExit ? "Altere as informações da saída" : "Preencha as informações da saída de produtos"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Produto *</Label>
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
                      {product.name} (Estoque: {product.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destino/Setor</Label>
                <Input
                  id="destination"
                  value={formData.destination || ""}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Ex: Produção"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                value={formData.reason || ""}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Motivo da retirada"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
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
              disabled={!formData.product_id || formData.quantity <= 0 || createExit.isPending || updateExit.isPending}
            >
              {(createExit.isPending || updateExit.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingExit ? "Salvar" : "Registrar"}
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
              Tem certeza que deseja excluir esta saída? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
