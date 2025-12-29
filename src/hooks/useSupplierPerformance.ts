import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierPerformance {
  id: string;
  supplier_id: string;
  order_id: string | null;
  promised_date: string | null;
  delivered_date: string | null;
  price_quoted: number | null;
  price_final: number | null;
  quality_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface SupplierPerformanceFormData {
  supplier_id: string;
  order_id?: string | null;
  promised_date?: string | null;
  delivered_date?: string | null;
  price_quoted?: number | null;
  price_final?: number | null;
  quality_score?: number | null;
  notes?: string | null;
}

export interface SupplierMetrics {
  supplierId: string;
  totalOrders: number;
  avgDeliveryDays: number;
  onTimeDeliveryRate: number;
  avgPriceVariance: number;
  avgQualityScore: number;
}

export const useSupplierPerformance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: performances = [], isLoading, error } = useQuery({
    queryKey: ['supplier-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupplierPerformance[];
    },
  });

  const createPerformance = useMutation({
    mutationFn: async (performance: SupplierPerformanceFormData) => {
      const { data, error } = await supabase
        .from('supplier_performance')
        .insert([performance])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-performance'] });
      toast({
        title: 'Avaliação registrada',
        description: 'A avaliação do fornecedor foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar avaliação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePerformance = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<SupplierPerformanceFormData>) => {
      const { data: result, error } = await supabase
        .from('supplier_performance')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-performance'] });
      toast({
        title: 'Avaliação atualizada',
        description: 'A avaliação do fornecedor foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar avaliação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get pending evaluations (without quality score)
  const getPendingEvaluations = () => {
    return performances.filter((p) => p.quality_score === null);
  };

  // Calculate metrics for a specific supplier
  const getMetricsForSupplier = (supplierId: string): SupplierMetrics | null => {
    const supplierPerformances = performances.filter(p => p.supplier_id === supplierId);
    
    if (supplierPerformances.length === 0) return null;

    const totalOrders = supplierPerformances.length;
    
    // Calculate average delivery days
    const deliveries = supplierPerformances.filter(p => p.promised_date && p.delivered_date);
    const avgDeliveryDays = deliveries.length > 0
      ? deliveries.reduce((sum, p) => {
          const promised = new Date(p.promised_date!);
          const delivered = new Date(p.delivered_date!);
          return sum + Math.ceil((delivered.getTime() - promised.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / deliveries.length
      : 0;

    // On-time delivery rate
    const onTimeDeliveryRate = deliveries.length > 0
      ? deliveries.filter(p => new Date(p.delivered_date!) <= new Date(p.promised_date!)).length / deliveries.length * 100
      : 0;

    // Average price variance
    const priceRecords = supplierPerformances.filter(p => p.price_quoted && p.price_final);
    const avgPriceVariance = priceRecords.length > 0
      ? priceRecords.reduce((sum, p) => {
          return sum + ((p.price_final! - p.price_quoted!) / p.price_quoted! * 100);
        }, 0) / priceRecords.length
      : 0;

    // Average quality score
    const qualityRecords = supplierPerformances.filter(p => p.quality_score);
    const avgQualityScore = qualityRecords.length > 0
      ? qualityRecords.reduce((sum, p) => sum + p.quality_score!, 0) / qualityRecords.length
      : 0;

    return {
      supplierId,
      totalOrders,
      avgDeliveryDays,
      onTimeDeliveryRate,
      avgPriceVariance,
      avgQualityScore,
    };
  };

  // Get all supplier metrics
  const getAllMetrics = (): SupplierMetrics[] => {
    const supplierIds = [...new Set(performances.map(p => p.supplier_id))];
    return supplierIds
      .map(id => getMetricsForSupplier(id))
      .filter(Boolean) as SupplierMetrics[];
  };

  return {
    performances,
    isLoading,
    error,
    createPerformance,
    updatePerformance,
    getMetricsForSupplier,
    getAllMetrics,
    getPendingEvaluations,
  };
};
