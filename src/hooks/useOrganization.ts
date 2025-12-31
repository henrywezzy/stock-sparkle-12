import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  cnpj: string | null;
  slug: string | null;
  logo_url: string | null;
  plan_type: 'trial' | 'basic' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired';
  subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  max_products: number;
  max_users: number;
  max_employees: number;
  features: {
    nfe_integration: boolean;
    api_access: boolean;
    multi_location: boolean;
    custom_reports: boolean;
    whatsapp_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  joined_at: string;
}

export interface UsageTracking {
  id: string;
  organization_id: string;
  metric_type: 'products' | 'users' | 'employees' | 'epis' | 'api_calls';
  current_count: number;
  limit_value: number;
  last_updated: string;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["organization", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching organization:", error);
        return null;
      }
      
      return data as Organization;
    },
    enabled: !!user,
  });

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["organization-members", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organization.id);
      
      if (error) {
        console.error("Error fetching members:", error);
        return [];
      }
      
      return data as OrganizationMember[];
    },
    enabled: !!organization,
  });

  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["usage-tracking", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      
      const { data, error } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("organization_id", organization.id);
      
      if (error) {
        console.error("Error fetching usage:", error);
        return [];
      }
      
      return data as UsageTracking[];
    },
    enabled: !!organization,
  });

  const updateOrganization = useMutation({
    mutationFn: async (updates: Partial<Organization>) => {
      if (!organization) throw new Error("No organization found");
      
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organization.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Organização atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating organization:", error);
      toast.error("Erro ao atualizar organização");
    },
  });

  const getUsageByType = (type: UsageTracking['metric_type']) => {
    return usage?.find(u => u.metric_type === type);
  };

  const isWithinLimit = (type: UsageTracking['metric_type']) => {
    const usageData = getUsageByType(type);
    if (!usageData) return true;
    return usageData.current_count < usageData.limit_value;
  };

  const getPlanLimits = () => {
    const limits = {
      trial: { products: 500, users: 3, employees: 50 },
      basic: { products: 500, users: 3, employees: 50 },
      professional: { products: Infinity, users: 10, employees: 200 },
      enterprise: { products: Infinity, users: Infinity, employees: Infinity },
    };
    return limits[organization?.plan_type || 'trial'];
  };

  const isTrialExpired = () => {
    if (!organization?.trial_ends_at) return false;
    return new Date(organization.trial_ends_at) < new Date();
  };

  const daysLeftInTrial = () => {
    if (!organization?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(organization.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const hasFeature = (feature: keyof Organization['features']) => {
    if (!organization?.features) return false;
    return organization.features[feature] === true;
  };

  return {
    organization,
    members,
    usage,
    isLoading: isLoadingOrg || isLoadingMembers || isLoadingUsage,
    updateOrganization,
    getUsageByType,
    isWithinLimit,
    getPlanLimits,
    isTrialExpired,
    daysLeftInTrial,
    hasFeature,
  };
};
