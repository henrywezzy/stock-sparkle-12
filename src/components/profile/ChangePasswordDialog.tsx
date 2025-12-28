import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, X, KeyRound } from "lucide-react";
import { z } from "zod";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const passwordSchema = z.string()
  .min(7, 'A senha deve ter no mínimo 7 caracteres')
  .refine((password) => /[a-zA-Z]/.test(password), 'A senha deve conter pelo menos uma letra')
  .refine((password) => /[0-9]/.test(password), 'A senha deve conter pelo menos um número')
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), 'A senha deve conter pelo menos um símbolo');

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const checks = [
    { label: 'Mínimo 7 caracteres', valid: password.length >= 7 },
    { label: 'Contém letra', valid: /[a-zA-Z]/.test(password) },
    { label: 'Contém número', valid: /[0-9]/.test(password) },
    { label: 'Contém símbolo', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          {check.valid ? (
            <Check className="w-3 h-3 text-success" />
          ) : (
            <X className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={check.valid ? 'text-success' : 'text-muted-foreground'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      passwordSchema.parse(passwordData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ password: error.errors[0].message });
        return;
      }
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não conferem' });
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(passwordData.password);
    setIsLoading(false);

    if (!error) {
      setPasswordData({ password: '', confirmPassword: '' });
      onOpenChange(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPasswordData({ password: '', confirmPassword: '' });
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite sua nova senha abaixo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            <PasswordStrengthIndicator password={passwordData.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
