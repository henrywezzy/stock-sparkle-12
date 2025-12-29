import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { DateInput } from "@/components/ui/date-input";
import { 
  FileText, 
  Loader2, 
  Package, 
  Trash2, 
  AlertTriangle,
  TrendingDown,
  Truck
} from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseOrders, PurchaseOrderItem } from "@/hooks/usePurchaseOrders";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface PurchaseSuggestion {
  type: 'product' | 'epi';
  product: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    min_quantity: number | null;
    max_quantity: number | null;
    supplier_id: string | null;
  };
  status: 'critical' | 'low';
  suggestedQuantity: number;
  lastPurchases: {
    date: string;
    quantity: number;
    unit_price: number | null;
    supplier_name: string | null;
    supplier_id: string | null;
  }[];
}

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: PurchaseSuggestion[];
}

interface OrderItem extends Omit<PurchaseOrderItem, 'id' | 'order_id' | 'subtotal'> {
  selected: boolean;
  originalSuggestion: PurchaseSuggestion;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  suggestions,
}: PurchaseOrderDialogProps) {
  const { suppliers } = useSuppliers();
  const { createOrder } = usePurchaseOrders();
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [dataEntrega, setDataEntrega] = useState<string>("");
  const [condicoesPagamento, setCondicoesPagamento] = useState<string>("30 dias");
  const [frete, setFrete] = useState<string>("CIF");
  const [observacoes, setObservacoes] = useState<string>("");
  
  // Initialize items from suggestions
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => 
    suggestions.map((s) => {
      const bestPrice = s.lastPurchases.find(p => p.unit_price);
      return {
        selected: false,
        originalSuggestion: s,
        product_id: s.type === 'product' ? s.product.id : null,
        epi_id: s.type === 'epi' ? s.product.id : null,
        tipo: s.type,
        codigo: s.product.sku || undefined,
        descricao: s.product.name,
        unidade: 'UN',
        quantidade: s.suggestedQuantity,
        valor_unitario: bestPrice?.unit_price || 0,
      };
    })
  );

  // Update items when suggestions change
  useMemo(() => {
    if (suggestions.length > 0 && orderItems.length === 0) {
      setOrderItems(
        suggestions.map((s) => {
          const bestPrice = s.lastPurchases.find(p => p.unit_price);
          return {
            selected: false,
            originalSuggestion: s,
            product_id: s.type === 'product' ? s.product.id : null,
            epi_id: s.type === 'epi' ? s.product.id : null,
            tipo: s.type,
            codigo: s.product.sku || undefined,
            descricao: s.product.name,
            unidade: 'UN',
            quantidade: s.suggestedQuantity,
            valor_unitario: bestPrice?.unit_price || 0,
          };
        })
      );
    }
  }, [suggestions]);

  const selectedItems = orderItems.filter((item) => item.selected);
  
  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      return sum + (item.quantidade * item.valor_unitario);
    }, 0);
  }, [selectedItems]);

  const toggleSelectItem = (index: number) => {
    setOrderItems((prev) => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = orderItems.every((item) => item.selected);
    setOrderItems((prev) => 
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const updateItemQuantity = (index: number, quantidade: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantidade } : item
      )
    );
  };

  const updateItemPrice = (index: number, valor_unitario: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, valor_unitario } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setDataEntrega("");
    setCondicoesPagamento("30 dias");
    setFrete("CIF");
    setObservacoes("");
    setOrderItems(
      suggestions.map((s) => {
        const bestPrice = s.lastPurchases.find(p => p.unit_price);
        return {
          selected: false,
          originalSuggestion: s,
          product_id: s.type === 'product' ? s.product.id : null,
          epi_id: s.type === 'epi' ? s.product.id : null,
          tipo: s.type,
          codigo: s.product.sku || undefined,
          descricao: s.product.name,
          unidade: 'UN',
          quantidade: s.suggestedQuantity,
          valor_unitario: bestPrice?.unit_price || 0,
        };
      })
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    const items = selectedItems.map((item) => ({
      product_id: item.product_id,
      epi_id: item.epi_id,
      tipo: item.tipo,
      codigo: item.codigo,
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    }));

    await createOrder.mutateAsync({
      supplier_id: selectedSupplierId || null,
      data_entrega: dataEntrega || null,
      condicoes_pagamento: condicoesPagamento,
      frete,
      observacoes: observacoes || null,
      items,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Gerar Ordem de Compra
          </DialogTitle>
          <DialogDescription>
            Selecione os itens e o fornecedor para gerar uma ordem de compra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {supplier.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEntrega">Data de Entrega</Label>
              <DateInput
                value={dataEntrega}
                onChange={setDataEntrega}
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicoes">Condições de Pagamento</Label>
              <Select value={condicoesPagamento} onValueChange={setCondicoesPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="à vista">À Vista</SelectItem>
                  <SelectItem value="7 dias">7 Dias</SelectItem>
                  <SelectItem value="14 dias">14 Dias</SelectItem>
                  <SelectItem value="21 dias">21 Dias</SelectItem>
                  <SelectItem value="30 dias">30 Dias</SelectItem>
                  <SelectItem value="30/60 dias">30/60 Dias</SelectItem>
                  <SelectItem value="30/60/90 dias">30/60/90 Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frete">Frete</Label>
              <Select value={frete} onValueChange={setFrete}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIF">CIF (Por conta do fornecedor)</SelectItem>
                  <SelectItem value="FOB">FOB (Por conta do comprador)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens da Ordem</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedItems.length} selecionado(s)
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {orderItems.every((item) => item.selected) ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={orderItems.length > 0 && orderItems.every((item) => item.selected)}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Nenhum item disponível para ordem de compra
                        </TableCell>
                      </TableRow>
                    ) : (
                      orderItems.map((item, index) => (
                        <TableRow 
                          key={index}
                          className={cn(
                            item.selected && "bg-primary/5",
                            item.originalSuggestion.status === 'critical' && "bg-destructive/5"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => toggleSelectItem(index)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.tipo === 'epi' ? 'EPI' : 'Produto'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{item.descricao}</p>
                                {item.codigo && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {item.codigo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                item.originalSuggestion.status === 'critical'
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : "bg-warning/10 text-warning border-warning/30"
                              )}
                            >
                              {item.originalSuggestion.status === 'critical' ? (
                                <><AlertTriangle className="w-3 h-3 mr-1" /> Crítico</>
                              ) : (
                                <><TrendingDown className="w-3 h-3 mr-1" /> Baixo</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <NumericInput
                              min={1}
                              value={item.quantidade}
                              onChange={(val) => updateItemQuantity(index, val)}
                              className="w-20 text-center"
                              disabled={!item.selected}
                            />
                          </TableCell>
                          <TableCell>
                            <NumericInput
                              min={0}
                              decimals={2}
                              value={item.valor_unitario}
                              onChange={(val) => updateItemPrice(index, val)}
                              className="w-24 text-right"
                              disabled={!item.selected}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.quantidade * item.valor_unitario)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end p-4 bg-muted/50 rounded-lg">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total da Ordem</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais para o fornecedor..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || !selectedSupplierId || createOrder.isPending}
          >
            {createOrder.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar Ordem de Compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
