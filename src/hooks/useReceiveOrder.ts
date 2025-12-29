import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrder, PurchaseOrderItem } from "@/hooks/usePurchaseOrders";

export function useReceiveOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Receber ordem de compra e criar entradas no estoque
  const receiveOrder = useMutation({
    mutationFn: async (order: PurchaseOrder) => {
      // Buscar itens da ordem se não vieram junto
      let items = order.items;
      if (!items) {
        const { data: orderItems, error: itemsError } = await supabase
          .from("purchase_order_items")
          .select("*")
          .eq("order_id", order.id);

        if (itemsError) throw itemsError;
        items = (orderItems || []).map(item => ({
          ...item,
          tipo: item.tipo as 'product' | 'epi'
        }));
      }

      if (!items || items.length === 0) {
        throw new Error("Nenhum item encontrado na ordem de compra");
      }

      // Criar entradas para produtos
      const productItems = items.filter(item => item.product_id && item.tipo === 'product');
      
      for (const item of productItems) {
        const { error: entryError } = await supabase
          .from("entries")
          .insert({
            product_id: item.product_id!,
            quantity: Number(item.quantidade),
            unit_price: Number(item.valor_unitario),
            total_price: Number(item.subtotal) || Number(item.quantidade) * Number(item.valor_unitario),
            supplier_id: order.supplier_id,
            entry_date: new Date().toISOString(),
            notes: `Recebimento da OC ${order.numero}`,
          });

        if (entryError) {
          console.error("Erro ao criar entrada:", entryError);
          throw entryError;
        }
      }

      // Atualizar quantidade dos EPIs (não usamos entries para EPIs)
      const epiItems = items.filter(item => item.epi_id && item.tipo === 'epi');
      
      for (const item of epiItems) {
        // Buscar quantidade atual do EPI
        const { data: epi, error: epiError } = await supabase
          .from("epis")
          .select("quantity")
          .eq("id", item.epi_id!)
          .single();

        if (epiError) {
          console.error("Erro ao buscar EPI:", epiError);
          throw epiError;
        }

        // Atualizar quantidade
        const newQuantity = (epi?.quantity || 0) + Number(item.quantidade);
        const { error: updateError } = await supabase
          .from("epis")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", item.epi_id!);

        if (updateError) {
          console.error("Erro ao atualizar EPI:", updateError);
          throw updateError;
        }
      }

      // Atualizar status da ordem para "recebida"
      const { error: updateOrderError } = await supabase
        .from("purchase_orders")
        .update({ 
          status: "recebida",
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (updateOrderError) throw updateOrderError;

      // Registrar avaliação automática do fornecedor
      if (order.supplier_id) {
        const { error: perfError } = await supabase
          .from("supplier_performance")
          .insert({
            supplier_id: order.supplier_id,
            order_id: order.id,
            promised_date: order.data_entrega,
            delivered_date: new Date().toISOString().split('T')[0],
            price_quoted: order.total,
            price_final: order.total,
            quality_score: null, // A ser avaliado manualmente depois
            notes: `Recebimento automático da OC ${order.numero}`,
          });

        if (perfError) {
          console.error("Erro ao registrar avaliação do fornecedor:", perfError);
          // Não interrompe o fluxo, apenas loga o erro
        }
      }

      return {
        productCount: productItems.length,
        epiCount: epiItems.length,
        orderNumber: order.numero
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["epis"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-performance"] });
      
      toast({
        title: "Ordem recebida com sucesso!",
        description: `${data.productCount} produtos e ${data.epiCount} EPIs foram adicionados ao estoque.`,
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao receber ordem:", error);
      toast({
        title: "Erro ao receber ordem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    receiveOrder,
  };
}
