import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Location {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_default: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationFormData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  is_default?: boolean;
  status?: string;
}

export function useLocations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });

  const createLocation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      // If setting as default, first unset all others
      if (data.is_default) {
        await supabase
          .from('locations')
          .update({ is_default: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: result, error } = await supabase
        .from('locations')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Sucesso',
        description: 'Localização criada com sucesso!',
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

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...data }: LocationFormData & { id: string }) => {
      // If setting as default, first unset all others
      if (data.is_default) {
        await supabase
          .from('locations')
          .update({ is_default: false })
          .neq('id', id);
      }

      const { data: result, error } = await supabase
        .from('locations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Sucesso',
        description: 'Localização atualizada com sucesso!',
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

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Sucesso',
        description: 'Localização excluída com sucesso!',
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

  const defaultLocation = locations?.find(l => l.is_default) || locations?.[0];

  return {
    locations,
    defaultLocation,
    isLoading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
