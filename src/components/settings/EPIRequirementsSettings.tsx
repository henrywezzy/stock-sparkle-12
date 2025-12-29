import { useState, useMemo } from "react";
import { Plus, Trash2, Shield, Briefcase, Building, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useEPIRequirements, EPIRequirement, EPIRequirementFormData } from "@/hooks/useEPIRequirements";
import { useEPIs } from "@/hooks/useEPIs";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";

export function EPIRequirementsSettings() {
  const { requirements, isLoading, createRequirement, updateRequirement, deleteRequirement } = useEPIRequirements();
  const { epis } = useEPIs();
  const { employees } = useEmployees();
  const { canEdit, canDelete } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<EPIRequirement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<EPIRequirementFormData>({
    epi_category: "",
    department: null,
    position: null,
    is_mandatory: true,
    notes: null,
  });

  // Get unique EPI categories
  const epiCategories = useMemo(() => {
    const cats = new Set<string>();
    epis.forEach(epi => {
      if (epi.category) cats.add(epi.category);
    });
    return Array.from(cats).sort();
  }, [epis]);

  // Get unique departments and positions from employees
  const { departments, positions } = useMemo(() => {
    const depts = new Set<string>();
    const pos = new Set<string>();
    
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
      if (emp.position) pos.add(emp.position);
    });

    return {
      departments: Array.from(depts).sort(),
      positions: Array.from(pos).sort(),
    };
  }, [employees]);

  // Group requirements by type (department or position)
  const groupedRequirements = useMemo(() => {
    const byDepartment: Record<string, EPIRequirement[]> = {};
    const byPosition: Record<string, EPIRequirement[]> = {};

    requirements.forEach(req => {
      if (req.department) {
        if (!byDepartment[req.department]) byDepartment[req.department] = [];
        byDepartment[req.department].push(req);
      }
      if (req.position) {
        if (!byPosition[req.position]) byPosition[req.position] = [];
        byPosition[req.position].push(req);
      }
    });

    return { byDepartment, byPosition };
  }, [requirements]);

  const resetForm = () => {
    setFormData({
      epi_category: "",
      department: null,
      position: null,
      is_mandatory: true,
      notes: null,
    });
    setEditingRequirement(null);
  };

  const handleOpenDialog = (requirement?: EPIRequirement) => {
    if (requirement) {
      setEditingRequirement(requirement);
      setFormData({
        epi_category: requirement.epi_category,
        department: requirement.department,
        position: requirement.position,
        is_mandatory: requirement.is_mandatory,
        notes: requirement.notes,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.epi_category || (!formData.department && !formData.position)) return;

    if (editingRequirement) {
      await updateRequirement.mutateAsync({
        id: editingRequirement.id,
        ...formData,
      });
    } else {
      await createRequirement.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteRequirement.mutateAsync(deletingId);
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            EPIs Obrigatórios por Cargo/Setor
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure quais categorias de EPI são obrigatórias para cada cargo ou setor
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Requisito
          </Button>
        )}
      </div>

      {requirements.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum requisito de EPI configurado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure EPIs obrigatórios por cargo ou setor para receber alertas de conformidade
          </p>
          {canEdit && (
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar requisito
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Department */}
          <div className="glass rounded-xl p-4">
            <h4 className="font-medium flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-primary" />
              Por Setor
            </h4>
            {Object.keys(groupedRequirements.byDepartment).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum requisito por setor
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedRequirements.byDepartment).map(([dept, reqs]) => (
                  <div key={dept} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{dept}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {reqs.length} EPI{reqs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reqs.map(req => (
                        <Badge
                          key={req.id}
                          variant={req.is_mandatory ? "default" : "secondary"}
                          className="cursor-pointer group"
                          onClick={() => canEdit && handleOpenDialog(req)}
                        >
                          {req.epi_category}
                          {canDelete && (
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(req.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Position */}
          <div className="glass rounded-xl p-4">
            <h4 className="font-medium flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-primary" />
              Por Cargo
            </h4>
            {Object.keys(groupedRequirements.byPosition).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum requisito por cargo
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedRequirements.byPosition).map(([pos, reqs]) => (
                  <div key={pos} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{pos}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {reqs.length} EPI{reqs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reqs.map(req => (
                        <Badge
                          key={req.id}
                          variant={req.is_mandatory ? "default" : "secondary"}
                          className="cursor-pointer group"
                          onClick={() => canEdit && handleOpenDialog(req)}
                        >
                          {req.epi_category}
                          {canDelete && (
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(req.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRequirement ? "Editar Requisito" : "Novo Requisito de EPI"}
            </DialogTitle>
            <DialogDescription>
              Configure qual categoria de EPI é obrigatória para um cargo ou setor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* EPI Category */}
            <div className="space-y-2">
              <Label>Categoria de EPI *</Label>
              <Select
                value={formData.epi_category}
                onValueChange={(value) => setFormData({ ...formData, epi_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {epiCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={formData.department || "none"}
                onValueChange={(value) => setFormData({ ...formData, department: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.position || "none"}
                onValueChange={(value) => setFormData({ ...formData, position: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Mandatory */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Obrigatório</Label>
                <p className="text-xs text-muted-foreground">
                  EPIs obrigatórios geram alertas quando não atendidos
                </p>
              </div>
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                placeholder="Observações sobre este requisito..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.epi_category ||
                (!formData.department && !formData.position) ||
                createRequirement.isPending ||
                updateRequirement.isPending
              }
            >
              {(createRequirement.isPending || updateRequirement.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingRequirement ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este requisito de EPI? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRequirement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
