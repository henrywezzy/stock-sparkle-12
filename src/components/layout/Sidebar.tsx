import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Produtos", icon: Package, path: "/produtos" },
  { title: "Categorias", icon: Tags, path: "/categorias" },
  { title: "Entrada", icon: ArrowDownToLine, path: "/entrada" },
  { title: "Saída", icon: ArrowUpFromLine, path: "/saida" },
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["Gestão de Pessoas"]);
  const location = useLocation();

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
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-sm">
              <Warehouse className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Almoxarifado</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
                      {!collapsed && (
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
                  {!collapsed && (
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
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
            <p className="text-xs text-muted-foreground">© 2024 Almoxarifado</p>
          </div>
        </div>
      )}
    </aside>
  );
}
