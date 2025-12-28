import * as React from "react";
import { Input } from "@/components/ui/input";
import { applyMask, MaskType, isValidCNPJ, isValidCPF, isValidDate, onlyNumbers, fetchAddressByCEP, ViaCEPResponse } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
  onAddressFound?: (address: ViaCEPResponse) => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, showValidation = true, onAddressFound, ...props }, ref) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [validationState, setValidationState] = React.useState<'valid' | 'invalid' | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const maskedValue = applyMask(inputValue, mask);
      onChange(maskedValue);
    };

    // Validação em tempo real para CNPJ e CPF
    React.useEffect(() => {
      if (!showValidation) {
        setValidationState(null);
        return;
      }

      const numbers = onlyNumbers(value);
      
      if (mask === 'cnpj') {
        if (numbers.length === 14) {
          setValidationState(isValidCNPJ(value) ? 'valid' : 'invalid');
        } else if (numbers.length > 0) {
          setValidationState(null);
        } else {
          setValidationState(null);
        }
      } else if (mask === 'cpf') {
        if (numbers.length === 11) {
          setValidationState(isValidCPF(value) ? 'valid' : 'invalid');
        } else if (numbers.length > 0) {
          setValidationState(null);
        } else {
          setValidationState(null);
        }
      } else if (mask === 'date') {
        if (numbers.length === 8) {
          setValidationState(isValidDate(value) ? 'valid' : 'invalid');
        } else {
          setValidationState(null);
        }
      } else {
        setValidationState(null);
      }
    }, [value, mask, showValidation]);

    // Busca CEP automaticamente
    React.useEffect(() => {
      if (mask !== 'cep' || !onAddressFound) return;
      
      const numbers = onlyNumbers(value);
      if (numbers.length !== 8) return;

      const fetchAddress = async () => {
        setIsLoading(true);
        const address = await fetchAddressByCEP(value);
        setIsLoading(false);
        
        if (address) {
          setValidationState('valid');
          onAddressFound(address);
        } else {
          setValidationState('invalid');
        }
      };

      const debounce = setTimeout(fetchAddress, 500);
      return () => clearTimeout(debounce);
    }, [value, mask, onAddressFound]);

    const showIcon = showValidation && (mask === 'cnpj' || mask === 'cpf' || mask === 'date' || (mask === 'cep' && onAddressFound));

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode={mask === 'rg' ? 'text' : 'numeric'}
          value={value}
          onChange={handleChange}
          className={cn(
            showIcon && "pr-10",
            validationState === 'valid' && "border-success focus-visible:ring-success/20",
            validationState === 'invalid' && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          {...props}
        />
        {showIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : validationState === 'valid' ? (
              <Check className="w-4 h-4 text-success" />
            ) : validationState === 'invalid' ? (
              <X className="w-4 h-4 text-destructive" />
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = "MaskedInput";
