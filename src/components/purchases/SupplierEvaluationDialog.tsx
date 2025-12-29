import { useState } from "react";
import { Star, Building2, FileText, Calendar, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSupplierPerformance, SupplierPerformance } from "@/hooks/useSupplierPerformance";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SupplierEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  performanceId?: string;
  onSuccess?: () => void;
}

export function SupplierEvaluationDialog({
  open,
  onOpenChange,
  performanceId,
  onSuccess,
}: SupplierEvaluationDialogProps) {
  const { performances, updatePerformance } = useSupplierPerformance();
  const { suppliers } = useSuppliers();
  const { orders } = usePurchaseOrders();

  const performance = performances.find((p) => p.id === performanceId);
  const supplier = suppliers.find((s) => s.id === performance?.supplier_id);
  const order = orders.find((o) => o.id === performance?.order_id);

  const [qualityScore, setQualityScore] = useState<number>(performance?.quality_score || 0);
  const [notes, setNotes] = useState<string>(performance?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!performanceId || qualityScore === 0) return;

    setIsSubmitting(true);
    try {
      await updatePerformance.mutateAsync({
        id: performanceId,
        quality_score: qualityScore,
        notes: notes || performance?.notes,
      });
      onSuccess?.();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setQualityScore(star)}
          className={cn(
            "p-1 rounded transition-all hover:scale-110",
            star <= qualityScore
              ? "text-warning"
              : "text-muted-foreground hover:text-warning/70"
          )}
        >
          <Star
            className={cn(
              "w-8 h-8 transition-all",
              star <= qualityScore && "fill-warning"
            )}
          />
        </button>
      ))}
    </div>
  );

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 1:
        return "Péssimo";
      case 2:
        return "Ruim";
      case 3:
        return "Regular";
      case 4:
        return "Bom";
      case 5:
        return "Excelente";
      default:
        return "Selecione uma nota";
    }
  };

  if (!performance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" />
            Avaliar Fornecedor
          </DialogTitle>
          <DialogDescription>
            Avalie a qualidade do fornecimento recebido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{supplier?.name || "Fornecedor"}</p>
                <p className="text-xs text-muted-foreground">{supplier?.cnpj}</p>
              </div>
            </div>

            {order && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{order.numero}</span>
                </div>
                {order.total && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                )}
              </div>
            )}

            {performance.delivered_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Recebido em {format(new Date(performance.delivered_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {performance.promised_date && (
                  <Badge
                    variant={
                      new Date(performance.delivered_date) <= new Date(performance.promised_date)
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {new Date(performance.delivered_date) <= new Date(performance.promised_date)
                      ? "No prazo"
                      : "Atrasado"}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Quality Rating */}
          <div className="space-y-3">
            <Label className="text-base">Qualidade do Fornecimento</Label>
            <div className="flex flex-col items-center gap-2">
              <StarRating />
              <p
                className={cn(
                  "text-sm font-medium",
                  qualityScore >= 4
                    ? "text-success"
                    : qualityScore >= 3
                    ? "text-warning"
                    : qualityScore > 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {getScoreLabel(qualityScore)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione comentários sobre a qualidade, embalagem, documentação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={qualityScore === 0 || isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}