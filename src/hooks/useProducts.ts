import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  supplier_id: string | null;
  quantity: number;
  min_quantity: number | null;
  max_quantity: number | null;
  unit: string | null;
  location: string | null;
  price: number | null;
  description: string | null;
  batch: string | null;
  expiry_date: string | null;
  status: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  barcode: string | null;
  categories?: { name: string; color: string } | null;
  suppliers?: { name: string } | null;
}

export interface ProductFormData {
  name: string;
  sku?: string;
  brand?: string;
  category_id?: string;
  supplier_id?: string;
  quantity: number;
  min_quantity?: number;
  unit?: string;
  location?: string;
  price?: number;
  description?: string;
}

export const useProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, color),
          suppliers (name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: ProductFormData) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto criado',
        description: 'O produto foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto atualizado',
        description: 'O produto foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Soft delete - apenas marca como deletado
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto removido',
        description: 'O produto foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
