import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, isAfter, isBefore, addMonths } from 'date-fns';

export interface EPIDelivery {
  id: string;
  epi_id: string;
  employee_id: string;
  quantity: number;
  delivery_date: string;
  expiry_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  epis?: { name: string; ca_number: string | null; default_validity_days: number | null } | null;
  employees?: { name: string; department: string | null; position: string | null; registration_number: string | null } | null;
}

export interface EPIDeliveryFormData {
  epi_id: string;
  employee_id: string;
  quantity?: number;
  delivery_date?: string;
  expiry_date?: string;
  notes?: string;
}

export const useEPIDeliveries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries = [], isLoading, error } = useQuery({
    queryKey: ['epi_deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epi_deliveries')
        .select(`
          *,
          epis (name, ca_number, default_validity_days),
          employees (name, department, position, registration_number)
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      return data as EPIDelivery[];
    },
  });

  const createDelivery = useMutation({
    mutationFn: async (delivery: EPIDeliveryFormData) => {
      // Get EPI to calculate expiry date if not provided
      if (!delivery.expiry_date) {
        const { data: epi } = await supabase
          .from('epis')
          .select('default_validity_days')
          .eq('id', delivery.epi_id)
          .single();
        
        if (epi?.default_validity_days) {
          const deliveryDate = new Date(delivery.delivery_date || new Date());
          delivery.expiry_date = addDays(deliveryDate, epi.default_validity_days).toISOString().split('T')[0];
        }
      }

      const { data, error } = await supabase
        .from('epi_deliveries')
        .insert([{
          ...delivery,
          status: 'in_use',
          quantity: delivery.quantity || 1,
          delivery_date: delivery.delivery_date || new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) throw error;

      // Decrease EPI stock
      const { data: currentEpi } = await supabase
        .from('epis')
        .select('quantity')
        .eq('id', delivery.epi_id)
        .single();

      if (currentEpi) {
        await supabase
          .from('epis')
          .update({ quantity: Math.max(0, currentEpi.quantity - (delivery.quantity || 1)) })
          .eq('id', delivery.epi_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      toast({
        title: 'Entrega registrada',
        description: 'A entrega do EPI foi registrada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar entrega',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('epi_deliveries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_deliveries'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da entrega foi atualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epi_deliveries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_deliveries'] });
      toast({
        title: 'Entrega excluída',
        description: 'O registro de entrega foi removido.',
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

  // Calculate statistics
  const now = new Date();
  const in30Days = addDays(now, 30);

  const stats = {
    inUse: deliveries.filter(d => d.status === 'in_use').length,
    expiringSoon: deliveries.filter(d => {
      if (!d.expiry_date || d.status !== 'in_use') return false;
      const expiryDate = new Date(d.expiry_date);
      return isAfter(expiryDate, now) && isBefore(expiryDate, in30Days);
    }).length,
    expired: deliveries.filter(d => {
      if (!d.expiry_date) return false;
      return isBefore(new Date(d.expiry_date), now) || d.status === 'expired';
    }).length,
  };

  // Get deliveries by employee
  const getDeliveriesByEmployee = (employeeId: string) => {
    return deliveries.filter(d => d.employee_id === employeeId);
  };

  return {
    deliveries,
    isLoading,
    error,
    stats,
    createDelivery,
    updateDeliveryStatus,
    deleteDelivery,
    getDeliveriesByEmployee,
  };
};
