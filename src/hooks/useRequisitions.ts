import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Requisition {
  id: string;
  product_id: string;
  employee_id: string | null;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_separation' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  products?: { name: string; sku: string | null; quantity: number } | null;
  employees?: { name: string; department: string | null } | null;
}

export interface RequisitionFormData {
  product_id: string;
  employee_id?: string;
  quantity: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  requested_by?: string;
}

export interface RequisitionUpdateData {
  id: string;
  status?: 'pending' | 'approved' | 'rejected' | 'in_separation' | 'delivered' | 'cancelled';
  approved_by?: string;
  notes?: string;
}

export const useRequisitions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: requisitions = [], isLoading, error } = useQuery({
    queryKey: ['requisitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisitions')
        .select(`
          *,
          products (name, sku, quantity),
          employees (name, department)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Requisition[];
    },
  });

  const createRequisition = useMutation({
    mutationFn: async (requisition: RequisitionFormData) => {
      const dataToInsert = {
        product_id: requisition.product_id,
        employee_id: requisition.employee_id || null,
        quantity: requisition.quantity,
        priority: requisition.priority || 'normal',
        notes: requisition.notes || null,
        requested_by: requisition.requested_by || user?.email || null,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('requisitions')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      toast({
        title: 'Requisição criada',
        description: 'Sua requisição foi enviada para aprovação.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar requisição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRequisition = useMutation({
    mutationFn: async ({ id, ...updates }: RequisitionUpdateData) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Se estiver aprovando/rejeitando, registrar quem e quando
      if (updates.status === 'approved' || updates.status === 'rejected') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = updates.approved_by || user?.email || null;
      }

      const { data, error } = await supabase
        .from('requisitions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          products (name, sku, quantity),
          employees (name, department)
        `)
        .single();

      if (error) throw error;
      return data as Requisition;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      
      const statusMessages: Record<string, { title: string; description: string }> = {
        approved: { title: 'Requisição aprovada', description: 'A requisição foi aprovada e está pronta para separação.' },
        rejected: { title: 'Requisição rejeitada', description: 'A requisição foi rejeitada.' },
        in_separation: { title: 'Em separação', description: 'Os itens estão sendo separados.' },
        delivered: { title: 'Entregue', description: 'A requisição foi entregue e saída registrada automaticamente.' },
        cancelled: { title: 'Cancelada', description: 'A requisição foi cancelada.' },
      };

      const message = statusMessages[data.status] || { 
        title: 'Requisição atualizada', 
        description: 'A requisição foi atualizada com sucesso.' 
      };

      toast(message);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar requisição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteRequisition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('requisitions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      toast({
        title: 'Requisição excluída',
        description: 'A requisição foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir requisição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Ações de fluxo de trabalho
  const approveRequisition = (id: string) => {
    return updateRequisition.mutateAsync({ id, status: 'approved' });
  };

  const rejectRequisition = (id: string, notes?: string) => {
    return updateRequisition.mutateAsync({ id, status: 'rejected', notes });
  };

  const startSeparation = (id: string) => {
    return updateRequisition.mutateAsync({ id, status: 'in_separation' });
  };

  // Marcar como entregue E criar saída automaticamente
  const markAsDelivered = async (id: string) => {
    // Buscar a requisição completa
    const requisition = requisitions.find(r => r.id === id);
    if (!requisition) {
      throw new Error('Requisição não encontrada');
    }

    // 1. Atualizar status da requisição
    await updateRequisition.mutateAsync({ id, status: 'delivered' });

    // 2. Criar saída automaticamente vinculada à requisição
    const { error: exitError } = await supabase.from('exits').insert([{
      product_id: requisition.product_id,
      employee_id: requisition.employee_id,
      quantity: requisition.quantity,
      destination: requisition.employees?.department || 'Requisição',
      reason: `Requisição #${id.substring(0, 8)}`,
      notes: `Saída automática - Requisição entregue`,
      requisition_id: id,
    }]);

    if (exitError) {
      toast({
        title: 'Aviso',
        description: 'Requisição entregue, mas houve erro ao criar saída automática.',
        variant: 'destructive',
      });
    } else {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
    }
  };

  const cancelRequisition = (id: string, notes?: string) => {
    return updateRequisition.mutateAsync({ id, status: 'cancelled', notes });
  };

  // Estatísticas
  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status === 'pending').length,
    approved: requisitions.filter(r => r.status === 'approved').length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
    inSeparation: requisitions.filter(r => r.status === 'in_separation').length,
    delivered: requisitions.filter(r => r.status === 'delivered').length,
    cancelled: requisitions.filter(r => r.status === 'cancelled').length,
  };

  return {
    requisitions,
    isLoading,
    error,
    stats,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    approveRequisition,
    rejectRequisition,
    startSeparation,
    markAsDelivered,
    cancelRequisition,
  };
};
