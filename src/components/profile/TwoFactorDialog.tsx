import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, ShieldCheck, Smartphone, Copy, Check, AlertTriangle, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TwoFactorDialog({ open, onOpenChange }: TwoFactorDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'success' | 'disable'>('intro');
  const [factorData, setFactorData] = useState<{
    id: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const checkCurrentStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data.totp.find(f => f.status === 'verified');
      setIs2FAEnabled(!!totpFactor);
      
      if (totpFactor) {
        setStep('disable');
      } else {
        setStep('intro');
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      checkCurrentStatus();
    } else {
      setStep('intro');
      setFactorData(null);
      setVerifyCode('');
    }
    onOpenChange(isOpen);
  };

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Stockly App'
      });

      if (error) throw error;

      setFactorData({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret
      });
      setStep('setup');
    } catch (error: any) {
      toast({
        title: "Erro ao configurar 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (!factorData || verifyCode.length !== 6) return;

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorData.id
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorData.id,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) throw verifyError;

      setStep('success');
      toast({
        title: "2FA Ativado!",
        description: "Sua conta agora está protegida com autenticação de dois fatores.",
      });
    } catch (error: any) {
      toast({
        title: "Código inválido",
        description: "O código informado não é válido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    setIsLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.totp.find(f => f.status === 'verified');
      
      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id
        });
        
        if (error) throw error;
      }

      toast({
        title: "2FA Desativado",
        description: "A autenticação de dois fatores foi removida da sua conta.",
      });
      handleOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao desativar 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (factorData?.secret) {
      navigator.clipboard.writeText(factorData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Autenticação de Dois Fatores</DialogTitle>
              <DialogDescription>
                {step === 'disable' 
                  ? '2FA está ativo na sua conta'
                  : 'Adicione uma camada extra de segurança'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Como funciona?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você precisará de um aplicativo autenticador como Google Authenticator, 
                    Microsoft Authenticator ou Authy instalado no seu celular.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Proteção adicional contra acesso não autorizado</p>
              <p>✓ Código único gerado a cada 30 segundos</p>
              <p>✓ Funciona mesmo sem internet no celular</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => handleOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={startSetup} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  'Começar Configuração'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'setup' && factorData && (
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Escaneie o QR Code com seu aplicativo autenticador
              </p>
              <div className="inline-block p-4 bg-white rounded-xl">
                <img 
                  src={factorData.qr} 
                  alt="QR Code para 2FA" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ou digite o código manualmente:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {factorData.secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setStep('verify')}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-center text-muted-foreground">
                Digite o código de 6 dígitos exibido no seu aplicativo autenticador
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Código de Verificação</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep('setup')}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1"
                onClick={verifyAndActivate}
                disabled={verifyCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ativar 2FA'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 mt-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">2FA Ativado com Sucesso!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A partir de agora, você precisará do código do autenticador para fazer login.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleOpen(false)}>
              Concluir
            </Button>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-success" />
              <p className="text-sm">Autenticação de dois fatores está ativa</p>
            </div>

            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Atenção</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Desativar o 2FA tornará sua conta mais vulnerável a acessos não autorizados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleOpen(false)}
              >
                Manter Ativo
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={disable2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  'Desativar 2FA'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
