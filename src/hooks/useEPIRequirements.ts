import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPIRequirement {
  id: string;
  epi_category: string;
  department: string | null;
  position: string | null;
  is_mandatory: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EPIRequirementFormData {
  epi_category: string;
  department?: string | null;
  position?: string | null;
  is_mandatory?: boolean;
  notes?: string | null;
}

export const useEPIRequirements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading, error } = useQuery({
    queryKey: ['epi-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epi_requirements')
        .select('*')
        .order('epi_category');

      if (error) throw error;
      return data as EPIRequirement[];
    },
  });

  const createRequirement = useMutation({
    mutationFn: async (requirement: EPIRequirementFormData) => {
      const { data, error } = await supabase
        .from('epi_requirements')
        .insert([requirement])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-requirements'] });
      toast({
        title: 'Requisito criado',
        description: 'O requisito de EPI foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar requisito',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EPIRequirement> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('epi_requirements')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-requirements'] });
      toast({
        title: 'Requisito atualizado',
        description: 'O requisito foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar requisito',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('epi_requirements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-requirements'] });
      toast({
        title: 'Requisito excluído',
        description: 'O requisito foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir requisito',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get requirements for a specific department or position
  const getRequirementsFor = (department?: string, position?: string) => {
    return requirements.filter(req => {
      if (req.department && department && req.department === department) return true;
      if (req.position && position && req.position === position) return true;
      return false;
    });
  };

  // Get unique departments from requirements
  const departments = [...new Set(requirements.map(r => r.department).filter(Boolean))] as string[];
  
  // Get unique positions from requirements
  const positions = [...new Set(requirements.map(r => r.position).filter(Boolean))] as string[];

  return {
    requirements,
    isLoading,
    error,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    getRequirementsFor,
    departments,
    positions,
  };
};
