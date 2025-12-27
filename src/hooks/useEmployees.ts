import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  name: string;
  registration_number: string | null;
  department: string | null;
  position: string | null;
  admission_date: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  status: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  name: string;
  registration_number?: string;
  department?: string;
  position?: string;
  admission_date?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export const useEmployees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data as Employee[];
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (employee: EmployeeFormData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Funcionário criado',
        description: 'O funcionário foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar funcionário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...employee }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Funcionário atualizado',
        description: 'O funcionário foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar funcionário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Soft delete
  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Funcionário removido',
        description: 'O funcionário foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover funcionário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
