import { useState } from "react";
import { Menu, Warehouse, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { MobileMenu } from "./MobileMenu";
import { useCompanySettings } from "@/hooks/useCompanySettings";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useCompanySettings();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-card/95 backdrop-blur-xl border-b border-border/50 safe-top">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.name || "Logo"} 
                  className="h-8 w-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Warehouse className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <span className="font-bold text-foreground text-sm">
                {settings?.name || "Stockly"}
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <NotificationPanel />
              <ProfileMenu />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="text-muted-foreground hover:text-foreground h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
