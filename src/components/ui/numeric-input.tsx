import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decimals?: number;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, min = 0, max, decimals = 0, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number to display string
    const formatToDisplay = (num: number): string => {
      if (num === 0 && !isFocused) return "";
      if (decimals > 0) {
        return num.toLocaleString('pt-BR', { 
          minimumFractionDigits: decimals, 
          maximumFractionDigits: decimals 
        });
      }
      return num.toString();
    };

    // Parse display string to number
    const parseToNumber = (str: string): number => {
      if (!str) return 0;
      if (decimals > 0) {
        const cleaned = str.replace(/[^\d,]/g, '');
        const normalized = cleaned.replace(',', '.');
        return parseFloat(normalized) || 0;
      }
      return parseInt(str.replace(/\D/g, ''), 10) || 0;
    };

    // Update display when value changes externally and not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatToDisplay(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      if (decimals > 0) {
        // Allow only digits and comma for decimals
        const cleaned = inputValue.replace(/[^\d,]/g, '');
        const parts = cleaned.split(',');
        let formatted = parts[0];
        if (parts.length > 1) {
          formatted += ',' + parts[1].slice(0, decimals);
        }
        inputValue = formatted;
      } else {
        // Allow only digits for integers
        inputValue = inputValue.replace(/\D/g, '');
      }
      
      setDisplayValue(inputValue);
      
      let numValue = parseToNumber(inputValue);
      if (min !== undefined && numValue < min) numValue = min;
      if (max !== undefined && numValue > max) numValue = max;
      
      onChange(numValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Show raw value on focus for easier editing
      if (value > 0) {
        if (decimals > 0) {
          setDisplayValue(value.toFixed(decimals).replace('.', ','));
        } else {
          setDisplayValue(value.toString());
        }
      } else {
        setDisplayValue("");
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      let numValue = parseToNumber(displayValue);
      if (min !== undefined && numValue < min) numValue = min;
      if (max !== undefined && numValue > max) numValue = max;
      onChange(numValue);
      setDisplayValue(formatToDisplay(numValue));
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(className)}
        placeholder={decimals > 0 ? "0,00" : "0"}
        {...props}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
