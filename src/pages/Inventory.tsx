import { useState } from "react";
import { Plus, Search, Archive, CheckCircle, AlertTriangle, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { products, Product } from "@/data/mockData";
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
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      header: "Produto",
      render: (product: Product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.location}</p>
        </div>
      ),
    },
    { key: "category", header: "Categoria" },
    {
      key: "systemQty",
      header: "Qtd. Sistema",
      render: (product: Product) => (
        <span className="font-medium">{product.quantity}</span>
      ),
    },
    {
      key: "physicalQty",
      header: "Qtd. Física",
      render: () => (
        <Input
          type="number"
          className="w-24 h-8"
          placeholder="0"
        />
      ),
    },
    {
      key: "difference",
      header: "Diferença",
      render: () => (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => (
        <Badge className="bg-muted text-muted-foreground">
          Pendente
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário"
        description="Realize contagens e auditorias do estoque"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Inventário" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Inventário
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle>Iniciar Novo Inventário</DialogTitle>
                <DialogDescription>
                  Selecione o tipo de inventário a ser realizado
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo de Inventário</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left">
                      <ClipboardCheck className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium">Completo</p>
                      <p className="text-sm text-muted-foreground">Todos os produtos</p>
                    </button>
                    <button className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left">
                      <Archive className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium">Por Categoria</p>
                      <p className="text-sm text-muted-foreground">Categoria específica</p>
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input id="responsible" placeholder="Nome do responsável" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => {
                    toast({ title: "Inventário iniciado!", description: "O inventário foi criado com sucesso." });
                    setIsDialogOpen(false);
                  }}
                >
                  Iniciar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Progress Card */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Inventário em Andamento</h3>
            <p className="text-sm text-muted-foreground">Inventário Completo - Janeiro 2024</p>
          </div>
          <Badge className="bg-warning/20 text-warning">Em Progresso</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">45%</span>
          </div>
          <Progress value={45} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm">
              <span className="font-medium">36</span> conferidos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm">
              <span className="font-medium">5</span> divergências
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">44</span> pendentes
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-secondary/50 border-border/50"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredProducts} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Salvar Rascunho</Button>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => toast({ title: "Inventário finalizado!", description: "O inventário foi concluído com sucesso." })}
        >
          Finalizar Inventário
        </Button>
      </div>
    </div>
  );
}
