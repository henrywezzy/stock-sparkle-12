import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskCurrency, unmaskCurrency, formatCurrencyValue } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => 
      value > 0 ? formatCurrencyValue(value) : ''
    );

    // Atualiza o display quando o valor externo muda
    React.useEffect(() => {
      if (value > 0) {
        setDisplayValue(formatCurrencyValue(value));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se estiver vazio, define como 0
      if (!inputValue) {
        setDisplayValue('');
        onChange(0);
        return;
      }
      
      // Aplica a máscara
      const masked = maskCurrency(inputValue);
      setDisplayValue(masked);
      
      // Converte para número e notifica a mudança
      const numericValue = unmaskCurrency(masked);
      onChange(numericValue);
    };

    const handleBlur = () => {
      // Ao sair do campo, formata o valor corretamente
      if (value > 0) {
        setDisplayValue(formatCurrencyValue(value));
      } else {
        setDisplayValue('');
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn("pl-10", className)}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
