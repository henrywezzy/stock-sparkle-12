import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Loader2, Eye, EyeOff, Check, X, Mail, KeyRound, ArrowLeft, User, Phone } from 'lucide-react';
import { z } from 'zod';
import { usePasswordValidation, getStrengthColor, getStrengthLabel, validatePassword } from '@/hooks/usePasswordValidation';

// Validação de email mais rigorosa
const emailSchema = z.string()
  .min(1, 'Email é obrigatório')
  .email('Formato de email inválido')
  .refine((email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, 'Email inválido');

// Validação de senha usando o hook
const createPasswordSchema = () => z.string()
  .refine((password) => validatePassword(password).isValid, {
    message: 'A senha não atende aos requisitos mínimos de segurança'
  });

const signUpSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: emailSchema,
  password: createPasswordSchema(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

const resetPasswordSchema = z.object({
  password: createPasswordSchema(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Componente de indicador de força de senha com barra de progresso
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const validation = usePasswordValidation(password);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Força da senha:</span>
          <span className={`text-xs font-medium ${
            validation.strength === 'very-strong' ? 'text-success' :
            validation.strength === 'strong' ? 'text-success/80' :
            validation.strength === 'medium' ? 'text-warning' : 'text-destructive'
          }`}>
            {getStrengthLabel(validation.strength)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{ width: `${validation.strengthPercent}%` }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="grid grid-cols-2 gap-1">
        {validation.checks.map((check) => (
          <div key={check.id} className="flex items-center gap-1.5 text-xs">
            {check.valid ? (
              <Check className="w-3 h-3 text-success shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.valid ? 'text-success' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

type AuthView = 'login' | 'forgot-password' | 'reset-password';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading, resetPasswordForEmail, updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPasswordData, setNewPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Check if coming from password reset link
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    if (isReset) {
      setCurrentView('reset-password');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading && currentView !== 'reset-password') {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, currentView]);

  const resolveEmailFromIdentifier = async (identifier: string): Promise<string | null> => {
    // Check if it's already an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
    if (isEmail) {
      return identifier.trim().toLowerCase();
    }

    // Try to find email by username or phone
    try {
      const { data, error } = await supabase.functions.invoke('find-user-email', {
        body: { identifier: identifier.trim() }
      });

      if (error || !data?.email) {
        return null;
      }

      return data.email;
    } catch {
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!loginData.identifier.trim()) {
      setErrors({ identifier: 'Digite seu email, usuário ou telefone' });
      return;
    }

    if (!loginData.password) {
      setErrors({ password: 'Digite sua senha' });
      return;
    }

    setIsLoading(true);

    // Resolve identifier to email
    const email = await resolveEmailFromIdentifier(loginData.identifier);
    
    if (!email) {
      setErrors({ identifier: 'Usuário não encontrado' });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, loginData.password);
    setIsLoading(false);

    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      signUpSchema.parse(signUpData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
    setIsLoading(false);

    if (!error) {
      setEmailConfirmationSent(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      emailSchema.parse(forgotPasswordEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0].message });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(forgotPasswordEmail);
    setIsLoading(false);

    if (!error) {
      setResetEmailSent(true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      resetPasswordSchema.parse(newPasswordData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPasswordData.password);
    setIsLoading(false);

    if (!error) {
      setPasswordResetSuccess(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password reset success screen
  if (passwordResetSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Senha alterada com sucesso!</h2>
            <p className="text-muted-foreground mb-6">
              Sua senha foi redefinida. Agora você pode fazer login com a nova senha.
            </p>
            <Button 
              className="w-full"
              onClick={() => {
                setPasswordResetSuccess(false);
                setCurrentView('login');
                setNewPasswordData({ password: '', confirmPassword: '' });
                navigate('/auth');
              }}
            >
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form (after clicking email link)
  if (currentView === 'reset-password') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Stockly</h1>
              <p className="text-sm text-muted-foreground">Gestão de Almoxarifado</p>
            </div>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Nova Senha</CardTitle>
              <CardDescription>
                Digite sua nova senha abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPasswordData.password}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
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
                  <PasswordStrengthIndicator password={newPasswordData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPasswordData.confirmPassword}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email sent for password reset confirmation
  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Verifique seu email</h2>
            <p className="text-muted-foreground mb-4">
              Enviamos um link de redefinição de senha para <strong>{forgotPasswordEmail}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Clique no link do email para criar uma nova senha. O link expira em 1 hora.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setResetEmailSent(false);
                setForgotPasswordEmail('');
                setCurrentView('login');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (currentView === 'forgot-password') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Stockly</h1>
              <p className="text-sm text-muted-foreground">Gestão de Almoxarifado</p>
            </div>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Esqueceu sua senha?</CardTitle>
              <CardDescription>
                Digite seu email para receber um link de redefinição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de redefinição'
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setCurrentView('login');
                    setForgotPasswordEmail('');
                    setErrors({});
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (emailConfirmationSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Cadastro realizado!</h2>
            <p className="text-muted-foreground mb-4">
              Enviamos um link de confirmação para <strong>{signUpData.email}</strong>. 
              Clique no link para verificar sua conta.
            </p>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-warning font-medium">
                Após confirmar seu email, seu acesso ainda precisará ser aprovado por um administrador.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Você receberá uma notificação quando seu acesso for liberado.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setEmailConfirmationSent(false);
                setSignUpData({ fullName: '', email: '', password: '', confirmPassword: '' });
              }}
            >
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stockly</h1>
            <p className="text-sm text-muted-foreground">Gestão de Almoxarifado</p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier" className="flex items-center gap-2">
                      Email, Usuário ou Telefone
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-identifier"
                        type="text"
                        placeholder="email, @usuario ou telefone"
                        value={loginData.identifier}
                        onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        className={errors.identifier ? 'border-destructive pl-10' : 'pl-10'}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    {errors.identifier && (
                      <p className="text-sm text-destructive">{errors.identifier}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use seu email, nome de usuário ou telefone cadastrado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('forgot-password');
                      setErrors({});
                    }}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
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
                    <PasswordStrengthIndicator password={signUpData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Após o cadastro, você receberá um email de confirmação.
                    Novos usuários precisam de aprovação do administrador.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
