import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      
      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 glass border-b border-border/50 flex items-center justify-between px-4 sm:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate max-w-[120px]">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole || 'Carregando...'}</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}