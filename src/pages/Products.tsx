import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye, Package } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      header: "Produto",
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.location}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Categoria" },
    {
      key: "quantity",
      header: "Quantidade",
      render: (product: Product) => (
        <div>
          <span className="font-medium">{product.quantity}</span>
          <span className="text-muted-foreground ml-1">{product.unit}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => (
        <Badge
          variant={product.quantity <= product.minStock ? "destructive" : "default"}
          className={
            product.quantity <= product.minStock
              ? "bg-destructive/20 text-destructive"
              : "bg-success/20 text-success"
          }
        >
          {product.quantity <= product.minStock ? "Estoque Baixo" : "Normal"}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Preço Unit.",
      render: (product: Product) => (
        <span>R$ {product.price.toFixed(2)}</span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (product: Product) => (
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
            onClick={() => toast({ title: "Produto excluído", description: `${product.name} foi removido.` })}
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
        title="Produtos"
        description="Gerencie todos os produtos do almoxarifado"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Produtos" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações do produto
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input id="name" placeholder="Ex: Parafuso Phillips 6mm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ferragens">Ferragens</SelectItem>
                        <SelectItem value="epis">EPIs</SelectItem>
                        <SelectItem value="ferramentas">Ferramentas</SelectItem>
                        <SelectItem value="eletricos">Elétricos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="kg">Quilograma</SelectItem>
                        <SelectItem value="l">Litro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input id="quantity" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input id="minStock" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço Unitário</Label>
                    <Input id="price" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input id="location" placeholder="Ex: A1-P1" />
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
                    toast({ title: "Produto cadastrado!", description: "O produto foi adicionado com sucesso." });
                    setIsDialogOpen(false);
                  }}
                >
                  Salvar
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
            placeholder="Buscar produtos..."
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
      <DataTable columns={columns} data={filteredProducts} />
    </div>
  );
}
