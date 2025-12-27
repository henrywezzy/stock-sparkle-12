import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPI {
  id: string;
  name: string;
  ca_number: string | null;
  ca_expiry_date: string | null;
  category: string | null;
  description: string | null;
  default_validity_days: number | null;
  quantity: number;
  min_quantity: number | null;
  image_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EPIFormData {
  name: string;
  ca_number?: string;
  ca_expiry_date?: string;
  category?: string;
  description?: string;
  default_validity_days?: number;
  quantity?: number;
  min_quantity?: number;
}

export const useEPIs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: epis = [], isLoading, error } = useQuery({
    queryKey: ['epis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epis')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EPI[];
    },
  });

  const createEPI = useMutation({
    mutationFn: async (epi: EPIFormData) => {
      const { data, error } = await supabase
        .from('epis')
        .insert([epi])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast({
        title: 'EPI cadastrado',
        description: 'O EPI foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar EPI',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEPI = useMutation({
    mutationFn: async ({ id, ...epi }: Partial<EPI> & { id: string }) => {
      const { data, error } = await supabase
        .from('epis')
        .update(epi)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast({
        title: 'EPI atualizado',
        description: 'O EPI foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar EPI',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Soft delete - apenas marca como deletado
  const deleteEPI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('epis')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast({
        title: 'EPI removido',
        description: 'O EPI foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover EPI',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Statistics
  const stats = {
    total: epis.length,
    lowStock: epis.filter(e => e.quantity <= (e.min_quantity || 5)).length,
  };

  return {
    epis,
    isLoading,
    error,
    stats,
    createEPI,
    updateEPI,
    deleteEPI,
  };
};
