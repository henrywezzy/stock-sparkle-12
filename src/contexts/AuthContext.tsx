import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'almoxarife' | 'visualizador';

interface UserRoleData {
  role: AppRole;
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isApproved: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; emailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string): Promise<UserRoleData | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data ? { role: data.role as AppRole, approved: data.approved ?? false } : null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then((data) => {
              setUserRole(data?.role ?? null);
              setIsApproved(data?.approved ?? false);
            });
          }, 0);
        } else {
          setUserRole(null);
          setIsApproved(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then((data) => {
          setUserRole(data?.role ?? null);
          setIsApproved(data?.approved ?? false);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if user is approved
      if (data.user) {
        const roleData = await fetchUserRole(data.user.id);
        if (roleData && !roleData.approved) {
          await supabase.auth.signOut();
          toast({
            title: "Acesso pendente",
            description: "Seu cadastro ainda não foi aprovado pelo administrador. Aguarde a aprovação.",
            variant: "destructive",
          });
          return { error: new Error("Usuário não aprovado") };
        }
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Stockly.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: Error | null; emailConfirmation?: boolean }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      // Check if email already exists by attempting to sign in first
      // This helps detect if user is already registered when Supabase doesn't return clear error
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está registrado no sistema. Tente fazer login.",
          variant: "destructive",
        });
        return { error: new Error("Email já cadastrado") };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está registrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao cadastrar",
            description: error.message,
            variant: "destructive",
          });
        }
        return { error };
      }

      // Additional check: if user exists but session returned (auto-confirm enabled)
      // This means user might already exist
      if (data.user && data.user.identities?.length === 0) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está registrado. Tente fazer login.",
          variant: "destructive",
        });
        return { error: new Error("Email já cadastrado") };
      }

      // Send notification to admins about new user registration
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'new_user_registration',
            userEmail: email,
            userName: fullName,
          },
        });
        console.log('Admin notification sent successfully');
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Don't fail the signup if notification fails
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = data.user && !data.session;
      
      if (needsEmailConfirmation) {
        toast({
          title: "Verifique seu email",
          description: "Enviamos um link de confirmação. Após confirmar, aguarde a aprovação do administrador.",
        });
        return { error: null, emailConfirmation: true };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Aguarde a aprovação do administrador para acessar o sistema.",
      });

      // Sign out because user needs admin approval
      await supabase.auth.signOut();

      return { error: null, emailConfirmation: false };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setIsApproved(false);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    });
  };

  const canEdit = userRole === 'admin' || userRole === 'almoxarife';
  const canDelete = userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isApproved,
        loading,
        signIn,
        signUp,
        signOut,
        canEdit,
        canDelete,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};