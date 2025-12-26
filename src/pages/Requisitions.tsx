import { useState } from "react";
import { Plus, Search, Filter, Check, X, Clock, ClipboardList, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface Requisition {
  id: string;
  date: string;
  requester: string;
  department: string;
  items: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
}

const requisitions: Requisition[] = [
  { id: "REQ001", date: "2024-01-15", requester: "Carlos Mendes", department: "Produção", items: "Parafusos (100un), Luvas (10 pares)", status: "pending", priority: "high" },
  { id: "REQ002", date: "2024-01-14", requester: "Roberto Alves", department: "Manutenção", items: "Óleo WD-40 (5un), Chaves (3un)", status: "approved", priority: "medium" },
  { id: "REQ003", date: "2024-01-13", requester: "Fernando Dias", department: "Elétrica", items: "Cabo elétrico (50m), Fita isolante (10un)", status: "pending", priority: "medium" },
  { id: "REQ004", date: "2024-01-12", requester: "Lucas Oliveira", department: "Manutenção", items: "Capacetes (5un)", status: "rejected", priority: "low" },
  { id: "REQ005", date: "2024-01-11", requester: "Marcos Souza", department: "Produção", items: "Óculos de proteção (15un)", status: "approved", priority: "high" },
];

export default function Requisitions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredRequisitions = requisitions.filter(
    (r) =>
      r.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "id",
      header: "Nº",
      render: (req: Requisition) => (
        <span className="font-mono text-sm">{req.id}</span>
      ),
    },
    {
      key: "date",
      header: "Data",
      render: (req: Requisition) => (
        <span>{new Date(req.date).toLocaleDateString("pt-BR")}</span>
      ),
    },
    { key: "requester", header: "Solicitante" },
    { key: "department", header: "Setor" },
    {
      key: "items",
      header: "Itens",
      render: (req: Requisition) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {req.items}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Prioridade",
      render: (req: Requisition) => {
        const config = {
          low: { label: "Baixa", color: "bg-muted text-muted-foreground" },
          medium: { label: "Média", color: "bg-warning/20 text-warning" },
          high: { label: "Alta", color: "bg-destructive/20 text-destructive" },
        };
        return <Badge className={config[req.priority].color}>{config[req.priority].label}</Badge>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (req: Requisition) => {
        const config = {
          pending: { label: "Pendente", color: "bg-warning/20 text-warning", icon: Clock },
          approved: { label: "Aprovada", color: "bg-success/20 text-success", icon: Check },
          rejected: { label: "Rejeitada", color: "bg-destructive/20 text-destructive", icon: X },
        };
        const Icon = config[req.status].icon;
        return (
          <Badge className={config[req.status].color}>
            <Icon className="w-3 h-3 mr-1" />
            {config[req.status].label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (req: Requisition) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Eye className="w-4 h-4" />
          </Button>
          {req.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-success"
                onClick={() => toast({ title: "Requisição aprovada!", description: `${req.id} foi aprovada.` })}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => toast({ title: "Requisição rejeitada", description: `${req.id} foi rejeitada.` })}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisições"
        description="Gerencie as solicitações de materiais"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Requisições" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Requisição
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Requisição de Material</DialogTitle>
                <DialogDescription>
                  Solicite materiais do almoxarifado
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Setor</Label>
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
                    <Label>Prioridade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Itens Solicitados</Label>
                  <Textarea placeholder="Descreva os itens e quantidades necessárias..." rows={4} />
                </div>
                <div className="grid gap-2">
                  <Label>Justificativa</Label>
                  <Textarea placeholder="Motivo da solicitação..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => {
                    toast({ title: "Requisição enviada!", description: "Sua solicitação foi enviada para aprovação." });
                    setIsDialogOpen(false);
                  }}
                >
                  Enviar Requisição
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{requisitions.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold">{requisitions.filter((r) => r.status === "pending").length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
            <p className="text-2xl font-bold">{requisitions.filter((r) => r.status === "approved").length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <X className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rejeitadas</p>
            <p className="text-2xl font-bold">{requisitions.filter((r) => r.status === "rejected").length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por solicitante ou setor..."
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

      {/* Table */}
      <DataTable columns={columns} data={filteredRequisitions} />
    </div>
  );
}
