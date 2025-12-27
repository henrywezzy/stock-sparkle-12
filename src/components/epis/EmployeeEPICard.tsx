import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HardHat, AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@/hooks/useEmployees";
import { EPIDelivery } from "@/hooks/useEPIDeliveries";
import { TermoEntrega } from "@/hooks/useTermosEntrega";

interface EmployeeEPICardProps {
  employee: Employee;
  deliveries: EPIDelivery[];
  termos: TermoEntrega[];
  onViewTermo?: (termo: TermoEntrega) => void;
}

export function EmployeeEPICard({ employee, deliveries, termos, onViewTermo }: EmployeeEPICardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeDeliveries = deliveries.filter(d => d.status === 'in_use');
  const expiredDeliveries = deliveries.filter(d => d.status === 'expired');

  const getStatusBadge = (delivery: EPIDelivery) => {
    const statusConfig = {
      in_use: { label: "Em uso", className: "bg-success/20 text-success", icon: CheckCircle },
      returned: { label: "Devolvido", className: "bg-muted text-muted-foreground", icon: Clock },
      expired: { label: "Vencido", className: "bg-destructive/20 text-destructive", icon: AlertTriangle },
    };
    const config = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.in_use;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">{employee.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {employee.registration_number} • {employee.position}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <HardHat className="w-3 h-3" />
              {activeDeliveries.length} EPIs
            </Badge>
            {expiredDeliveries.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {expiredDeliveries.length} vencidos
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {/* Active EPIs */}
          <div>
            <h4 className="text-sm font-medium mb-2">EPIs em Uso</h4>
            {activeDeliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum EPI ativo</p>
            ) : (
              <div className="space-y-2">
                {activeDeliveries.map(delivery => (
                  <div key={delivery.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-primary" />
                      <span className="text-sm">{delivery.epis?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Entrega: {format(new Date(delivery.delivery_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {delivery.expiry_date && (
                        <span>• Validade: {format(new Date(delivery.expiry_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                      {getStatusBadge(delivery)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Termos */}
          {termos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Termos de Entrega</h4>
              <div className="space-y-2">
                {termos.slice(0, 3).map(termo => (
                  <div key={termo.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{termo.numero}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(termo.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {onViewTermo && (
                        <Button variant="ghost" size="sm" onClick={() => onViewTermo(termo)}>
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
