import { useState } from "react";
import { Menu, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { MobileMenu } from "./MobileMenu";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-card/95 backdrop-blur-xl border-b border-border/50 safe-top">
          <div className="flex items-center justify-between h-14 px-3">
            {/* Left: Hamburger + User + App Name */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="text-muted-foreground hover:text-foreground h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <ProfileMenu />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground text-sm">
                  Stockly
                </span>
              </div>
            </div>

            {/* Right: Notifications */}
            <div className="flex items-center">
              <NotificationPanel />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
