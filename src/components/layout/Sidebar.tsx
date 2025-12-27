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
  Menu,
  HardHat,
  UserCircle,
  Warehouse,
  LogOut,
  X,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: { title: string; icon: React.ElementType; path: string }[];
}

const allMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Categorias", icon: Tags, path: "/categorias" },
  { title: "Entrada", icon: ArrowDownToLine, path: "/entrada" },
  { title: "Saída", icon: ArrowUpFromLine, path: "/saida" },
  { title: "Compras", icon: ShoppingCart, path: "/compras" },
  {
    title: "Gestão de Pessoas",
    icon: Users,
    children: [
      { title: "Funcionários", icon: UserCircle, path: "/funcionarios" },
      { title: "EPIs", icon: HardHat, path: "/epis" },
    ],
  },
  { title: "Fornecedores", icon: Truck, path: "/fornecedores" },
  { title: "Requisições", icon: ClipboardList, path: "/requisicoes" },
  { title: "Inventário", icon: Archive, path: "/inventario" },
  { title: "Histórico", icon: History, path: "/historico" },
  { title: "Relatórios", icon: FileBarChart, path: "/relatorios" },
  { title: "Configurações", icon: Settings, path: "/configuracoes" },
];

// Menu items for visualizador role (limited access)
const visualizadorMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Configurações", icon: Settings, path: "/configuracoes" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["Gestão de Pessoas"]);
  const location = useLocation();
  const { signOut, userRole, user } = useAuth();

  // Select menu items based on user role
  const menuItems = userRole === 'visualizador' ? visualizadorMenuItems : allMenuItems;

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (children?: MenuItem["children"]) =>
    children?.some((child) => location.pathname === child.path);

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
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.title}>
                {item.children ? (
                  <Collapsible
                    open={openMenus.includes(item.title)}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          isChildActive(item.children)
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {(!collapsed || mobileOpen) && (
                          <>
                            <span className="flex-1 text-left">{item.title}</span>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 transition-transform",
                                openMenus.includes(item.title) && "rotate-180"
                              )}
                            />
                          </>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    {(!collapsed || mobileOpen) && (
                      <CollapsibleContent className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                              isActive(child.path)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.title}</span>
                          </NavLink>
                        ))}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <NavLink
                    to={item.path!}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive(item.path!)
                        ? "bg-primary/10 text-primary glow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {(!collapsed || mobileOpen) && <span>{item.title}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

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