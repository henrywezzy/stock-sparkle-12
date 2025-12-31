import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: string;
  completed?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Sistema!",
    description: "Vamos fazer um tour rápido para você conhecer as principais funcionalidades.",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Aqui você tem uma visão geral do seu estoque, EPIs e indicadores importantes.",
    target: "[data-onboarding='dashboard']",
  },
  {
    id: "products",
    title: "Produtos",
    description: "Gerencie todos os seus produtos. Lembre-se: novos produtos são cadastrados através de Entradas.",
    target: "[data-onboarding='products']",
  },
  {
    id: "entries",
    title: "Entradas",
    description: "Registre entradas de produtos no estoque. Você pode usar o scanner para agilizar!",
    target: "[data-onboarding='entries']",
  },
  {
    id: "exits",
    title: "Saídas",
    description: "Registre saídas de produtos. Use o modo Armazém para operações rápidas com scanner.",
    target: "[data-onboarding='exits']",
  },
  {
    id: "epis",
    title: "EPIs",
    description: "Controle de Equipamentos de Proteção Individual, entregas e validades.",
    target: "[data-onboarding='epis']",
  },
  {
    id: "reports",
    title: "Relatórios",
    description: "Gere relatórios completos de movimentações, estoque e muito mais.",
    target: "[data-onboarding='reports']",
  },
  {
    id: "warehouse",
    title: "Modo Armazém",
    description: "Acesso rápido para entradas e saídas com leitor de código de barras.",
    target: "[data-onboarding='warehouse']",
  },
  {
    id: "complete",
    title: "Tudo Pronto!",
    description: "Você completou o tour! Agora você pode explorar o sistema à vontade.",
  },
];

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        // Se não existir, criar registro
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from("user_onboarding")
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (insertError) {
            console.error("Error creating onboarding:", insertError);
            return null;
          }
          return newData;
        }
        console.error("Error fetching onboarding:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const updateOnboarding = useMutation({
    mutationFn: async (updates: {
      current_step?: number;
      completed_steps?: string[];
      is_completed?: boolean;
      skipped_at?: string;
      completed_at?: string;
    }) => {
      if (!user) throw new Error("No user");
      
      const { error } = await supabase
        .from("user_onboarding")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const completeStep = async (stepId: string) => {
    const rawSteps = onboardingData?.completed_steps;
    const completedSteps: string[] = Array.isArray(rawSteps) 
      ? rawSteps.filter((s): s is string => typeof s === 'string')
      : [];
    
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId];
      const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId);
      
      await updateOnboarding.mutateAsync({
        completed_steps: newCompletedSteps,
        current_step: Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1),
      });
    }
  };

  const skipOnboarding = async () => {
    await updateOnboarding.mutateAsync({
      skipped_at: new Date().toISOString(),
      is_completed: true,
    });
  };

  const completeOnboarding = async () => {
    await updateOnboarding.mutateAsync({
      completed_at: new Date().toISOString(),
      is_completed: true,
      current_step: ONBOARDING_STEPS.length - 1,
    });
  };

  const resetOnboarding = async () => {
    await updateOnboarding.mutateAsync({
      current_step: 0,
      completed_steps: [],
      is_completed: false,
      skipped_at: undefined,
      completed_at: undefined,
    });
  };

  const getCurrentStep = () => {
    const stepIndex = onboardingData?.current_step || 0;
    return ONBOARDING_STEPS[stepIndex];
  };

  const isStepCompleted = (stepId: string) => {
    const rawSteps = onboardingData?.completed_steps;
    const completedSteps: string[] = Array.isArray(rawSteps) 
      ? rawSteps.filter((s): s is string => typeof s === 'string')
      : [];
    return completedSteps.includes(stepId);
  };

  const shouldShowOnboarding = () => {
    if (!onboardingData) return false;
    return !onboardingData.is_completed && !onboardingData.skipped_at;
  };

  return {
    onboardingData,
    isLoading,
    currentStep: getCurrentStep(),
    currentStepIndex: onboardingData?.current_step || 0,
    totalSteps: ONBOARDING_STEPS.length,
    steps: ONBOARDING_STEPS,
    completeStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    isStepCompleted,
    shouldShowOnboarding,
    isCompleted: onboardingData?.is_completed || false,
  };
};
