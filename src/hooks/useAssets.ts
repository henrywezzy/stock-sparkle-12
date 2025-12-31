import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Asset {
  id: string;
  name: string;
  asset_tag: string | null;
  serial_number: string | null;
  model: string | null;
  manufacturer: string | null;
  location_id: string | null;
  department: string | null;
  status: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  location?: { name: string; code: string | null };
}

export interface AssetFormData {
  name: string;
  asset_tag?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  location_id?: string;
  department?: string;
  status?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

export function useAssets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          location:locations(name, code)
        `)
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      return data as Asset[];
    },
  });

  const createAsset = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const { data: result, error } = await supabase
        .from('assets')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: 'Sucesso',
        description: 'Ativo criado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...data }: AssetFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('assets')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: 'Sucesso',
        description: 'Ativo atualizado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: 'Sucesso',
        description: 'Ativo excluído com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get asset consumption history
  const { data: assetConsumption } = useQuery({
    queryKey: ['asset_consumption'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exits')
        .select(`
          *,
          product:products(name, sku),
          asset:assets(name, asset_tag)
        `)
        .not('asset_id', 'is', null)
        .order('exit_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return {
    assets,
    isLoading,
    error,
    assetConsumption,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
