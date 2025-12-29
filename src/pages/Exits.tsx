import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, ArrowUpFromLine, Calendar, Loader2, Search, Package, Hash, X, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { GenericReportDialog, ReportColumn, ReportSummary } from "@/components/reports/GenericReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExits, Exit, ExitFormData } from "@/hooks/useExits";
import { useProducts } from "@/hooks/useProducts";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { ColumnSettings } from "@/components/ui/column-settings";
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataFilters } from "@/components/filters/DataFilters";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Colunas padrão para a tabela
const DEFAULT_COLUMNS = [
  { key: "date", label: "Data", visible: true },
  { key: "sku", label: "ID (SKU)", visible: true },
  { key: "product", label: "Produto", visible: true },
  { key: "quantity", label: "Quantidade", visible: true },
  { key: "destination", label: "Destino", visible: true },
  { key: "employee", label: "Funcionário", visible: true },
  { key: "reason", label: "Motivo", visible: false },
  { key: "notes", label: "Observações", visible: false },
  { key: "actions", label: "Ações", visible: true },
];

export default function Exits() {
  const { exits, isLoading, createExit, updateExit, deleteExit } = useExits();
  const { products } = useProducts();
  const { employees } = useEmployees();
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  const {
    columns,
    visibleColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useColumnPreferences("exits", DEFAULT_COLUMNS);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingExit, setEditingExit] = useState<Exit | null>(null);
  const [deletingExitId, setDeletingExitId] = useState<string | null>(null);
  const [selectedExitIds, setSelectedExitIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  // Product search state
  const [productSearchMode, setProductSearchMode] = useState<"id" | "name">("name");
  const [productIdSearch, setProductIdSearch] = useState("");
  const [productNameSearch, setProductNameSearch] = useState("");
  const [foundProduct, setFoundProduct] = useState<typeof products[0] | null>(null);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExitFormData>({
    product_id: "",
    employee_id: "",
    quantity: 0,
    destination: "",
    reason: "",
    notes: "",
  });

  // SKU autocomplete for ID search
  const filteredProductsBySKU = useMemo(() => {
    if (!productIdSearch.trim()) return [];
    return products
      .filter((p) => p.sku?.toLowerCase().startsWith(productIdSearch.toLowerCase()))
      .slice(0, 8);
  }, [products, productIdSearch]);

  // Select product from SKU suggestions
  const selectProductFromSKU = (product: typeof products[0]) => {
    setFoundProduct(product);
    setProductIdSearch(product.sku || "");
    setFormData((prev) => ({ ...prev, product_id: product.id }));
    setShowSkuSuggestions(false);
    toast({
      title: "Produto encontrado!",
      description: `${product.name} (${product.sku})`,
    });
  };

  // Buscar produto por nome (autocomplete)
  const filteredProducts = useMemo(() => {
    if (!productNameSearch.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(productNameSearch.toLowerCase()))
      .slice(0, 5);
  }, [products, productNameSearch]);

  const selectProduct = (product: typeof products[0]) => {
    setFoundProduct(product);
    setProductNameSearch(product.name);
    setFormData((prev) => ({ ...prev, product_id: product.id }));
  };

  const clearProductSelection = () => {
    setFoundProduct(null);
    setProductIdSearch("");
    setProductNameSearch("");
    setFormData((prev) => ({ ...prev, product_id: "" }));
  };

  const filteredExits = useMemo(() => {
    return exits.filter((exit) => {
      const product = products.find((p) => p.id === exit.product_id);
      const matchesSearch =
        exit.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exit.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exit.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const exitDate = new Date(exit.exit_date);
      const matchesDateFrom = !dateFrom || exitDate >= dateFrom;
      const matchesDateTo = !dateTo || exitDate <= dateTo;
      const matchesEmployee = selectedEmployee === "all" || exit.employee_id === selectedEmployee;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesEmployee;
    });
  }, [exits, products, searchTerm, dateFrom, dateTo, selectedEmployee]);

  const handleSelectExit = (id: string) => {
    setSelectedExitIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllExits = (checked: boolean) => {
    setSelectedExitIds(checked ? filteredExits.map(e => e.id) : []);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedExitIds) {
      await deleteExit.mutateAsync(id);
    }
    setSelectedExitIds([]);
    setIsBulkDeleteDialogOpen(false);
  };

  const getExportData = () => {
    const dataToExport = selectedExitIds.length > 0 
      ? filteredExits.filter(e => selectedExitIds.includes(e.id))
      : filteredExits;
    return dataToExport;
  };

  const exportColumns = [
    { key: "exit_date", header: "Data", render: (e: Exit) => format(new Date(e.exit_date), "dd/MM/yyyy") },
    { key: "sku", header: "SKU", render: (e: Exit) => products.find(p => p.id === e.product_id)?.sku || "" },
    { key: "product", header: "Produto", render: (e: Exit) => e.products?.name || "" },
    { key: "quantity", header: "Quantidade", render: (e: Exit) => String(e.quantity) },
    { key: "destination", header: "Destino", render: (e: Exit) => e.destination || "" },
    { key: "employee", header: "Funcionário", render: (e: Exit) => e.employees?.name || "" },
    { key: "reason", header: "Motivo", render: (e: Exit) => e.reason || "" },
  ];

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
    setFoundProduct(null);
    setProductIdSearch("");
    setProductNameSearch("");
    setProductSearchMode("name");
    setShowSkuSuggestions(false);
  };

  const handleOpenDialog = (exit?: Exit) => {
    if (exit) {
      setEditingExit(exit);
      const product = products.find((p) => p.id === exit.product_id);
      setFoundProduct(product || null);
      setProductNameSearch(product?.name || "");
      setProductIdSearch(product?.sku || "");
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
    if (!formData.product_id || formData.quantity <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive",
      });
      return;
    }

    // Verificar estoque
    const product = products.find((p) => p.id === formData.product_id);
    if (product && formData.quantity > product.quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Estoque disponível: ${product.quantity} unidades`,
        variant: "destructive",
      });
      return;
    }

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
    setSearchTerm("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedEmployee("all");
  };

  const renderCell = (exit: Exit, columnKey: string) => {
    const product = products.find((p) => p.id === exit.product_id);

    switch (columnKey) {
      case "date":
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(exit.exit_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        );
      case "sku":
        return (
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {product?.sku || "—"}
          </span>
        );
      case "product":
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="w-4 h-4 text-destructive" />
            </div>
            <span className="font-medium text-sm">{exit.products?.name || "—"}</span>
          </div>
        );
      case "quantity":
        return <span className="font-semibold text-destructive">-{exit.quantity}</span>;
      case "destination":
        return exit.destination || "—";
      case "employee":
        return exit.employees?.name || "—";
      case "reason":
        return exit.reason || "—";
      case "notes":
        return exit.notes ? (
          <span className="max-w-[150px] truncate block" title={exit.notes}>
            {exit.notes}
          </span>
        ) : (
          "—"
        );
      case "actions":
        return (
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
        );
      default:
        return "—";
    }
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
        title="Saídas"
        description="Registre e gerencie todas as saídas de produtos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Saídas" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Relatório</span>
            </Button>
            <ColumnSettings
              columns={columns}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetToDefaults}
            />
            {canEdit && (
              <Button
                className="gradient-primary text-primary-foreground glow-sm"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nova Saída</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <DataFilters
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por produto, SKU, funcionário..."
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
            <p className="text-xl sm:text-2xl font-bold">
              {exits.reduce((acc, e) => acc + e.quantity, 0)}
            </p>
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

      {/* Bulk Actions */}
      {selectedExitIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedExitIds.length} item(s) selecionado(s)
          </span>
          <ExportDropdown
            title="Saídas Selecionadas"
            filename="saidas-selecionadas"
            columns={exportColumns}
            data={getExportData()}
            selectedCount={selectedExitIds.length}
          />
          {canDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir selecionados
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedExitIds([])}
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedExitIds.length === filteredExits.length && filteredExits.length > 0}
                    onCheckedChange={handleSelectAllExits}
                  />
                </TableHead>
                {visibleColumns.map((col) => (
                  <TableHead key={col.key} className="text-muted-foreground">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma saída encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredExits.map((exit) => (
                  <TableRow 
                    key={exit.id} 
                    className={`border-border ${selectedExitIds.includes(exit.id) ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedExitIds.includes(exit.id)}
                        onCheckedChange={() => handleSelectExit(exit.id)}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={`${exit.id}-${col.key}`}>
                        {renderCell(exit, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExit ? "Editar Saída" : "Registrar Nova Saída"}
            </DialogTitle>
            <DialogDescription>
              {editingExit
                ? "Altere as informações da saída"
                : "Busque por ID ou nome do produto para registrar a saída"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Product Search Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={productSearchMode === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setProductSearchMode("name");
                  clearProductSelection();
                }}
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Por Nome
              </Button>
              <Button
                type="button"
                variant={productSearchMode === "id" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setProductSearchMode("id");
                  clearProductSelection();
                }}
                className="flex-1"
              >
                <Hash className="w-4 h-4 mr-2" />
                Por ID (SKU)
              </Button>
            </div>

            {/* Product Search by ID with Autocomplete */}
            {productSearchMode === "id" && (
              <div className="grid gap-2">
                <Label htmlFor="product_id">ID do Produto (SKU)</Label>
                <div className="relative">
                  <Input
                    id="product_id"
                    value={productIdSearch}
                    onChange={(e) => {
                      setProductIdSearch(e.target.value.toUpperCase());
                      setShowSkuSuggestions(true);
                      setFoundProduct(null);
                      setFormData((prev) => ({ ...prev, product_id: "" }));
                    }}
                    onFocus={() => setShowSkuSuggestions(true)}
                    placeholder="Digite o início do SKU..."
                    className="font-mono"
                  />
                  {showSkuSuggestions && productIdSearch && !foundProduct && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredProductsBySKU.length > 0 ? (
                        filteredProductsBySKU.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProductFromSKU(product)}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium">{product.sku}</span>
                              <span className="text-xs text-muted-foreground">{product.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Estoque: {product.quantity}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          Nenhum produto encontrado com este SKU
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Search by Name */}
            {productSearchMode === "name" && (
              <div className="grid gap-2">
                <Label htmlFor="product_name">Nome do Produto *</Label>
                <div className="relative">
                  <Input
                    id="product_name"
                    value={productNameSearch}
                    onChange={(e) => {
                      setProductNameSearch(e.target.value);
                      setFoundProduct(null);
                      setFormData((prev) => ({ ...prev, product_id: "" }));
                    }}
                    placeholder="Digite o nome do produto..."
                  />
                  {productNameSearch && !foundProduct && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProduct(product)}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium">{product.name}</span>
                              {product.sku && (
                                <span className="text-xs text-muted-foreground ml-2 font-mono">
                                  {product.sku}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Estoque: {product.quantity}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Nenhum produto encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Product Display */}
            {foundProduct && (
              <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Package className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{foundProduct.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {foundProduct.sku || "Sem ID"} • Estoque: {foundProduct.quantity}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearProductSelection}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={foundProduct?.quantity || undefined}
                  value={formData.quantity || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setFormData({ ...formData, quantity: value === "" ? 0 : parseInt(value) });
                    }
                  }}
                  placeholder="Quantidade"
                />
                {foundProduct && (
                  <p className="text-xs text-muted-foreground">
                    Máximo: {foundProduct.quantity}
                  </p>
                )}
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
                  {employees
                    .filter((e) => e.status === "active")
                    .map((employee) => (
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
              disabled={
                !formData.product_id ||
                formData.quantity <= 0 ||
                createExit.isPending ||
                updateExit.isPending
              }
            >
              {(createExit.isPending || updateExit.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
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

      {/* Exits Report Dialog */}
      <GenericReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        title="Relatório de Saídas"
        subtitle={`Total de ${filteredExits.length} saídas registradas`}
        fileName="relatorio-saidas"
        metadata={[
          { label: "Data", value: format(new Date(), "dd/MM/yyyy", { locale: ptBR }) },
          { label: "Total Saídas", value: String(exits.length) },
          { label: "Itens Movimentados", value: String(exits.reduce((acc, e) => acc + e.quantity, 0)) },
        ]}
        summaries={[
          { label: "Total Saídas", value: exits.length, color: "primary" },
          { label: "Itens", value: exits.reduce((acc, e) => acc + e.quantity, 0), color: "destructive" },
          { label: "Filtrados", value: filteredExits.length, color: "muted" },
        ]}
        columns={[
          { key: "exit_date", header: "Data", format: (v) => format(new Date(v), "dd/MM/yyyy", { locale: ptBR }) },
          { key: "products", header: "Produto", format: (v) => v?.name || "—" },
          { key: "quantity", header: "Qtd.", align: "center" },
          { key: "destination", header: "Destino", format: (v) => v || "—" },
          { key: "employees", header: "Funcionário", format: (v) => v?.name || "—" },
          { key: "reason", header: "Motivo", format: (v) => v || "—" },
        ]}
        data={filteredExits}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedExitIds.length} saída(s)? 
              Esta ação não pode ser desfeita e o estoque será ajustado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedExitIds.length} item(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
