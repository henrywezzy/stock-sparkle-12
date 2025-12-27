import { useState, useEffect, useRef } from "react";
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
  Upload,
  Sun,
  Moon,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
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
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useTheme, ColorPalette } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  approved: boolean;
}

const COLOR_PALETTES: { id: ColorPalette; name: string; primary: string }[] = [
  { id: "cyan", name: "Ciano", primary: "hsl(199, 89%, 48%)" },
  { id: "violet", name: "Violeta", primary: "hsl(270, 76%, 60%)" },
  { id: "emerald", name: "Esmeralda", primary: "hsl(160, 84%, 39%)" },
  { id: "rose", name: "Rosa", primary: "hsl(350, 89%, 60%)" },
  { id: "amber", name: "Âmbar", primary: "hsl(38, 92%, 50%)" },
  { id: "blue", name: "Azul", primary: "hsl(217, 91%, 60%)" },
];

export default function Settings() {
  const { user, isAdmin, userRole } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings: companySettings, updateSettings: updateCompanySettings, uploadLogo, isLoading: companyLoading } = useCompanySettings();
  const { theme, setMode, setPalette, isDark } = useTheme();
  
  const isViewer = userRole === 'visualizador';
  const canEditCompany = isAdmin || userRole === 'almoxarife';

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({
    email_low_stock: true,
    email_epi_expiring: true,
    email_new_requisition: true,
    low_stock_threshold: 10,
    epi_expiry_days: 30,
  });

  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (companySettings) {
      setCompanyForm({
        name: companySettings.name || "",
        cnpj: companySettings.cnpj || "",
        address: companySettings.address || "",
        city: companySettings.city || "",
        state: companySettings.state || "",
        zip_code: companySettings.zip_code || "",
        phone: companySettings.phone || "",
        email: companySettings.email || "",
      });
    }
  }, [companySettings]);

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

  const { data: usersWithRoles = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, approved');
      if (rolesError) throw rolesError;
      return profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name,
          role: userRole?.role || 'visualizador',
          approved: userRole?.approved ?? false,
        };
      }) as UserWithRole[];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('notification_settings')
        .upsert({ user_id: user.id, ...localSettings, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "almoxarife" | "visualizador" }) => {
      const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: "Permissão atualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      // Get user info before approving
      const userToApprove = usersWithRoles.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('user_roles')
        .update({ approved: true })
        .eq('user_id', userId);
      if (error) throw error;

      // Send approval email to user
      if (userToApprove?.email) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'user_approved',
              userEmail: userToApprove.email,
              userName: userToApprove.full_name,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send approval notification:', notifyError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      refetchUsers();
      toast({ title: "Usuário aprovado", description: "O usuário agora pode acessar o sistema." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao aprovar usuário", description: error.message, variant: "destructive" });
    },
  });

  const revokeApproval = useMutation({
    mutationFn: async (userId: string) => {
      // Get user info before revoking
      const userToRevoke = usersWithRoles.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('user_roles')
        .update({ approved: false })
        .eq('user_id', userId);
      if (error) throw error;

      // Send rejection email to user
      if (userToRevoke?.email) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'user_rejected',
              userEmail: userToRevoke.email,
              userName: userToRevoke.full_name,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send rejection notification:', notifyError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      refetchUsers();
      toast({ title: "Acesso revogado", description: "O usuário não pode mais acessar o sistema." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao revogar acesso", description: error.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user role first (this also removes their access)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (roleError) throw roleError;

      // Delete notification settings
      await supabase
        .from('notification_settings')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      refetchUsers();
      toast({ title: "Usuário removido", description: "Os dados do usuário foram removidos do sistema." });
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
      setDeleteUserId(null);
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteUserId(userId);
    setDeleteUserName(userName);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const logoUrl = await uploadLogo(file);
    if (logoUrl) {
      updateCompanySettings.mutate({ logo_url: logoUrl });
    }
  };

  const handleSaveCompany = () => {
    updateCompanySettings.mutate(companyForm);
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-primary/20 text-primary",
      almoxarife: "bg-success/20 text-success",
      visualizador: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = { admin: "Administrador", almoxarife: "Almoxarife", visualizador: "Visualizador" };
    return <Badge className={styles[role] || styles.visualizador}>{labels[role] || role}</Badge>;
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

      <Tabs defaultValue="company" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1 w-full sm:w-auto">
          <TabsTrigger value="company" className="gap-2 text-xs sm:text-sm">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          {!isViewer && (
            <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
          )}
          {!isViewer && (
            <TabsTrigger value="stock" className="gap-2 text-xs sm:text-sm">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
          )}
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

        <TabsContent value="company" className="space-y-4 sm:space-y-6">
          <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Dados da Empresa</h3>
                <p className="text-sm text-muted-foreground">
                  {isViewer ? "Visualize as informações da empresa" : "Informações que aparecerão nos documentos"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {companySettings?.logo_url ? (
                    <img src={companySettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {canEditCompany && (
                  <>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" /> Enviar Logo
                    </Button>
                  </>
                )}
              </div>

              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nome da Empresa</Label>
                  <Input 
                    value={companyForm.name} 
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} 
                    disabled={isViewer}
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input 
                    value={companyForm.cnpj} 
                    onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })} 
                    placeholder="00.000.000/0001-00" 
                    disabled={isViewer}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input 
                    value={companyForm.phone} 
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} 
                    placeholder="(00) 0000-0000" 
                    disabled={isViewer}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={companyForm.email} 
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} 
                    disabled={isViewer}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={companyForm.address} 
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} 
                    disabled={isViewer}
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input 
                    value={companyForm.city} 
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} 
                    disabled={isViewer}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Estado</Label>
                    <Input 
                      value={companyForm.state} 
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })} 
                      maxLength={2} 
                      disabled={isViewer}
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input 
                      value={companyForm.zip_code} 
                      onChange={(e) => setCompanyForm({ ...companyForm, zip_code: e.target.value })} 
                      disabled={isViewer}
                    />
                  </div>
                </div>
              </div>
            </div>

            {canEditCompany && (
              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button onClick={handleSaveCompany} className="gradient-primary" disabled={updateCompanySettings.isPending}>
                  {updateCompanySettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Empresa
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {!isViewer && (
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
                  <p className="font-medium">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">Notificar quando o estoque atingir o mínimo</p>
                </div>
                <Switch checked={localSettings.email_low_stock} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_low_stock: checked })} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex-1 mr-4">
                  <p className="font-medium">Alerta de EPIs Vencendo</p>
                  <p className="text-sm text-muted-foreground">Notificar 30, 15 e 7 dias antes</p>
                </div>
                <Switch checked={localSettings.email_epi_expiring} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_epi_expiring: checked })} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex-1 mr-4">
                  <p className="font-medium">Novas Requisições</p>
                  <p className="text-sm text-muted-foreground">Notificar sobre novas solicitações</p>
                </div>
                <Switch checked={localSettings.email_new_requisition} onCheckedChange={(checked) => setLocalSettings({ ...localSettings, email_new_requisition: checked })} />
              </div>
            </div>
          </div>
        </TabsContent>
        )}

        {!isViewer && (
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
                <Input type="number" value={localSettings.low_stock_threshold || 10} onChange={(e) => setLocalSettings({ ...localSettings, low_stock_threshold: parseInt(e.target.value) || 10 })} />
                <p className="text-sm text-muted-foreground">Alertar quando o estoque estiver abaixo desta quantidade</p>
              </div>
              <div className="grid gap-2">
                <Label>Dias para Alerta de EPI</Label>
                <Input type="number" value={localSettings.epi_expiry_days || 30} onChange={(e) => setLocalSettings({ ...localSettings, epi_expiry_days: parseInt(e.target.value) || 30 })} />
                <p className="text-sm text-muted-foreground">Alertar quando faltarem X dias para o EPI vencer</p>
              </div>
            </div>
          </div>
        </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Usuários e Permissões</h3>
                  <p className="text-sm text-muted-foreground">Gerencie os acessos e aprovações ao sistema</p>
                </div>
              </div>

              {/* Pending Approvals Section */}
              {usersWithRoles.filter(u => !u.approved && u.id !== user?.id).length > 0 && (
                <div className="border border-warning/50 bg-warning/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <h4 className="font-medium text-warning">Aprovações Pendentes</h4>
                  </div>
                  <div className="space-y-2">
                    {usersWithRoles.filter(u => !u.approved && u.id !== user?.id).map((userItem) => (
                      <div key={userItem.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background/50 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                            <UserX className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">{userItem.full_name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{userItem.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success border-success hover:bg-success/10"
                            onClick={() => approveUser.mutate(userItem.id)}
                            disabled={approveUser.isPending}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(userItem.id, userItem.full_name || userItem.email)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usersLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Usuários Ativos</h4>
                  {usersWithRoles.filter(u => u.approved || u.id === user?.id).map((userItem) => (
                    <div key={userItem.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/50 gap-3">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(userItem.role)}
                        <div>
                          <p className="font-medium">{userItem.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {userItem.id === user?.id ? (
                          <Badge variant="outline">Você</Badge>
                        ) : (
                          <>
                            <Select value={userItem.role} onValueChange={(newRole: "admin" | "almoxarife" | "visualizador") => updateUserRole.mutate({ userId: userItem.id, newRole })}>
                              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="almoxarife">Almoxarife</SelectItem>
                                <SelectItem value="visualizador">Visualizador</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10"
                              onClick={() => revokeApproval.mutate(userItem.id)}
                              title="Revogar acesso"
                              disabled={revokeApproval.isPending}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(userItem.id, userItem.full_name || userItem.email)}
                              title="Remover usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {getRoleBadge(userItem.role)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

            <div className="space-y-6 max-w-xl">
              <div className="space-y-3">
                <Label>Modo de Exibição</Label>
                <div className="flex gap-3">
                  <Button variant={isDark ? "default" : "outline"} onClick={() => setMode("dark")} className="flex-1">
                    <Moon className="w-4 h-4 mr-2" /> Escuro
                  </Button>
                  <Button variant={!isDark ? "default" : "outline"} onClick={() => setMode("light")} className="flex-1">
                    <Sun className="w-4 h-4 mr-2" /> Claro
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Paleta de Cores</Label>
                <div className="grid grid-cols-3 gap-3">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => setPalette(palette.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                        theme.palette === palette.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.primary }} />
                      <span className="text-xs font-medium">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => saveSettings.mutate()} className="gradient-primary text-primary-foreground glow-sm w-full sm:w-auto" disabled={saveSettings.isPending}>
          {saveSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remover Usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o acesso de <strong>{deleteUserName}</strong>?
              Esta ação irá revogar todas as permissões do usuário no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserId && deleteUser.mutate(deleteUserId)}
            >
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
