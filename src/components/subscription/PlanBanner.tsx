import { useState } from "react";
import { AlertTriangle, Crown, Clock, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

export function PlanBanner() {
  const { organization, daysLeftInTrial, isTrialExpired } = useOrganization();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!organization || isDismissed) return null;

  const isTrialing = organization.subscription_status === 'trialing';
  const isPastDue = organization.subscription_status === 'past_due';
  const isExpired = organization.subscription_status === 'expired' || isTrialExpired();
  const daysLeft = daysLeftInTrial();

  // Don't show banner if subscription is active
  if (organization.subscription_status === 'active') return null;

  const getBannerConfig = () => {
    if (isExpired || isPastDue) {
      return {
        bg: "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        title: isPastDue ? "Pagamento pendente" : "Período de teste expirado",
        description: isPastDue 
          ? "Regularize seu pagamento para continuar usando o sistema."
          : "Assine um plano para continuar usando todas as funcionalidades.",
        buttonText: "Ver Planos",
        buttonVariant: "destructive" as const,
      };
    }

    if (isTrialing && daysLeft <= 3) {
      return {
        bg: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20",
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        title: `Restam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} de teste`,
        description: "Assine agora e não perca acesso às funcionalidades.",
        buttonText: "Ver Planos",
        buttonVariant: "default" as const,
      };
    }

    if (isTrialing) {
      return {
        bg: "bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20",
        icon: <Crown className="h-5 w-5 text-primary" />,
        title: `Período de teste: ${daysLeft} dias restantes`,
        description: "Explore todas as funcionalidades gratuitamente.",
        buttonText: "Ver Planos",
        buttonVariant: "outline" as const,
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className={cn(
      "relative px-4 py-3 border-b flex items-center justify-between gap-4",
      config.bg
    )}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.title}</span>
            <Badge variant="outline" className="text-xs">
              {organization.plan_type === 'trial' ? 'Trial' : organization.plan_type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant={config.buttonVariant} 
          size="sm"
          className="gap-1"
        >
          {config.buttonText}
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        {!isExpired && !isPastDue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
