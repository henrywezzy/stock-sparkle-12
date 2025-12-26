import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  Users,
  Shield,
  Palette,
  Database,
  Save,
  Loader2,
  Crown,
  UserCog,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationSettings {
  id: string;
  user_id: string;
  email_low_stock: boolean;
  email_epi_expiring: boolean;
  email_new_requisition: boolean;
  low_stock_threshold: number;
  epi_expiry_days: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({
    email_low_stock: true,
    email_epi_expiring: true,
    email_new_requisition: true,
    low_stock_threshold: 10,
    epi_expiry_days: 30,
  });

  // Fetch notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!user,
  });

  // Fetch users with roles (admin only)
  const { data: usersWithRoles = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      return profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        role: roles.find(r => r.user_id === profile.user_id)?.role || 'visualizador',
      })) as UserWithRole[];
    },
    enabled: isAdmin,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Save notification settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...localSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({ title: "Configurações salvas!", description: "Suas alterações foram salvas com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  // Update user role (admin only)
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "almoxarife" | "visualizador" }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: "Permissão atualizada", description: "A permissão do usuário foi alterada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-primary/20 text-primary",
      almoxarife: "bg-success/20 text-success",
      visualizador: "bg-muted text-muted-foreground",
    };
    const labels = {
      admin: "Administrador",
      almoxarife: "Almoxarife",
      visualizador: "Visualizador",
    };
    return (
      <Badge className={styles[role as keyof typeof styles] || styles.visualizador}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-primary" />;
      case 'almoxarife': return <UserCog className="w-4 h-4 text-success" />;
      default: return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Configurações"
        description="Configure as preferências do sistema"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Configurações" }]}
      />

      <Tabs defaultValue="notifications" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1 w-full sm:w-auto">
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2 text-xs sm:text-sm">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Estoque</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="gap-2 text-xs sm:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações de Alertas</h3>
                <p className="text-sm text-muted-foreground">Gerencie as notificações do sistema</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex-1 mr-4">
                  <p className="font-medium text-sm sm:text-base">Alerta de Estoque Baixo</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notificar quando o estoque atingir o mínimo</p>
                </div>
                <Switch
                  checked={localSettings.email_low_stock}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_low_stock: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex-1 mr-4">
                  <p className="font-medium text-sm sm:text-base">Alerta de EPIs Vencendo</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notificar 30, 15 e 7 dias antes</p>
                </div>
                <Switch
                  checked={localSettings.email_epi_expiring}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_epi_expiring: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex-1 mr-4">
                  <p className="font-medium text-sm sm:text-base">Novas Requisições</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notificar sobre novas solicitações</p>
                </div>
                <Switch
                  checked={localSettings.email_new_requisition}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_new_requisition: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4 sm:space-y-6">
          <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações de Estoque</h3>
                <p className="text-sm text-muted-foreground">Configure as regras do almoxarifado</p>
              </div>
            </div>

            <div className="grid gap-4 max-w-xl">
              <div className="grid gap-2">
                <Label>Limite para Alerta de Estoque Baixo</Label>
                <Input
                  type="number"
                  value={localSettings.low_stock_threshold || 10}
                  onChange={(e) => setLocalSettings({ ...localSettings, low_stock_threshold: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Alertar quando o estoque estiver abaixo desta quantidade
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Dias para Alerta de EPI</Label>
                <Input
                  type="number"
                  value={localSettings.epi_expiry_days || 30}
                  onChange={(e) => setLocalSettings({ ...localSettings, epi_expiry_days: parseInt(e.target.value) || 30 })}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Alertar quando faltarem X dias para o EPI vencer
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Usuários e Permissões</h3>
                  <p className="text-sm text-muted-foreground">Gerencie os acessos ao sistema</p>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {usersWithRoles.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/50 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(userItem.role)}
                        <div>
                          <p className="font-medium text-sm sm:text-base">{userItem.full_name || 'Sem nome'}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {userItem.id === user?.id ? (
                          <Badge variant="outline">Você</Badge>
                        ) : (
                          <Select
                            value={userItem.role}
                            onValueChange={(newRole: "admin" | "almoxarife" | "visualizador") => updateUserRole.mutate({ userId: userItem.id, newRole })}
                          >
                            <SelectTrigger className="w-[140px] sm:w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="almoxarife">Almoxarife</SelectItem>
                              <SelectItem value="visualizador">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {getRoleBadge(userItem.role)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Níveis de Acesso</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li><strong>Administrador:</strong> Acesso total, pode gerenciar usuários e excluir dados</li>
                  <li><strong>Almoxarife:</strong> Pode adicionar e editar produtos, entradas, saídas e funcionários</li>
                  <li><strong>Visualizador:</strong> Apenas visualização dos dados</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="appearance" className="space-y-4 sm:space-y-6">
          <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Personalização</h3>
                <p className="text-sm text-muted-foreground">Customize a aparência do sistema</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="grid gap-2">
                <Label>Tema</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  O sistema usa o tema escuro por padrão para melhor visualização em ambientes industriais.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={() => saveSettings.mutate()}
          className="gradient-primary text-primary-foreground glow-sm w-full sm:w-auto"
          disabled={saveSettings.isPending}
        >
          {saveSettings.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
