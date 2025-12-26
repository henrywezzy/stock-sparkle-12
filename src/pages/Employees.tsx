import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye, UserCircle, Mail, Phone, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { employees, Employee } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Gerencie os funcionários da empresa"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Gestão de Pessoas" },
          { label: "Funcionários" },
        ]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                <DialogDescription>
                  Preencha as informações do funcionário
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" placeholder="Nome do funcionário" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registration">Matrícula</Label>
                    <Input id="registration" placeholder="EMP000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admission">Data de Admissão</Label>
                    <Input id="admission" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">Setor</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="producao">Produção</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="eletrica">Elétrica</SelectItem>
                        <SelectItem value="logistica">Logística</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input id="position" placeholder="Cargo do funcionário" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="email@empresa.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => {
                    toast({ title: "Funcionário cadastrado!", description: "O funcionário foi adicionado com sucesso." });
                    setIsDialogOpen(false);
                  }}
                >
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold">{employees.filter((e) => e.status === "active").length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold">{employees.filter((e) => e.status === "inactive").length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Setores</p>
            <p className="text-2xl font-bold">{new Set(employees.map((e) => e.department)).size}</p>
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="glass rounded-xl p-6 glass-hover animate-slide-up"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">
                    {employee.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{employee.registration}</p>
                </div>
              </div>
              <Badge
                variant={employee.status === "active" ? "default" : "secondary"}
                className={
                  employee.status === "active"
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                }
              >
                {employee.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{employee.department} - {employee.position}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{employee.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-primary">
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-primary">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => toast({ title: "Funcionário desativado", description: `${employee.name} foi desativado.` })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
