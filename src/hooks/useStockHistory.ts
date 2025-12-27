import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockHistoryEntry {
  id: string;
  product_id: string;
  action: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previous_quantity: number | null;
  new_quantity: number | null;
  user_name: string | null;
  notes: string | null;
  created_at: string;
  products?: { name: string; sku: string | null } | null;
}

export const useStockHistory = (productId?: string) => {
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['stock-history', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_history')
        .select(`
          *,
          products (name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StockHistoryEntry[];
    },
  });

  return {
    history,
    isLoading,
    error,
  };
};
