import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse"></div>
          <Loader2 className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <Loader2 className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold gradient-text">Stockly</h2>
          <p className="text-sm text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    </div>
  );
}