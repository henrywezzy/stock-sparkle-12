import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  HardHat,
  UserCircle,
  Warehouse,
  LogOut,
  X,
  ShoppingCart,
  FileText,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    category: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    category: "Estoque",
    items: [
      { title: "Produtos", icon: Package, path: "/produtos" },
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
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Produtos", icon: Package, path: "/produtos" },
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Principal", "Estoque", "Movimentações"]);
  const location = useLocation();
  const { signOut, userRole, user } = useAuth();

  const categories = userRole === "visualizador" ? visualizadorCategories : menuCategories;

  // Auto-expand category containing active route
  useEffect(() => {
    const activeCategory = categories.find((cat) =>
      cat.items.some((item) => item.path === location.pathname)
    );
    if (activeCategory && !expandedCategories.includes(activeCategory.category)) {
      setExpandedCategories((prev) => [...prev, activeCategory.category]);
    }
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          // Desktop
          "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-64",
          // Mobile - show when open
          mobileOpen && "flex w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-sm">
                <Warehouse className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Stockly</h1>
                <p className="text-xs text-muted-foreground">Gestão de Almoxarifado</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={mobileOpen ? onMobileClose : () => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : collapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="py-3 px-2">
            {categories.map((category) => (
              <div key={category.category} className="mb-2">
                {/* Category Header */}
                {(!collapsed || mobileOpen) ? (
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
                ) : (
                  <div className="h-px bg-sidebar-border my-2" />
                )}

                {/* Category Items */}
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300",
                    (!collapsed || mobileOpen)
                      ? expandedCategories.includes(category.category)
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                      : "max-h-[500px] opacity-100"
                  )}
                >
                  {category.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                        isActive(item.path)
                          ? "bg-primary/10 text-primary glow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {collapsed && !mobileOpen ? (
                        <item.icon className="w-5 h-5 mx-auto" />
                      ) : (
                        <>
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              isActive(item.path)
                                ? "bg-primary/20"
                                : "bg-sidebar-accent group-hover:bg-sidebar-border"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="flex-1">{item.title}</span>
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-50 group-hover:translate-x-0",
                              isActive(item.path) && "opacity-70 translate-x-0"
                            )}
                          />
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {(!collapsed || mobileOpen) && user && (
            <div className="glass rounded-lg p-3">
              <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
              <p className="text-xs text-primary capitalize">{userRole || 'Carregando...'}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed && !mobileOpen ? "icon" : "default"}
            onClick={signOut}
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            {(!collapsed || mobileOpen) && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}