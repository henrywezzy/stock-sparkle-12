import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";

export interface OrganizationWithDetails {
  id: string;
  name: string;
  cnpj: string | null;
  slug: string | null;
  plan_type: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  max_products: number;
  max_users: number;
  member_count?: number;
  usage?: {
    products: number;
    employees: number;
    epis: number;
  };
}

export interface AdminMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  trialingOrganizations: number;
  canceledOrganizations: number;
  expiredOrganizations: number;
  mrr: number;
  arr: number;
  churnRate: number;
  trialConversionRate: number;
  averageRevenuePerUser: number;
  organizationsByPlan: {
    trial: number;
    basic: number;
    professional: number;
    enterprise: number;
  };
  growthRate: number;
  newOrganizationsThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
}

const PLAN_PRICES = {
  trial: 0,
  basic: 297,
  professional: 597,
  enterprise: 1197,
};

export const useAdminMetrics = () => {
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrganizationWithDetails[];
    },
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "paid")
        .order("paid_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, user_id")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const calculateMetrics = (): AdminMetrics | null => {
    if (!organizations) return null;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const thisMonthStart = startOfMonth(now);

    // Count organizations by status
    const activeOrgs = organizations.filter(o => o.subscription_status === "active");
    const trialingOrgs = organizations.filter(o => o.subscription_status === "trialing");
    const canceledOrgs = organizations.filter(o => o.subscription_status === "canceled");
    const expiredOrgs = organizations.filter(o => o.subscription_status === "expired");

    // Count by plan
    const orgsByPlan = {
      trial: organizations.filter(o => o.plan_type === "trial").length,
      basic: organizations.filter(o => o.plan_type === "basic").length,
      professional: organizations.filter(o => o.plan_type === "professional").length,
      enterprise: organizations.filter(o => o.plan_type === "enterprise").length,
    };

    // Calculate MRR from active subscriptions
    const mrr = activeOrgs.reduce((acc, org) => {
      return acc + (PLAN_PRICES[org.plan_type as keyof typeof PLAN_PRICES] || 0);
    }, 0);

    // ARR = MRR * 12
    const arr = mrr * 12;

    // Churn Rate = (Canceled this month / Active at start of month) * 100
    const canceledThisMonth = organizations.filter(
      o => o.subscription_status === "canceled" && 
      new Date(o.created_at) >= thisMonthStart
    ).length;
    const activeAtStartOfMonth = activeOrgs.length + canceledThisMonth;
    const churnRate = activeAtStartOfMonth > 0 
      ? (canceledThisMonth / activeAtStartOfMonth) * 100 
      : 0;

    // Trial Conversion Rate
    const convertedTrials = organizations.filter(
      o => o.subscription_status === "active" && 
      o.plan_type !== "trial"
    ).length;
    const totalTrialsEver = organizations.length; // Simplification
    const trialConversionRate = totalTrialsEver > 0 
      ? (convertedTrials / totalTrialsEver) * 100 
      : 0;

    // ARPU (Average Revenue Per User)
    const averageRevenuePerUser = activeOrgs.length > 0 
      ? mrr / activeOrgs.length 
      : 0;

    // New organizations this month
    const newOrganizationsThisMonth = organizations.filter(
      o => new Date(o.created_at) >= thisMonthStart
    ).length;

    // Growth Rate (compared to last month)
    const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
    const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));
    const newLastMonth = organizations.filter(o => {
      const created = new Date(o.created_at);
      return created >= lastMonthStart && created <= lastMonthEnd;
    }).length;
    const growthRate = newLastMonth > 0 
      ? ((newOrganizationsThisMonth - newLastMonth) / newLastMonth) * 100 
      : newOrganizationsThisMonth > 0 ? 100 : 0;

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subDays(now, i * 30);
      const monthKey = format(monthDate, "MMM/yy");
      
      // Simulate revenue based on active orgs at that time
      const orgsAtTime = organizations.filter(o => {
        const created = new Date(o.created_at);
        return created <= monthDate && o.subscription_status === "active";
      });
      
      const monthRevenue = orgsAtTime.reduce((acc, org) => {
        return acc + (PLAN_PRICES[org.plan_type as keyof typeof PLAN_PRICES] || 0);
      }, 0);
      
      revenueByMonth.push({ month: monthKey, revenue: monthRevenue });
    }

    return {
      totalOrganizations: organizations.length,
      activeOrganizations: activeOrgs.length,
      trialingOrganizations: trialingOrgs.length,
      canceledOrganizations: canceledOrgs.length,
      expiredOrganizations: expiredOrgs.length,
      mrr,
      arr,
      churnRate,
      trialConversionRate,
      averageRevenuePerUser,
      organizationsByPlan: orgsByPlan,
      growthRate,
      newOrganizationsThisMonth,
      revenueByMonth,
    };
  };

  const metrics = calculateMetrics();

  // Enrich organizations with member counts
  const enrichedOrganizations = organizations?.map(org => ({
    ...org,
    member_count: members?.filter(m => m.organization_id === org.id).length || 0,
  }));

  return {
    organizations: enrichedOrganizations,
    metrics,
    isLoading: isLoadingOrgs || isLoadingPayments || isLoadingMembers,
  };
};
