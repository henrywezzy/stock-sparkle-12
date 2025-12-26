import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Entry {
  id: string;
  product_id: string;
  supplier_id: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  received_by: string | null;
  invoice_number: string | null;
  batch: string | null;
  notes: string | null;
  entry_date: string;
  created_at: string;
  products?: { name: string; sku: string | null } | null;
  suppliers?: { name: string } | null;
}

export interface EntryFormData {
  product_id: string;
  supplier_id?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  received_by?: string;
  invoice_number?: string;
  batch?: string;
  notes?: string;
  entry_date?: string;
}

export const useEntries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          *,
          products (name, sku),
          suppliers (name)
        `)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data as Entry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: EntryFormData) => {
      // Convert empty strings to null for UUID and optional fields
      const sanitizedEntry = {
        ...entry,
        supplier_id: entry.supplier_id && entry.supplier_id.trim() !== '' ? entry.supplier_id : null,
        received_by: entry.received_by && entry.received_by.trim() !== '' ? entry.received_by : null,
        invoice_number: entry.invoice_number && entry.invoice_number.trim() !== '' ? entry.invoice_number : null,
        batch: entry.batch && entry.batch.trim() !== '' ? entry.batch : null,
        notes: entry.notes && entry.notes.trim() !== '' ? entry.notes : null,
      };
      
      const { data, error } = await supabase
        .from('entries')
        .insert([sanitizedEntry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast({
        title: 'Entrada registrada',
        description: 'A entrada foi registrada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar entrada',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...entry }: Partial<Entry> & { id: string }) => {
      // Convert empty strings to null for UUID and optional fields
      const sanitizedEntry = {
        ...entry,
        supplier_id: entry.supplier_id && String(entry.supplier_id).trim() !== '' ? entry.supplier_id : null,
        received_by: entry.received_by && entry.received_by.trim() !== '' ? entry.received_by : null,
        invoice_number: entry.invoice_number && entry.invoice_number.trim() !== '' ? entry.invoice_number : null,
        batch: entry.batch && entry.batch.trim() !== '' ? entry.batch : null,
        notes: entry.notes && entry.notes.trim() !== '' ? entry.notes : null,
      };
      
      const { data, error } = await supabase
        .from('entries')
        .update(sanitizedEntry)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast({
        title: 'Entrada atualizada',
        description: 'A entrada foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar entrada',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast({
        title: 'Entrada excluída',
        description: 'A entrada foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir entrada',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
