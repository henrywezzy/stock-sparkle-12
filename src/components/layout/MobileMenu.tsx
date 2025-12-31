import { useEffect, useState } from "react";
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
  ChevronDown,
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

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    category: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "Modo Armazém", icon: ScanLine, path: "/armazem" },
    ],
  },
  {
    category: "Estoque",
    items: [
      { title: "Produtos", icon: Package, path: "/produtos" },
      { title: "Kits", icon: Layers, path: "/kits" },
      { title: "Categorias", icon: Tags, path: "/categorias" },
      { title: "Inventário", icon: Archive, path: "/inventario" },
    ],
  },
  {
    category: "Movimentações",
    items: [
      { title: "Entrada", icon: ArrowDownToLine, path: "/entrada" },
      { title: "Saída", icon: ArrowUpFromLine, path: "/saida" },
      { title: "Histórico", icon: History, path: "/historico" },
    ],
  },
  {
    category: "Multi-Armazém",
    items: [
      { title: "Localizações", icon: MapPin, path: "/localizacoes" },
      { title: "Transferências", icon: ArrowLeftRight, path: "/transferencias" },
    ],
  },
  {
    category: "Compras",
    items: [
      { title: "Pedidos", icon: ShoppingCart, path: "/compras" },
      { title: "Fornecedores", icon: Truck, path: "/fornecedores" },
      { title: "Requisições", icon: ClipboardList, path: "/requisicoes" },
    ],
  },
  {
    category: "Gestão de Pessoas",
    items: [
      { title: "Funcionários", icon: UserCircle, path: "/funcionarios" },
      { title: "EPIs", icon: HardHat, path: "/epis" },
    ],
  },
  {
    category: "Outros",
    items: [
      { title: "Ativos", icon: Wrench, path: "/ativos" },
      { title: "Relatórios", icon: FileBarChart, path: "/relatorios" },
      { title: "NF-e", icon: FileText, path: "/nfe" },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
];

const visualizadorCategories: MenuCategory[] = [
  {
    category: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "Produtos", icon: Package, path: "/produtos" },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const { signOut, userRole, user } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const categories = userRole === "visualizador" ? visualizadorCategories : menuCategories;

  // Initialize expanded categories based on current route
  useEffect(() => {
    if (open) {
      const activeCategory = categories.find((cat) =>
        cat.items.some((item) => item.path === location.pathname)
      );
      if (activeCategory && !expandedCategories.includes(activeCategory.category)) {
        setExpandedCategories((prev) => [...prev, activeCategory.category]);
      }
    }
  }, [open, location.pathname]);

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

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease-out" }}
      />

      {/* Menu Panel - Opens from LEFT */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-card z-50 flex flex-col shadow-2xl safe-top safe-bottom"
        style={{ animation: "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Stockly</h2>
              <p className="text-xs text-muted-foreground">Sistema de Almoxarifado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-2">
            {categories.map((category, categoryIndex) => (
              <div 
                key={category.category} 
                className="space-y-1"
                style={{ 
                  animation: `fadeSlideIn 0.3s ease-out ${categoryIndex * 0.05}s both` 
                }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>{category.category}</span>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedCategories.includes(category.category) && "rotate-180"
                    )} 
                  />
                </button>

                {/* Category Items */}
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300",
                    expandedCategories.includes(category.category)
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  )}
                >
                  {category.items.map((item, itemIndex) => (
                    <NavLink
                      key={item.path}
                      to={item.path!}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation group",
                        isActive(item.path!)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98]"
                      )}
                      style={{
                        animationDelay: `${itemIndex * 0.03}s`,
                      }}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          isActive(item.path!)
                            ? "bg-primary-foreground/20"
                            : "bg-muted group-hover:bg-background"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{item.title}</span>
                      <ChevronRight 
                        className={cn(
                          "w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-50 group-hover:translate-x-0",
                          isActive(item.path!) && "opacity-70 translate-x-0"
                        )} 
                      />
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 space-y-3">
          {user && (
            <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-primary capitalize font-medium">
                {userRole || "Carregando..."}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-11"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sair da conta
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { 
            transform: translateX(-100%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeSlideIn {
          from { 
            opacity: 0;
            transform: translateX(-10px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
