import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Truck,
  ClipboardList,
  Archive,
  History,
  FileBarChart,
  Settings,
  ChevronRight,
  HardHat,
  UserCircle,
  Warehouse,
  LogOut,
  X,
  ShoppingCart,
  FileText,
  MapPin,
  ArrowLeftRight,
  Layers,
  Wrench,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: { title: string; icon: React.ElementType; path: string }[];
}

const allMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Modo Armazém", icon: ScanLine, path: "/armazem" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Kits", icon: Layers, path: "/kits" },
  { title: "Categorias", icon: Tags, path: "/categorias" },
  { title: "Entrada", icon: ArrowDownToLine, path: "/entrada" },
  { title: "Saída", icon: ArrowUpFromLine, path: "/saida" },
  { title: "Compras", icon: ShoppingCart, path: "/compras" },
  {
    title: "Multi-Armazém",
    icon: Warehouse,
    children: [
      { title: "Localizações", icon: MapPin, path: "/localizacoes" },
      { title: "Transferências", icon: ArrowLeftRight, path: "/transferencias" },
    ],
  },
  {
    title: "Gestão de Pessoas",
    icon: Users,
    children: [
      { title: "Funcionários", icon: UserCircle, path: "/funcionarios" },
      { title: "EPIs", icon: HardHat, path: "/epis" },
    ],
  },
  { title: "Ativos", icon: Wrench, path: "/ativos" },
  { title: "Fornecedores", icon: Truck, path: "/fornecedores" },
  { title: "Requisições", icon: ClipboardList, path: "/requisicoes" },
  { title: "Inventário", icon: Archive, path: "/inventario" },
  { title: "Histórico", icon: History, path: "/historico" },
  { title: "Relatórios", icon: FileBarChart, path: "/relatorios" },
  { title: "NF-e", icon: FileText, path: "/nfe" },
  { title: "Configurações", icon: Settings, path: "/configuracoes" },
];

const visualizadorMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Configurações", icon: Settings, path: "/configuracoes" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const { signOut, userRole, user } = useAuth();

  const menuItems = userRole === "visualizador" ? visualizadorMenuItems : allMenuItems;

  // Close menu on route change
  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (children?: MenuItem["children"]) =>
    children?.some((child) => location.pathname === child.path);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-card border-l border-border z-50 animate-slide-in-right flex flex-col safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.title}>
                  {item.children ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </div>
                      <div className="ml-4 pl-4 border-l border-border/50 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all touch-manipulation",
                              isActive(child.path)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground active:bg-muted"
                            )}
                          >
                            <child.icon className="w-4 h-4" />
                            <span className="flex-1">{child.title}</span>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path!}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation",
                        isActive(item.path!)
                          ? "bg-primary/10 text-primary glow-sm"
                          : "text-muted-foreground active:bg-muted"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1">{item.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {user && (
            <div className="glass rounded-lg p-3">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-primary capitalize">
                {userRole || "Carregando..."}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}
