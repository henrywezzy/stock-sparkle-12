import * as React from "react";
import { Input } from "@/components/ui/input";
import { applyMask, MaskType, isValidCNPJ, isValidCPF, isValidDate, onlyNumbers, fetchAddressByCEP, fetchCompanyByCNPJ, ViaCEPResponse, CNPJResponse } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
  onAddressFound?: (address: ViaCEPResponse) => void;
  onCompanyFound?: (company: CNPJResponse) => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, showValidation = true, onAddressFound, onCompanyFound, ...props }, ref) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [validationState, setValidationState] = React.useState<'valid' | 'invalid' | null>(null);
    const lastFetchedCEP = React.useRef<string>('');
    const lastFetchedCNPJ = React.useRef<string>('');

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

      // Não sobrescrever estado de loading
      if (isLoading) return;

      const numbers = onlyNumbers(value);
      
      if (mask === 'cnpj') {
        if (numbers.length === 14) {
          // Se tem callback de busca, deixar a busca definir o estado
          if (!onCompanyFound) {
            setValidationState(isValidCNPJ(value) ? 'valid' : 'invalid');
          }
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
    }, [value, mask, showValidation, isLoading]);

    // Busca CEP automaticamente - usando ref para evitar buscas duplicadas
    React.useEffect(() => {
      if (mask !== 'cep' || !onAddressFound) return;
      
      const numbers = onlyNumbers(value);
      if (numbers.length !== 8) {
        lastFetchedCEP.current = '';
        return;
      }

      // Não buscar se já buscou esse CEP
      if (lastFetchedCEP.current === numbers) return;

      const fetchAddress = async () => {
        setIsLoading(true);
        lastFetchedCEP.current = numbers;
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
    }, [value, mask]);

    // Ref para rastrear se o usuário digitou algo (não apenas valor inicial do modal)
    const userHasTyped = React.useRef(false);
    const previousValue = React.useRef(value);

    // Detectar quando o usuário digita (valor muda após interação)
    React.useEffect(() => {
      if (value !== previousValue.current) {
        // Se o valor mudou e não é um valor inicial completo (14 dígitos), significa que o usuário está digitando
        const prevNumbers = onlyNumbers(previousValue.current);
        const currNumbers = onlyNumbers(value);
        
        // Se estava vazio e agora tem algo, ou se aumentou 1 caractere, usuário digitou
        if (currNumbers.length > prevNumbers.length || (prevNumbers.length === 0 && currNumbers.length > 0)) {
          userHasTyped.current = true;
        }
        
        previousValue.current = value;
      }
    }, [value]);

    // Reset quando modal fecha (value volta para vazio)
    React.useEffect(() => {
      if (!value || onlyNumbers(value).length === 0) {
        userHasTyped.current = false;
        lastFetchedCNPJ.current = '';
      }
    }, [value]);

    // Busca CNPJ apenas quando o usuário DIGITA - não ao abrir modal
    React.useEffect(() => {
      if (mask !== 'cnpj' || !onCompanyFound) return;
      
      const numbers = onlyNumbers(value);
      if (numbers.length !== 14) {
        return;
      }
      
      // Só buscar se o usuário digitou algo (não apenas ao carregar modal com valor existente)
      if (!userHasTyped.current) return;
      
      // Não buscar se já buscou esse CNPJ
      if (lastFetchedCNPJ.current === numbers) return;
      
      // Verifica se é um CNPJ válido antes de buscar
      if (!isValidCNPJ(value)) {
        setValidationState('invalid');
        return;
      }

      const fetchCompany = async () => {
        setIsLoading(true);
        lastFetchedCNPJ.current = numbers;
        const company = await fetchCompanyByCNPJ(value);
        setIsLoading(false);
        
        if (company) {
          setValidationState('valid');
          onCompanyFound(company);
        } else {
          // CNPJ é válido mas não encontrado na base
          setValidationState('valid');
        }
      };

      const debounce = setTimeout(fetchCompany, 800);
      return () => clearTimeout(debounce);
    }, [value, mask]);

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
