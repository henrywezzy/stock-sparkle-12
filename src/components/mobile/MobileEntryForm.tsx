import { useState } from 'react';
import { ArrowDownToLine, Minus, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEntries } from '@/hooks/useEntries';

interface MobileEntryFormProps {
  product: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function MobileEntryForm({ product, onSuccess, onCancel }: MobileEntryFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { createEntry } = useEntries();

  const handleSubmit = async () => {
    await createEntry.mutateAsync({
      product_id: product.id,
      quantity,
      notes: notes || `Entrada via scanner mobile`,
      entry_date: new Date().toISOString(),
    });
    onSuccess();
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Product info */}
      <div className="bg-primary/10 rounded-2xl p-6 text-center">
        <ArrowDownToLine className="w-12 h-12 mx-auto mb-4 text-primary" />
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
          />
          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full text-2xl"
            onClick={incrementQuantity}
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Observações (opcional)</Label>
        <Input
          placeholder="Ex: Lote 2024-001"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-14 text-lg"
        />
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-center text-lg">
          Após entrada:{' '}
          <span className="font-bold text-primary">
            {product.quantity + quantity} unidades
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
          className="flex-1 h-16 text-lg"
          onClick={handleSubmit}
          disabled={createEntry.isPending}
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}
