import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds or on second visit
      const hasSeenPrompt = localStorage.getItem("pwa-prompt-seen");
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem("pwa-prompt-seen", "true");
        }, 30000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Show iOS prompt on second visit
    if (isIOSDevice && !isInStandaloneMode) {
      const visitCount = parseInt(localStorage.getItem("visit-count") || "0") + 1;
      localStorage.setItem("visit-count", visitCount.toString());
      
      if (visitCount >= 2 && !localStorage.getItem("pwa-ios-dismissed")) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        console.log("PWA installed");
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Install error:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem("pwa-ios-dismissed", "true");
    }
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-50"
        >
          <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">Instalar Stockly</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1 -mr-1 shrink-0"
                      onClick={handleDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {isIOS 
                      ? "Adicione à tela inicial para acesso rápido e experiência de app nativo."
                      : "Instale o app para acesso offline e notificações."
                    }
                  </p>
                  
                  {isIOS ? (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Toque em</span>
                        <Share className="h-4 w-4" />
                        <span>e depois em</span>
                        <span className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Adicionar à Tela
                        </span>
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="mt-3 w-full gap-2"
                      onClick={handleInstall}
                    >
                      <Download className="h-4 w-4" />
                      Instalar App
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
