import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Loader2, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCategories } from "@/hooks/useCategories";
import { useEntries } from "@/hooks/useEntries";
import { formatCurrency } from "@/lib/currency";
import type { NFEItem, NFEData } from "@/hooks/useNFe";

interface ImportarEstoqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeData: NFEData;
  onSuccess?: () => void;
}

interface ItemToImport extends NFEItem {
  selected: boolean;
  productId?: string;
  isNewProduct: boolean;
  categoryId?: string;
  location?: string;
}

export function ImportarEstoqueDialog({
  open,
  onOpenChange,
  nfeData,
  onSuccess,
}: ImportarEstoqueDialogProps) {
  const { toast } = useToast();
  const { products } = useProducts();
  const { suppliers, createSupplier } = useSuppliers();
  const { categories } = useCategories();
  const { createEntry } = useEntries();
  
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ItemToImport[]>(() => 
    nfeData.itens.map(item => ({
      ...item,
      selected: true,
      isNewProduct: true,
      productId: undefined,
      categoryId: undefined,
      location: '',
    }))
  );

  // Find or create supplier based on emitente CNPJ
  const existingSupplier = suppliers?.find(
    s => s.cnpj?.replace(/\D/g, '') === nfeData.cnpj_emitente.replace(/\D/g, '')
  );

  const toggleItem = (index: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleAll = (selected: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected })));
  };

  const updateItem = (index: number, updates: Partial<ItemToImport>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleImport = async () => {
    const selectedItems = items.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para importar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Find or create supplier
      let supplierId = existingSupplier?.id;
      
      if (!supplierId) {
        const newSupplier = await createSupplier.mutateAsync({
          name: nfeData.nome_emitente,
          cnpj: nfeData.cnpj_emitente,
          status: 'active',
        });
        supplierId = newSupplier?.id;
      }

      // Create entries for each selected item
      let successCount = 0;
      let errorCount = 0;

      for (const item of selectedItems) {
        try {
          // For now, we'll create entries for existing products only
          // New products would need to be created first
          if (!item.isNewProduct && item.productId) {
            await createEntry.mutateAsync({
              product_id: item.productId,
              quantity: Math.round(item.quantidade_comercial),
              unit_price: item.valor_unitario_comercial,
              total_price: item.valor_bruto,
              supplier_id: supplierId,
              invoice_number: `NFe ${nfeData.numero}`,
              entry_date: nfeData.data_emissao,
              notes: `Importado da NF-e ${nfeData.chave_nfe}`,
            });
            successCount++;
          } else if (item.isNewProduct) {
            // For new products, we would need to create the product first
            // This is a simplified version - just count as success
            // In a full implementation, you'd create the product then the entry
            toast({
              title: "Produto novo detectado",
              description: `"${item.descricao}" precisa ser cadastrado primeiro.`,
              variant: "destructive",
            });
            errorCount++;
          }
        } catch (error) {
          console.error('Error importing item:', item.descricao, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Importação concluída!",
          description: `${successCount} item(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else if (errorCount > 0) {
        toast({
          title: "Erro na importação",
          description: "Nenhum item foi importado. Verifique os itens selecionados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error importing NFe items:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os itens da NF-e.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = items.filter(i => i.selected).length;
  const allSelected = items.every(i => i.selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Importar Itens para Estoque
          </DialogTitle>
          <DialogDescription>
            Selecione os itens da NF-e {nfeData.numero} para importar ao estoque.
            {existingSupplier ? (
              <Badge variant="outline" className="ml-2 text-success border-success/30">
                Fornecedor: {existingSupplier.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 text-warning border-warning/30">
                Novo fornecedor será criado: {nfeData.nome_emitente}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="w-20">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center w-20">Qtd</TableHead>
                <TableHead className="text-right w-28">Vlr Unit.</TableHead>
                <TableHead className="w-48">Vincular a Produto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell>
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(index)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.codigo_produto}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.unidade_comercial} • Subtotal: {formatCurrency(item.valor_bruto)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantidade_comercial}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.valor_unitario_comercial)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.isNewProduct ? 'new' : (item.productId || '')}
                      onValueChange={(value) => {
                        if (value === 'new') {
                          updateItem(index, { isNewProduct: true, productId: undefined });
                        } else {
                          updateItem(index, { isNewProduct: false, productId: value });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-warning" />
                            Criar novo produto
                          </span>
                        </SelectItem>
                        {products?.filter(p => !p.deleted_at).map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.sku ? `[${product.sku}] ` : ''}{product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {selectedCount} de {items.length} item(s) selecionado(s)
          </div>
          <div className="text-sm font-semibold">
            Total: {formatCurrency(
              items.filter(i => i.selected).reduce((sum, i) => sum + i.valor_bruto, 0)
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || selectedCount === 0}
            className="bg-success hover:bg-success/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Importar {selectedCount} Item(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
