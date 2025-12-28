import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Key, UserCircle } from "lucide-react";
import { ProfileDialog } from "./ProfileDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function ProfileMenu() {
  const { user, userRole, signOut } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "US";
  const userName = user?.email?.split('@')[0] || 'Usuário';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border hover:opacity-80 transition-opacity cursor-pointer outline-none">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[120px]">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole || 'Carregando...'}</p>
            </div>
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
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
        onOpenChange={setProfileDialogOpen} 
      />
      
      <ChangePasswordDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
    </>
  );
}
