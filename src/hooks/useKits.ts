import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KitItem {
  id: string;
  kit_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
}

export interface ProductKit {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  is_virtual: boolean | null;
  quantity: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: { name: string };
  items?: KitItem[];
}

export interface KitFormData {
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  is_virtual?: boolean;
  quantity?: number;
  status?: string;
  items: { product_id: string; quantity: number }[];
}

export function useKits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kits, isLoading, error } = useQuery({
    queryKey: ['product_kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_kits')
        .select(`
          *,
          category:categories(name),
          items:kit_items(
            id,
            kit_id,
            product_id,
            quantity,
            created_at,
            product:products(id, name, sku, quantity)
          )
        `)
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      return data as ProductKit[];
    },
  });

  const createKit = useMutation({
    mutationFn: async ({ items, ...data }: KitFormData) => {
      // Create kit
      const { data: kit, error: kitError } = await supabase
        .from('product_kits')
        .insert([data])
        .select()
        .single();
      
      if (kitError) throw kitError;

      // Add items
      if (items.length > 0) {
        const kitItems = items.map(item => ({
          kit_id: kit.id,
          product_id: item.product_id,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('kit_items')
          .insert(kitItems);
        
        if (itemsError) throw itemsError;
      }

      return kit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_kits'] });
      toast({
        title: 'Sucesso',
        description: 'Kit criado com sucesso!',
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

  const updateKit = useMutation({
    mutationFn: async ({ id, items, ...data }: KitFormData & { id: string }) => {
      // Update kit
      const { error: kitError } = await supabase
        .from('product_kits')
        .update(data)
        .eq('id', id);
      
      if (kitError) throw kitError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('kit_items')
        .delete()
        .eq('kit_id', id);
      
      if (deleteError) throw deleteError;

      // Add new items
      if (items.length > 0) {
        const kitItems = items.map(item => ({
          kit_id: id,
          product_id: item.product_id,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('kit_items')
          .insert(kitItems);
        
        if (itemsError) throw itemsError;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_kits'] });
      toast({
        title: 'Sucesso',
        description: 'Kit atualizado com sucesso!',
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

  const deleteKit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_kits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_kits'] });
      toast({
        title: 'Sucesso',
        description: 'Kit excluído com sucesso!',
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

  // Check if kit can be fulfilled (all items have enough stock)
  const checkKitAvailability = (kit: ProductKit, quantity: number = 1): { available: boolean; missing: { product: string; required: number; available: number }[] } => {
    const missing: { product: string; required: number; available: number }[] = [];
    
    kit.items?.forEach(item => {
      const required = item.quantity * quantity;
      const available = item.product?.quantity || 0;
      
      if (available < required) {
        missing.push({
          product: item.product?.name || 'Produto desconhecido',
          required,
          available
        });
      }
    });

    return {
      available: missing.length === 0,
      missing
    };
  };

  return {
    kits,
    isLoading,
    error,
    createKit,
    updateKit,
    deleteKit,
    checkKitAvailability,
  };
}
