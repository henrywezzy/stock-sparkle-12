import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOrganization, UsageTracking } from "@/hooks/useOrganization";

interface UsageLimitAlertProps {
  metricType: UsageTracking['metric_type'];
  showUpgrade?: boolean;
}

const metricLabels: Record<UsageTracking['metric_type'], string> = {
  products: "Produtos",
  users: "Usuários",
  employees: "Funcionários",
  epis: "EPIs",
  api_calls: "Chamadas de API",
};

export function UsageLimitAlert({ metricType, showUpgrade = true }: UsageLimitAlertProps) {
  const { getUsageByType, isWithinLimit } = useOrganization();
  
  const usage = getUsageByType(metricType);
  
  if (!usage) return null;
  
  const percentage = (usage.current_count / usage.limit_value) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = !isWithinLimit(metricType);

  if (percentage < 80) return null;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {isAtLimit ? "Limite atingido" : "Aproximando do limite"}
        <span className="text-xs font-normal text-muted-foreground">
          ({metricLabels[metricType]})
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>{usage.current_count} de {usage.limit_value} {metricLabels[metricType].toLowerCase()}</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        
        {showUpgrade && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {isAtLimit 
                ? "Faça upgrade para adicionar mais."
                : "Considere fazer upgrade em breve."
              }
            </p>
            <Button size="sm" variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Upgrade
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function CompactUsageIndicator({ metricType }: { metricType: UsageTracking['metric_type'] }) {
  const { getUsageByType, isWithinLimit } = useOrganization();
  
  const usage = getUsageByType(metricType);
  
  if (!usage) return null;
  
  const percentage = (usage.current_count / usage.limit_value) * 100;
  const isAtLimit = !isWithinLimit(metricType);

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-2">
      <span>{usage.current_count}/{usage.limit_value}</span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
