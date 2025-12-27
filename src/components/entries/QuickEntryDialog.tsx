import { useState } from "react";
import { Zap, Package, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/hooks/use-toast";

interface QuickEntryDialogProps {
  trigger?: React.ReactNode;
}

export function QuickEntryDialog({ trigger }: QuickEntryDialogProps) {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { createEntry } = useEntries();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const handleSubmit = async () => {
    if (!productId || !quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntry.mutateAsync({
        product_id: productId,
        quantity: parseInt(quantity),
        supplier_id: supplierId || undefined,
      });

      toast({
        title: "Entrada rápida registrada!",
        description: `+${quantity} unidades adicionadas ao estoque.`,
      });

      // Reset form
      setProductId("");
      setQuantity("");
      setSupplierId("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao registrar entrada",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && productId && quantity) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Zap className="w-4 h-4" />
            Entrada Rápida
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Entrada Rápida
          </DialogTitle>
          <DialogDescription>
            Registre uma entrada com apenas produto, quantidade e fornecedor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4" onKeyDown={handleKeyDown}>
          <div className="grid gap-2">
            <Label htmlFor="product">Produto *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ({product.sku})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              className="text-lg font-semibold"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="supplier">Fornecedor (opcional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !productId || !quantity}
            className="gradient-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
