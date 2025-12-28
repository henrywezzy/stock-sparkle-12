import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <NotificationPanel />
            <ProfileMenu />
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
