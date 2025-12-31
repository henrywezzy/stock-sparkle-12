import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockTransfer {
  id: string;
  from_location_id: string;
  to_location_id: string;
  product_id: string;
  quantity: number;
  status: string | null;
  notes: string | null;
  requested_by: string | null;
  approved_by: string | null;
  transfer_date: string | null;
  created_at: string;
  updated_at: string;
  from_location?: { name: string; code: string | null };
  to_location?: { name: string; code: string | null };
  product?: { name: string; sku: string | null };
}

export interface TransferFormData {
  from_location_id: string;
  to_location_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
  requested_by?: string;
}

export function useTransfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['stock_transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select(`
          *,
          from_location:locations!stock_transfers_from_location_id_fkey(name, code),
          to_location:locations!stock_transfers_to_location_id_fkey(name, code),
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockTransfer[];
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const { data: result, error } = await supabase
        .from('stock_transfers')
        .insert([{ ...data, status: 'pending' }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transfers'] });
      toast({
        title: 'Sucesso',
        description: 'Transferência criada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveTransfer = useMutation({
    mutationFn: async ({ id, approved_by }: { id: string; approved_by: string }) => {
      // Get transfer details
      const { data: transfer, error: fetchError } = await supabase
        .from('stock_transfers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update location stock (decrease from source)
      const { error: decreaseError } = await supabase
        .from('location_stock')
        .upsert({
          location_id: transfer.from_location_id,
          product_id: transfer.product_id,
          quantity: 0
        }, { onConflict: 'location_id,product_id' });

      if (decreaseError) throw decreaseError;

      // Decrease stock at source
      const { error: updateSourceError } = await supabase.rpc('decrease_location_stock', {
        p_location_id: transfer.from_location_id,
        p_product_id: transfer.product_id,
        p_quantity: transfer.quantity
      }).single();

      // Update location stock (increase at destination)
      const { error: increaseError } = await supabase
        .from('location_stock')
        .upsert({
          location_id: transfer.to_location_id,
          product_id: transfer.product_id,
          quantity: transfer.quantity
        }, { 
          onConflict: 'location_id,product_id',
          ignoreDuplicates: false 
        });

      // Update transfer status
      const { data: result, error } = await supabase
        .from('stock_transfers')
        .update({
          status: 'completed',
          approved_by,
          transfer_date: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transfers'] });
      queryClient.invalidateQueries({ queryKey: ['location_stock'] });
      toast({
        title: 'Sucesso',
        description: 'Transferência aprovada e concluída!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelTransfer = useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('stock_transfers')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transfers'] });
      toast({
        title: 'Sucesso',
        description: 'Transferência cancelada!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transfers,
    isLoading,
    error,
    createTransfer,
    approveTransfer,
    cancelTransfer,
  };
}
