import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Exit {
  id: string;
  product_id: string;
  employee_id: string | null;
  quantity: number;
  destination: string | null;
  reason: string | null;
  notes: string | null;
  exit_date: string;
  created_at: string;
  requisition_id: string | null;
  products?: { name: string; sku: string | null } | null;
  employees?: { name: string; department: string | null } | null;
  requisitions?: { id: string; status: string } | null;
}

export interface ExitFormData {
  product_id: string;
  employee_id?: string;
  quantity: number;
  destination?: string;
  reason?: string;
  notes?: string;
  exit_date?: string;
}

export const useExits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exits = [], isLoading, error } = useQuery({
    queryKey: ['exits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exits')
        .select(`
          *,
          products (name, sku),
          employees (name, department),
          requisitions (id, status)
        `)
        .order('exit_date', { ascending: false });

      if (error) throw error;
      return data as Exit[];
    },
  });

  const createExit = useMutation({
    mutationFn: async (exit: ExitFormData) => {
      // Convert empty strings to null for UUID fields
      const sanitizedExit = {
        ...exit,
        employee_id: exit.employee_id && exit.employee_id.trim() !== '' ? exit.employee_id : null,
        destination: exit.destination && exit.destination.trim() !== '' ? exit.destination : null,
        reason: exit.reason && exit.reason.trim() !== '' ? exit.reason : null,
        notes: exit.notes && exit.notes.trim() !== '' ? exit.notes : null,
      };
      
      const { data, error } = await supabase
        .from('exits')
        .insert([sanitizedExit])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
      toast({
        title: 'Saída registrada',
        description: 'A saída foi registrada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar saída',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateExit = useMutation({
    mutationFn: async ({ id, ...exit }: Partial<Exit> & { id: string }) => {
      // Convert empty strings to null for UUID fields
      const sanitizedExit = {
        ...exit,
        employee_id: exit.employee_id && String(exit.employee_id).trim() !== '' ? exit.employee_id : null,
        destination: exit.destination && exit.destination.trim() !== '' ? exit.destination : null,
        reason: exit.reason && exit.reason.trim() !== '' ? exit.reason : null,
        notes: exit.notes && exit.notes.trim() !== '' ? exit.notes : null,
      };
      
      const { data, error } = await supabase
        .from('exits')
        .update(sanitizedExit)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast({
        title: 'Saída atualizada',
        description: 'A saída foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar saída',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteExit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast({
        title: 'Saída excluída',
        description: 'A saída foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir saída',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    exits,
    isLoading,
    error,
    createExit,
    updateExit,
    deleteExit,
  };
};
