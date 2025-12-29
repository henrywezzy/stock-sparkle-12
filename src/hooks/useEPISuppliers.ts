import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPISupplier {
  id: string;
  epi_category: string;
  supplier_id: string;
  created_at: string;
}

// Since we don't have a table for this yet, we'll use local storage temporarily
// and suggest a migration for proper persistence

export const useEPISuppliers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For now, store EPI category-supplier relationships in localStorage
  // until a proper table is created
  const getStoredRelations = (): Record<string, string[]> => {
    const stored = localStorage.getItem('epi-supplier-categories');
    return stored ? JSON.parse(stored) : {};
  };

  const setStoredRelations = (relations: Record<string, string[]>) => {
    localStorage.setItem('epi-supplier-categories', JSON.stringify(relations));
  };

  const { data: epiSupplierRelations = {}, refetch } = useQuery({
    queryKey: ['epi-supplier-categories'],
    queryFn: async () => {
      return getStoredRelations();
    },
  });

  const setSuppliersForEPICategory = useMutation({
    mutationFn: async ({ epiCategory, supplierIds }: { epiCategory: string; supplierIds: string[] }) => {
      const current = getStoredRelations();
      current[epiCategory] = supplierIds;
      setStoredRelations(current);
      return current;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi-supplier-categories'] });
      toast({
        title: 'Fornecedores atualizados',
        description: 'Os fornecedores foram vinculados à categoria de EPI.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar fornecedores',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getSuppliersForEPICategory = (epiCategory: string): string[] => {
    return epiSupplierRelations[epiCategory] || [];
  };

  return {
    epiSupplierRelations,
    setSuppliersForEPICategory,
    getSuppliersForEPICategory,
    refetch,
  };
};
