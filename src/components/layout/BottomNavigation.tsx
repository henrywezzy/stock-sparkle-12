import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Entrada", icon: ArrowDownToLine, path: "/entrada" },
  { title: "Saída", icon: ArrowUpFromLine, path: "/saida" },
];

export function BottomNavigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Safe area for iOS devices */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 touch-manipulation",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary/80"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive(item.path) && "bg-primary/10 glow-sm"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive(item.path) && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive(item.path) && "text-primary"
              )}>
                {item.title}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
