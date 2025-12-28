import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { maskDate, onlyNumbers, isValidDate } from "@/lib/masks";

interface DateInputProps {
  value: string; // ISO format YYYY-MM-DD or empty
  onChange: (value: string) => void; // Returns ISO format
  placeholder?: string;
  disabled?: boolean;
  showValidation?: boolean;
  showPicker?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DateInput({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  disabled = false,
  showValidation = true,
  showPicker = true,
  className,
  minDate,
  maxDate,
}: DateInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [validationState, setValidationState] = React.useState<'valid' | 'invalid' | null>(null);

  // Convert ISO to display format when value changes externally
  React.useEffect(() => {
    if (value) {
      const date = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(date)) {
        setInputValue(format(date, "dd/MM/yyyy"));
        setValidationState('valid');
      }
    } else {
      setInputValue("");
      setValidationState(null);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const maskedValue = maskDate(rawValue);
    setInputValue(maskedValue);

    const numbers = onlyNumbers(maskedValue);
    
    if (numbers.length === 8) {
      if (isValidDate(maskedValue)) {
        // Parse DD/MM/YYYY to Date
        const parsedDate = parse(maskedValue, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
          // Check min/max constraints
          if (minDate && parsedDate < minDate) {
            setValidationState('invalid');
            return;
          }
          if (maxDate && parsedDate > maxDate) {
            setValidationState('invalid');
            return;
          }
          setValidationState('valid');
          // Return ISO format
          onChange(format(parsedDate, "yyyy-MM-dd"));
        } else {
          setValidationState('invalid');
        }
      } else {
        setValidationState('invalid');
      }
    } else if (numbers.length > 0) {
      setValidationState(null);
      // Clear the value if incomplete
      if (value) {
        onChange("");
      }
    } else {
      setValidationState(null);
      onChange("");
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
      onChange(format(date, "yyyy-MM-dd"));
      setValidationState('valid');
    }
    setIsOpen(false);
  };

  const selectedDate = React.useMemo(() => {
    if (value) {
      const date = parse(value, "yyyy-MM-dd", new Date());
      return isValid(date) ? date : undefined;
    }
    return undefined;
  }, [value]);

  return (
    <div className={cn("relative flex", className)}>
      <div className="relative flex-1">
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10",
            showPicker && "rounded-r-none border-r-0",
            validationState === 'valid' && "border-success focus-visible:ring-success/20",
            validationState === 'invalid' && "border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {validationState === 'valid' ? (
              <Check className="w-4 h-4 text-success" />
            ) : validationState === 'invalid' ? (
              <X className="w-4 h-4 text-destructive" />
            ) : null}
          </div>
        )}
      </div>
      
      {showPicker && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className="rounded-l-none border-l-0 shrink-0"
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
