import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Check, Loader2, Package, AlertCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCategories } from "@/hooks/useCategories";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
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
  const { getCategoriesForSupplier, getFirstCategoryForSupplier, setSupplierCategories } = useSupplierCategories();
  const { createEntry } = useEntries();
  
  const [isLoading, setIsLoading] = useState(false);

  // Find or create supplier based on emitente CNPJ
  const existingSupplier = suppliers?.find(
    s => s.cnpj?.replace(/\D/g, '') === nfeData.cnpj_emitente.replace(/\D/g, '')
  );

  // Get supplier's default category
  const supplierDefaultCategory = existingSupplier 
    ? getFirstCategoryForSupplier(existingSupplier.id) 
    : undefined;

  const [items, setItems] = useState<ItemToImport[]>(() => 
    nfeData.itens.map(item => ({
      ...item,
      selected: true,
      isNewProduct: true,
      productId: undefined,
      categoryId: supplierDefaultCategory,
      location: '',
    }))
  );

  // Update items when supplier default category changes
  useEffect(() => {
    if (supplierDefaultCategory) {
      setItems(prev => prev.map(item => ({
        ...item,
        categoryId: item.categoryId || supplierDefaultCategory,
      })));
    }
  }, [supplierDefaultCategory]);

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
      let newProductCount = 0;

      for (const item of selectedItems) {
        try {
          let productId = item.productId;
          
          // If new product, create it first
          if (item.isNewProduct) {
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                name: item.descricao.substring(0, 100), // Limit name length
                sku: item.codigo_produto || undefined,
                quantity: 0, // Will be updated by entry trigger
                unit: item.unidade_comercial || 'UN',
                price: item.valor_unitario_comercial || 0,
                supplier_id: supplierId,
                category_id: item.categoryId || undefined,
                location: item.location || undefined,
                status: 'active',
              })
              .select()
              .single();
            
            if (productError) {
              console.error('Error creating product:', item.descricao, productError);
              toast({
                title: "Erro ao criar produto",
                description: `"${item.descricao.substring(0, 50)}..." - ${productError.message}`,
                variant: "destructive",
              });
              errorCount++;
              continue;
            }
            
            productId = newProduct.id;
            newProductCount++;
          }

          if (productId) {
            await createEntry.mutateAsync({
              product_id: productId,
              quantity: Math.round(item.quantidade_comercial),
              unit_price: item.valor_unitario_comercial,
              total_price: item.valor_bruto,
              supplier_id: supplierId,
              invoice_number: `NFe ${nfeData.numero}`,
              entry_date: nfeData.data_emissao,
              notes: `Importado da NF-e ${nfeData.chave_nfe}`,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing item:', item.descricao, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        const parts = [];
        parts.push(`${successCount} item(s) importado(s)`);
        if (newProductCount > 0) parts.push(`${newProductCount} produto(s) criado(s)`);
        if (errorCount > 0) parts.push(`${errorCount} erro(s)`);
        
        toast({
          title: "Importação concluída!",
          description: parts.join(', ') + '.',
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
          <DialogDescription asChild>
            <div className="space-y-2">
              <span>Selecione os itens da NF-e {nfeData.numero} para importar ao estoque.</span>
              <div className="flex flex-wrap items-center gap-2">
                {existingSupplier ? (
                  <Badge variant="outline" className="text-success border-success/30">
                    Fornecedor: <span className="truncate max-w-[200px] inline-block align-bottom">{existingSupplier.name}</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30">
                    Novo fornecedor: <span className="truncate max-w-[200px] inline-block align-bottom">{nfeData.nome_emitente}</span>
                  </Badge>
                )}
                {supplierDefaultCategory && (
                  <Badge variant="outline" className="text-primary border-primary/30">
                    <Tag className="w-3 h-3 mr-1" />
                    Categoria padrão: {categories.find(c => c.id === supplierDefaultCategory)?.name}
                  </Badge>
                )}
              </div>
              {supplierDefaultCategory && (
                <p className="text-xs text-muted-foreground">
                  A categoria foi pré-selecionada com base no fornecedor. Você pode alterá-la para cada item.
                </p>
              )}
            </div>
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
                <TableHead className="text-center w-16">Qtd</TableHead>
                <TableHead className="text-right w-24">Vlr Unit.</TableHead>
                <TableHead className="w-40">Produto</TableHead>
                <TableHead className="w-36">Categoria</TableHead>
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
                      <p className="font-medium text-sm truncate max-w-[200px]" title={item.descricao}>{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.unidade_comercial} • {formatCurrency(item.valor_bruto)}
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
                            Criar novo
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
                  <TableCell>
                    {item.isNewProduct && (
                      <Select
                        value={item.categoryId || 'none'}
                        onValueChange={(value) => {
                          updateItem(index, { categoryId: value === 'none' ? undefined : value });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Categoria..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Sem categoria</span>
                          </SelectItem>
                          {categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-1">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: cat.color || '#3B82F6' }}
                                />
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
