import { useState } from 'react';
import { ArrowUpFromLine, Minus, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExits } from '@/hooks/useExits';
import { useEmployees } from '@/hooks/useEmployees';
import { useAssets } from '@/hooks/useAssets';

interface MobileExitFormProps {
  product: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function MobileExitForm({ product, onSuccess, onCancel }: MobileExitFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [assetId, setAssetId] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const { createExit } = useExits();
  const { employees } = useEmployees();
  const { assets } = useAssets();

  const activeEmployees = employees?.filter(e => e.status === 'active') || [];
  const activeAssets = assets?.filter(a => a.status === 'active') || [];

  const handleSubmit = async () => {
    await createExit.mutateAsync({
      product_id: product.id,
      quantity,
      employee_id: employeeId || undefined,
      asset_id: assetId || undefined,
      notes: notes || `Saída via scanner mobile`,
      exit_date: new Date().toISOString(),
    });
    onSuccess();
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(product.quantity, prev + 1));
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const insufficientStock = quantity > product.quantity;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Product info */}
      <div className="bg-orange-500/10 rounded-2xl p-6 text-center">
        <ArrowUpFromLine className="w-12 h-12 mx-auto mb-4 text-orange-500" />
        <h2 className="text-xl font-bold text-foreground mb-1">{product.name}</h2>
        {product.sku && (
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Estoque atual: <span className="font-semibold text-foreground">{product.quantity}</span>
        </p>
      </div>

      {/* Quantity selector */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Quantidade</Label>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full text-2xl"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="w-8 h-8" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 h-16 text-center text-3xl font-bold"
            min={1}
            max={product.quantity}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full text-2xl"
            onClick={incrementQuantity}
            disabled={quantity >= product.quantity}
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>
      </div>

      {/* Warning for insufficient stock */}
      {insufficientStock && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">
            Estoque insuficiente! Disponível: {product.quantity}
          </p>
        </div>
      )}

      {/* Employee selector */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Funcionário (opcional)</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="h-14 text-lg">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {activeEmployees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Asset selector */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Equipamento (opcional)</Label>
        <Select value={assetId} onValueChange={setAssetId}>
          <SelectTrigger className="h-14 text-lg">
            <SelectValue placeholder="Aplicado ao equipamento" />
          </SelectTrigger>
          <SelectContent>
            {activeAssets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                {asset.name} {asset.asset_tag && `(${asset.asset_tag})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Observações (opcional)</Label>
        <Input
          placeholder="Ex: Manutenção preventiva"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-14 text-lg"
        />
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-center text-lg">
          Após saída:{' '}
          <span className={`font-bold ${insufficientStock ? 'text-destructive' : 'text-orange-500'}`}>
            {product.quantity - quantity} unidades
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-16 text-lg"
          onClick={onCancel}
        >
          <X className="w-5 h-5 mr-2" />
          Cancelar
        </Button>
        <Button
          size="lg"
          className="flex-1 h-16 text-lg bg-orange-500 hover:bg-orange-600"
          onClick={handleSubmit}
          disabled={createExit.isPending || insufficientStock}
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}
