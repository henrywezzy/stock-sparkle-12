import { useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Truck, Mail, Phone, MapPin, Star, Loader2, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Badge } from "@/components/ui/badge";
import { ViaCEPResponse, CNPJResponse } from "@/lib/masks";
import { useSuppliers, Supplier, SupplierFormData } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Suppliers() {
  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { canEdit, canDelete } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    cnpj: "",
    status: "active",
    rating: 5,
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      cnpj: "",
      status: "active",
      rating: 5,
    });
    setEditingSupplier(null);
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        cnpj: supplier.cnpj || "",
        status: supplier.status || "active",
        rating: supplier.rating || 5,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    if (editingSupplier) {
      await updateSupplier.mutateAsync({
        id: editingSupplier.id,
        ...formData,
      });
    } else {
      await createSupplier.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingSupplierId) return;
    await deleteSupplier.mutateAsync(deletingSupplierId);
    setIsDeleteDialogOpen(false);
    setDeletingSupplierId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingSupplierId(id);
    setIsDeleteDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-warning fill-warning" : "text-muted-foreground"}`}
      />
    ));
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
        title="Fornecedores"
        description="Gerencie os fornecedores cadastrados"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Fornecedores" }]}
        actions={
          canEdit && (
            <Button
              className="gradient-primary text-primary-foreground glow-sm"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Fornecedor</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{suppliers.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Ativos</p>
            <p className="text-xl sm:text-2xl font-bold">{suppliers.filter((s) => s.status === "active").length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-secondary/50 border-border/50"
        />
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
          {canEdit && (
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro fornecedor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="glass rounded-xl p-4 sm:p-6 glass-hover animate-slide-up"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{supplier.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{supplier.cnpj || "Sem CNPJ"}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleOpenDialog(supplier)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeleteDialog(supplier.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                {supplier.contact_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">{supplier.contact_name}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1">
                  {renderStars(supplier.rating || 5)}
                  <span className="text-xs sm:text-sm font-medium ml-1">{(supplier.rating || 5).toFixed(1)}</span>
                </div>
                <Badge
                  className={
                    supplier.status === "active"
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  }
                >
                  {supplier.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Altere as informações do fornecedor" : "Preencha as informações do fornecedor"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome/Razão Social *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <MaskedInput
                  id="cnpj"
                  mask="cnpj"
                  value={formData.cnpj || ""}
                  onChange={(value) => setFormData({ ...formData, cnpj: value })}
                  placeholder="00.000.000/0000-00"
                  onCompanyFound={(company: CNPJResponse) => {
                    setFormData(prev => ({
                      ...prev,
                      name: company.razao_social || prev.name,
                      contact_name: prev.contact_name,
                      address: company.logradouro ? `${company.logradouro}, ${company.numero}, ${company.bairro} - ${company.municipio}/${company.uf}` : prev.address,
                      phone: company.telefone || prev.phone,
                      email: company.email || prev.email,
                    }));
                    toast({
                      title: "Dados encontrados!",
                      description: `Empresa: ${company.razao_social}`,
                    });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Nome do Contato</Label>
              <Input
                id="contact"
                value={formData.contact_name || ""}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Nome da pessoa de contato"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <MaskedInput
                  id="phone"
                  mask="phone"
                  value={formData.phone || ""}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div className="grid gap-2">
              <Label>Avaliação</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: i + 1 })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        i < (formData.rating || 5) ? "text-warning fill-warning" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({formData.rating || 5}/5)</span>
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
              disabled={!formData.name || createSupplier.isPending || updateSupplier.isPending}
            >
              {(createSupplier.isPending || updateSupplier.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSupplier ? "Salvar" : "Cadastrar"}
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
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}