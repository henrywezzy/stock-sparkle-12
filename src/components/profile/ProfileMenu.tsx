import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  LogOut, 
  Key, 
  UserCircle,
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
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { ProfileDialog } from "./ProfileDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface ProfileData {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  selected_icon: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  'User': User,
  'UserCircle': UserCircle,
  'CircleUser': CircleUser,
  'Crown': Crown,
  'Shield': Shield,
  'Star': Star,
  'Heart': Heart,
  'Zap': Zap,
  'Coffee': Coffee,
  'Rocket': Rocket,
  'Target': Target,
  'Award': Award,
  'Flame': Flame,
  'Gem': Gem,
  'Briefcase': Briefcase,
  'Ghost': Ghost,
  'Bot': Bot,
  'Smile': Smile,
  'Cat': Cat,
  'Dog': Dog,
  'Bird': Bird,
};

export function ProfileMenu() {
  const { user, userRole, signOut } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, selected_icon')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  // Refresh profile data when dialog closes
  const handleProfileDialogChange = (open: boolean) => {
    setProfileDialogOpen(open);
    if (!open) {
      fetchProfileData();
    }
  };

  const displayName = profileData?.username || profileData?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = (profileData?.full_name?.substring(0, 2) || user?.email?.substring(0, 2) || 'US').toUpperCase();
  
  const SelectedIcon = iconMap[profileData?.selected_icon || 'User'] || User;
  const hasAvatar = !!profileData?.avatar_url;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border hover:opacity-80 transition-opacity cursor-pointer outline-none">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[120px]">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole || 'Carregando...'}</p>
            </div>
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
              <AvatarImage src={profileData?.avatar_url || ''} alt={displayName} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-medium">
                {hasAvatar ? userInitials : <SelectedIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              <p className="text-xs leading-none text-primary capitalize mt-1">{userRole}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setProfileDialogOpen(true)}
            className="cursor-pointer"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setPasswordDialogOpen(true)}
            className="cursor-pointer"
          >
            <Key className="mr-2 h-4 w-4" />
            <span>Alterar Senha</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={signOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={handleProfileDialogChange} 
      />
      
      <ChangePasswordDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
    </>
  );
}
