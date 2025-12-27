import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CompanySettings {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      const { data, error } = await supabase
        .from("company_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", settings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast({ title: "Configurações salvas!", description: "Os dados da empresa foram atualizados." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar logo", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(fileName);
    return data.publicUrl;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    uploadLogo,
  };
}
