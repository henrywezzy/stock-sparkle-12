import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  compact?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, className, compact }: StatCardProps) {
  return (
    <div className={cn(
      "glass rounded-xl glass-hover animate-slide-up touch-manipulation",
      compact ? "p-3 sm:p-4" : "p-4 sm:p-6",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-muted-foreground font-medium truncate",
            compact ? "text-xs" : "text-xs sm:text-sm"
          )}>{title}</p>
          <p className={cn(
            "font-bold mt-1 gradient-text",
            compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
          )}>{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-1 sm:mt-2 flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span className="truncate">{Math.abs(trend.value)}% vs mês anterior</span>
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",
          compact ? "w-9 h-9 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-12 sm:h-12"
        )}>
          <Icon className={cn(
            "text-primary",
            compact ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6"
          )} />
        </div>
      </div>
    </div>
  );
}
