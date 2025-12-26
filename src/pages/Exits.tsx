import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye, ArrowUpFromLine, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exits, Exit } from "@/data/mockData";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Exits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredExits = exits.filter(
    (e) =>
      e.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "date",
      header: "Data",
      render: (exit: Exit) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{format(new Date(exit.date), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: "product",
      header: "Produto",
      render: (exit: Exit) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <ArrowUpFromLine className="w-4 h-4 text-destructive" />
          </div>
          <span className="font-medium">{exit.product}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantidade",
      render: (exit: Exit) => (
        <span className="font-semibold text-destructive">-{exit.quantity}</span>
      ),
    },
    { key: "destination", header: "Destino/Setor" },
    { key: "employee", header: "Funcionário" },
    {
      key: "notes",
      header: "Observações",
      render: (exit: Exit) => (
        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
          {exit.notes || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (exit: Exit) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => toast({ title: "Saída excluída", description: "O registro foi removido." })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saídas"
        description="Registre e gerencie todas as saídas de produtos"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Saídas" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Nova Saída</DialogTitle>
                <DialogDescription>
                  Preencha as informações da saída de produtos
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product">Produto</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parafuso">Parafuso Phillips 6mm</SelectItem>
                      <SelectItem value="luva">Luva de Proteção Nitrílica</SelectItem>
                      <SelectItem value="oleo">Óleo Lubrificante WD-40</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input id="quantity" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destino/Setor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
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
                  <Label htmlFor="employee">Funcionário que Retirou</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Carlos Mendes</SelectItem>
                      <SelectItem value="roberto">Roberto Alves</SelectItem>
                      <SelectItem value="fernando">Fernando Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" placeholder="Ordem de serviço, motivo, etc..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => {
                    toast({ title: "Saída registrada!", description: "A saída foi registrada com sucesso." });
                    setIsDialogOpen(false);
                  }}
                >
                  Registrar Saída
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
            placeholder="Buscar por produto ou funcionário..."
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
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ArrowUpFromLine className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Saídas</p>
            <p className="text-2xl font-bold">{exits.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Este Mês</p>
            <p className="text-2xl font-bold">{exits.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <span className="text-xl font-bold text-warning">∑</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Itens Retirados</p>
            <p className="text-2xl font-bold">{exits.reduce((acc, e) => acc + e.quantity, 0)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredExits} />
    </div>
  );
}
