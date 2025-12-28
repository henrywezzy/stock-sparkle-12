import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  User, 
  UserCircle, 
  Mail, 
  MapPin, 
  Phone,
  Camera,
  Briefcase,
  Crown,
  Shield,
  Star,
  Heart,
  Zap,
  Coffee,
  Rocket,
  Target,
  Award,
  Flame,
  Gem,
  CircleUser,
  Ghost,
  Bot,
  Smile,
  Cat,
  Dog,
  Bird,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  avatar_url: string;
  selected_icon: string;
}

const availableIcons = [
  { name: 'User', icon: User },
  { name: 'UserCircle', icon: UserCircle },
  { name: 'CircleUser', icon: CircleUser },
  { name: 'Crown', icon: Crown },
  { name: 'Shield', icon: Shield },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Coffee', icon: Coffee },
  { name: 'Rocket', icon: Rocket },
  { name: 'Target', icon: Target },
  { name: 'Award', icon: Award },
  { name: 'Flame', icon: Flame },
  { name: 'Gem', icon: Gem },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Ghost', icon: Ghost },
  { name: 'Bot', icon: Bot },
  { name: 'Smile', icon: Smile },
  { name: 'Cat', icon: Cat },
  { name: 'Dog', icon: Dog },
  { name: 'Bird', icon: Bird },
];

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: '',
    selected_icon: 'User',
  });

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          username: data.username || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          avatar_url: data.avatar_url || '',
          selected_icon: data.selected_icon || 'User',
        });
      } else {
        setProfileData(prev => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          username: profileData.username,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          avatar_url: profileData.avatar_url,
          selected_icon: profileData.selected_icon,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setIsSaving(true);
    try {
      // Check if bucket exists, if not we'll handle the error
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi alterada.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedIcon = () => {
    const iconData = availableIcons.find(i => i.name === profileData.selected_icon);
    return iconData?.icon || User;
  };

  const SelectedIcon = getSelectedIcon();
  const userInitials = profileData.full_name?.substring(0, 2).toUpperCase() || 
                       user?.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Meu Perfil</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e preferências
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4">
            {/* Profile Header */}
            <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30 border border-border/50 mb-6">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-primary/20">
                  <AvatarImage src={profileData.avatar_url} alt={profileData.full_name} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                    {profileData.avatar_url ? userInitials : <SelectedIcon className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-foreground" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{profileData.full_name || 'Usuário'}</h3>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    {userRole}
                  </span>
                  {profileData.username && (
                    <span className="text-xs text-muted-foreground">@{profileData.username}</span>
                  )}
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
                <TabsTrigger value="icon">Ícone do Perfil</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Nome Completo
                    </Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      Nome de Usuário
                    </Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="seu_usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Endereço
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Sua cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={profileData.state}
                        onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip_code">CEP</Label>
                      <Input
                        id="zip_code"
                        value={profileData.zip_code}
                        onChange={(e) => setProfileData(prev => ({ ...prev, zip_code: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="icon" className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha um ícone para representar seu perfil quando não houver foto
                  </p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                  {availableIcons.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setProfileData(prev => ({ ...prev, selected_icon: name }))}
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all hover:scale-105",
                        profileData.selected_icon === name
                          ? "border-primary bg-primary/10 text-primary shadow-lg"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Preview</p>
                    <Avatar className="w-16 h-16 border-4 border-primary/20">
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        <SelectedIcon className="w-7 h-7" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
