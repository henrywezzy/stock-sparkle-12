import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number to display string
    const formatToDisplay = (num: number): string => {
      if (num === 0) return "";
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Parse display string to number
    const parseToNumber = (str: string): number => {
      if (!str) return 0;
      // Remove all non-digit characters except comma
      const cleaned = str.replace(/[^\d,]/g, '');
      // Replace comma with dot for parsing
      const normalized = cleaned.replace(',', '.');
      return parseFloat(normalized) || 0;
    };

    // Update display when value changes externally and not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatToDisplay(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow only digits and comma
      const cleaned = inputValue.replace(/[^\d,]/g, '');
      
      // Ensure only one comma
      const parts = cleaned.split(',');
      let formatted = parts[0];
      if (parts.length > 1) {
        formatted += ',' + parts[1].slice(0, 2);
      }
      
      setDisplayValue(formatted);
      onChange(parseToNumber(formatted));
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Show raw value on focus for easier editing
      if (value > 0) {
        setDisplayValue(value.toFixed(2).replace('.', ','));
      } else {
        setDisplayValue("");
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      setDisplayValue(formatToDisplay(value));
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
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
