import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierCategory {
  id: string;
  supplier_id: string;
  category_id: string;
  created_at: string;
}

export const useSupplierCategories = (supplierId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for a specific supplier
  const { data: supplierCategories = [], isLoading } = useQuery({
    queryKey: ['supplier-categories', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('supplier_categories')
        .select(`
          id,
          supplier_id,
          category_id,
          created_at,
          categories:category_id (
            id,
            name,
            color
          )
        `)
        .eq('supplier_id', supplierId);

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  // Fetch all supplier categories with category info (for lookups)
  const { data: allSupplierCategories = [] } = useQuery({
    queryKey: ['all-supplier-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_categories')
        .select(`
          id,
          supplier_id,
          category_id,
          created_at,
          categories:category_id (
            id,
            name,
            color
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  // Set categories for a supplier (replaces existing)
  const setSupplierCategories = useMutation({
    mutationFn: async ({ supplierId, categoryIds }: { supplierId: string; categoryIds: string[] }) => {
      // First, delete existing categories
      const { error: deleteError } = await supabase
        .from('supplier_categories')
        .delete()
        .eq('supplier_id', supplierId);

      if (deleteError) throw deleteError;

      // Then, insert new categories if any
      if (categoryIds.length > 0) {
        const { error: insertError } = await supabase
          .from('supplier_categories')
          .insert(
            categoryIds.map(categoryId => ({
              supplier_id: supplierId,
              category_id: categoryId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-supplier-categories'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar categorias',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get categories for a specific supplier by ID
  const getCategoriesForSupplier = (supplierId: string): string[] => {
    return allSupplierCategories
      .filter(sc => sc.supplier_id === supplierId)
      .map(sc => sc.category_id);
  };

  // Get first category for a supplier (for default selection in imports)
  const getFirstCategoryForSupplier = (supplierId: string): string | undefined => {
    const cats = getCategoriesForSupplier(supplierId);
    return cats.length > 0 ? cats[0] : undefined;
  };

  return {
    supplierCategories,
    allSupplierCategories,
    isLoading,
    setSupplierCategories,
    getCategoriesForSupplier,
    getFirstCategoryForSupplier,
  };
};
