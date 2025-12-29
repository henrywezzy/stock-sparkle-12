import { AlertTriangle, Shield, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEPICompliance, EmployeeComplianceStatus } from "@/hooks/useEPICompliance";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface EPIComplianceAlertProps {
  compact?: boolean;
}

export function EPIComplianceAlert({ compact = false }: EPIComplianceAlertProps) {
  const { summary, nonCompliantEmployees, hasRequirements } = useEPICompliance();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const navigate = useNavigate();

  // Don't show anything if no requirements are configured
  if (!hasRequirements) return null;

  // Don't show if everyone is compliant
  if (nonCompliantEmployees.length === 0) {
    if (compact) return null;
    
    return (
      <div className="rounded-xl p-4 bg-success/10 border border-success/30 flex items-center gap-3">
        <Shield className="w-5 h-5 text-success" />
        <div>
          <p className="font-medium text-success">Todos os funcionários em conformidade com EPIs</p>
          <p className="text-sm text-muted-foreground">
            {summary.totalEmployees} funcionário(s) com todos os EPIs obrigatórios válidos
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        className="h-auto p-3 bg-destructive/10 border border-destructive/30 rounded-xl w-full justify-between"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div className="text-left">
            <p className="font-medium text-destructive">{nonCompliantEmployees.length} funcionário(s) sem EPI válido</p>
            <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <>
      <div className="rounded-xl p-4 bg-destructive/10 border border-destructive/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                {nonCompliantEmployees.length} funcionário(s) sem EPI válido
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.employeesWithMissingEPI > 0 && `${summary.employeesWithMissingEPI} sem EPI obrigatório`}
                {summary.employeesWithMissingEPI > 0 && summary.employeesWithExpiredEPI > 0 && " • "}
                {summary.employeesWithExpiredEPI > 0 && `${summary.employeesWithExpiredEPI} com EPI vencido`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailsOpen(true)}
            className="shrink-0"
          >
            Ver detalhes
          </Button>
        </div>

        {/* Quick list */}
        <div className="mt-3 pt-3 border-t border-destructive/20 space-y-2">
          {nonCompliantEmployees.slice(0, 3).map((employee) => (
            <div key={employee.employeeId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{employee.employeeName}</span>
                {employee.department && (
                  <Badge variant="outline" className="text-xs">
                    {employee.department}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {employee.missingCategories.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {employee.missingCategories.length} faltando
                  </Badge>
                )}
                {employee.expiredCategories.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
                    {employee.expiredCategories.length} vencido
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {nonCompliantEmployees.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{nonCompliantEmployees.length - 3} mais funcionários
            </p>
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Funcionários Sem EPI Válido
            </DialogTitle>
            <DialogDescription>
              Lista de funcionários que não possuem todos os EPIs obrigatórios ou possuem EPIs vencidos
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-destructive">{summary.employeesWithMissingEPI}</p>
              <p className="text-xs text-muted-foreground">Sem EPI obrigatório</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-warning">{summary.employeesWithExpiredEPI}</p>
              <p className="text-xs text-muted-foreground">Com EPI vencido</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{Math.round(summary.overallComplianceRate)}%</p>
              <p className="text-xs text-muted-foreground">Conformidade geral</p>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {nonCompliantEmployees.map((employee) => (
                <EmployeeComplianceCard key={employee.employeeId} employee={employee} />
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => { setIsDetailsOpen(false); navigate('/epis'); }}>
              Ir para EPIs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmployeeComplianceCard({ employee }: { employee: EmployeeComplianceStatus }) {
  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium">{employee.employeeName}</p>
          <div className="flex gap-2 mt-1">
            {employee.department && (
              <Badge variant="outline" className="text-xs">
                {employee.department}
              </Badge>
            )}
            {employee.position && (
              <Badge variant="outline" className="text-xs">
                {employee.position}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{Math.round(employee.complianceRate)}%</p>
          <p className="text-xs text-muted-foreground">conformidade</p>
        </div>
      </div>

      {employee.missingCategories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">EPIs faltando:</p>
          <div className="flex flex-wrap gap-1">
            {employee.missingCategories.map((category) => (
              <Badge key={category} variant="destructive" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {employee.expiredCategories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">EPIs vencidos:</p>
          <div className="flex flex-wrap gap-1">
            {employee.expiredCategories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs bg-warning/20 text-warning">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
