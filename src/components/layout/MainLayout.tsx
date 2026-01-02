import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { MobileHeader } from "./MobileHeader";
import { BottomNavigation } from "./BottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { PlanBanner } from "@/components/subscription/PlanBanner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Tour */}
      <OnboardingTour />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Mobile Layout */}
      {isMobile && (
        <>
          <MobileHeader />
          <BottomNavigation />
        </>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </div>
      
      {/* Main Content - pl-64 = 256px sidebar width */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Plan Banner */}
        <PlanBanner />
        
        {/* Desktop Top Bar - Hidden on mobile */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 glass border-b border-border/50 items-center justify-between px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <ProfileMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className={`p-4 sm:p-6 animate-fade-in ${isMobile ? "pt-[72px] pb-20" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
