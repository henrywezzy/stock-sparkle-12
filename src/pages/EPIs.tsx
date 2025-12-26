import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, HardHat, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { epis, epiDeliveries, EPI, EPIDelivery } from "@/data/mockData";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EPIs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);

  const filteredEPIs = epis.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const epiColumns = [
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
            <p className="text-sm text-muted-foreground">CA: {epi.ca}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Categoria" },
    {
      key: "stock",
      header: "Estoque",
      render: (epi: EPI) => (
        <div>
          <span className="font-medium">{epi.stock}</span>
          <span className="text-muted-foreground ml-1">un</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (epi: EPI) => (
        <Badge
          variant={epi.stock <= epi.minStock ? "destructive" : "default"}
          className={
            epi.stock <= epi.minStock
              ? "bg-destructive/20 text-destructive"
              : "bg-success/20 text-success"
          }
        >
          {epi.stock <= epi.minStock ? "Estoque Baixo" : "Normal"}
        </Badge>
      ),
    },
    {
      key: "validity",
      header: "Validade (dias)",
      render: (epi: EPI) => <span>{epi.validityDays}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (epi: EPI) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const deliveryColumns = [
    {
      key: "employee",
      header: "Funcionário",
      render: (delivery: EPIDelivery) => (
        <span className="font-medium">{delivery.employeeName}</span>
      ),
    },
    {
      key: "epi",
      header: "EPI",
      render: (delivery: EPIDelivery) => (
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-primary" />
          <span>{delivery.epiName}</span>
        </div>
      ),
    },
    {
      key: "deliveryDate",
      header: "Data Entrega",
      render: (delivery: EPIDelivery) => (
        <span>{format(new Date(delivery.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}</span>
      ),
    },
    {
      key: "expiryDate",
      header: "Vencimento",
      render: (delivery: EPIDelivery) => (
        <span>{format(new Date(delivery.expiryDate), "dd/MM/yyyy", { locale: ptBR })}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (delivery: EPIDelivery) => {
        const statusConfig = {
          in_use: { label: "Em uso", color: "bg-success/20 text-success", icon: CheckCircle },
          returned: { label: "Devolvido", color: "bg-muted text-muted-foreground", icon: Clock },
          expired: { label: "Vencido", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
        };
        const config = statusConfig[delivery.status];
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
          <div className="flex gap-2">
            <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrega
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle>Registrar Entrega de EPI</DialogTitle>
                  <DialogDescription>
                    Vincule um EPI a um funcionário
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Funcionário</Label>
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
                    <Label>EPI</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o EPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {epis.map((epi) => (
                          <SelectItem key={epi.id} value={epi.id}>
                            {epi.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Data de Entrega</Label>
                      <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Quantidade</Label>
                      <Input type="number" defaultValue="1" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="gradient-primary text-primary-foreground"
                    onClick={() => {
                      toast({ title: "Entrega registrada!", description: "EPI entregue com sucesso." });
                      setIsDeliveryDialogOpen(false);
                    }}
                  >
                    Registrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground glow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo EPI
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo EPI</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do EPI
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do EPI</Label>
                    <Input id="name" placeholder="Ex: Capacete de Segurança" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cabeca">Proteção da Cabeça</SelectItem>
                          <SelectItem value="maos">Proteção das Mãos</SelectItem>
                          <SelectItem value="visual">Proteção Visual</SelectItem>
                          <SelectItem value="auditiva">Proteção Auditiva</SelectItem>
                          <SelectItem value="pes">Proteção dos Pés</SelectItem>
                          <SelectItem value="respiratoria">Proteção Respiratória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ca">CA (Certificado)</Label>
                      <Input id="ca" placeholder="00000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="validity">Validade (dias)</Label>
                      <Input id="validity" type="number" placeholder="365" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Estoque Inicial</Label>
                      <Input id="stock" type="number" placeholder="0" />
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
                      toast({ title: "EPI cadastrado!", description: "O EPI foi adicionado com sucesso." });
                      setIsDialogOpen(false);
                    }}
                  >
                    Cadastrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
            <p className="text-2xl font-bold">{epis.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Em Uso</p>
            <p className="text-2xl font-bold">{epiDeliveries.filter((d) => d.status === "in_use").length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencendo (30d)</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="text-2xl font-bold">{epiDeliveries.filter((d) => d.status === "expired").length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="inventory">Inventário de EPIs</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar EPIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <DataTable columns={epiColumns} data={filteredEPIs} />
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <DataTable columns={deliveryColumns} data={epiDeliveries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
