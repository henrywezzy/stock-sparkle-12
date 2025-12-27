import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TermoEntrega {
  id: string;
  numero: string;
  employee_id: string;
  data_emissao: string;
  responsavel_nome: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string;
  employees?: { 
    name: string; 
    department: string | null; 
    position: string | null; 
    registration_number: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  termo_epis?: TermoEPI[];
}

export interface TermoEPI {
  id: string;
  termo_id: string;
  epi_id: string;
  ca_number: string | null;
  tamanho: string | null;
  quantidade: number;
  data_entrega: string;
  data_validade: string | null;
  created_at: string;
  epis?: { name: string; ca_number: string | null } | null;
}

export interface TermoFormData {
  employee_id: string;
  responsavel_nome?: string;
  observacoes?: string;
  epis: {
    epi_id: string;
    ca_number?: string;
    tamanho?: string;
    quantidade: number;
    data_entrega: string;
    data_validade?: string;
  }[];
}

export const useTermosEntrega = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: termos = [], isLoading, error } = useQuery({
    queryKey: ['termos_entrega'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('termos_entrega')
        .select(`
          *,
          employees (name, department, position, registration_number, email, phone),
          termo_epis (
            *,
            epis (name, ca_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TermoEntrega[];
    },
  });

  // Generate sequential number for the term
  const generateNumero = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('termos_entrega')
      .select('*', { count: 'exact', head: true });
    
    const nextNumber = (count || 0) + 1;
    return `TERMO-${year}-${String(nextNumber).padStart(5, '0')}`;
  };

  const createTermo = useMutation({
    mutationFn: async (termo: TermoFormData) => {
      const numero = await generateNumero();

      // Create the term header
      const { data: termoData, error: termoError } = await supabase
        .from('termos_entrega')
        .insert([{
          numero,
          employee_id: termo.employee_id,
          responsavel_nome: termo.responsavel_nome,
          observacoes: termo.observacoes,
          status: 'pendente',
        }])
        .select()
        .single();

      if (termoError) throw termoError;

      // Create the EPI items
      const termoEpisData = termo.epis.map(epi => ({
        termo_id: termoData.id,
        epi_id: epi.epi_id,
        ca_number: epi.ca_number,
        tamanho: epi.tamanho,
        quantidade: epi.quantidade,
        data_entrega: epi.data_entrega,
        data_validade: epi.data_validade,
      }));

      const { error: episError } = await supabase
        .from('termo_epis')
        .insert(termoEpisData);

      if (episError) throw episError;

      // Create EPI deliveries for each item
      for (const epi of termo.epis) {
        await supabase.from('epi_deliveries').insert({
          epi_id: epi.epi_id,
          employee_id: termo.employee_id,
          quantity: epi.quantidade,
          delivery_date: epi.data_entrega,
          expiry_date: epi.data_validade,
          status: 'in_use',
        });

        // Decrease EPI stock
        const { data: currentEpi } = await supabase
          .from('epis')
          .select('quantity')
          .eq('id', epi.epi_id)
          .single();

        if (currentEpi) {
          await supabase
            .from('epis')
            .update({ quantity: Math.max(0, currentEpi.quantity - epi.quantidade) })
            .eq('id', epi.epi_id);
        }
      }

      return termoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termos_entrega'] });
      queryClient.invalidateQueries({ queryKey: ['epi_deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast({
        title: 'Termo gerado',
        description: 'O termo de entrega foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar termo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTermoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('termos_entrega')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termos_entrega'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do termo foi atualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTermo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('termos_entrega').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termos_entrega'] });
      toast({
        title: 'Termo excluído',
        description: 'O termo foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getTermoById = (id: string) => {
    return termos.find(t => t.id === id);
  };

  const getTermosByEmployee = (employeeId: string) => {
    return termos.filter(t => t.employee_id === employeeId);
  };

  return {
    termos,
    isLoading,
    error,
    createTermo,
    updateTermoStatus,
    deleteTermo,
    getTermoById,
    getTermosByEmployee,
    generateNumero,
  };
};
