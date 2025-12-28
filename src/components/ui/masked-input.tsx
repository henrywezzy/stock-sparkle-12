import * as React from "react";
import { Input } from "@/components/ui/input";
import { applyMask, MaskType } from "@/lib/masks";
import { cn } from "@/lib/utils";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const maskedValue = applyMask(inputValue, mask);
      onChange(maskedValue);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={mask === 'rg' ? 'text' : 'numeric'}
        value={value}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
