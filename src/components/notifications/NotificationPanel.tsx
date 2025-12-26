import { useState } from "react";
import { Bell, Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Clock, UserPlus, Info, Trash2, CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'entry':
      return <ArrowDownToLine className="w-4 h-4 text-success" />;
    case 'exit':
      return <ArrowUpFromLine className="w-4 h-4 text-destructive" />;
    case 'low_stock':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'expiry':
      return <Clock className="w-4 h-4 text-destructive" />;
    case 'employee':
      return <UserPlus className="w-4 h-4 text-primary" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'entry':
      return 'bg-success/10';
    case 'exit':
      return 'bg-destructive/10';
    case 'low_stock':
      return 'bg-warning/10';
    case 'expiry':
      return 'bg-destructive/10';
    case 'employee':
      return 'bg-primary/10';
    default:
      return 'bg-muted';
  }
};

export function NotificationPanel() {
  const { notifications, unreadCount, dismissNotification, dismissAllNotifications, dismissSelectedNotifications } = useNotifications();
  const { toast } = useToast();
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.size === 0) return;
    dismissSelectedNotifications(Array.from(selectedNotifications));
    toast({
      title: "Notificações removidas",
      description: `${selectedNotifications.size} notificação(ões) removida(s).`,
    });
    setSelectedNotifications(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteAll = () => {
    dismissAllNotifications();
    toast({
      title: "Todas as notificações removidas",
      description: "Todas as notificações foram removidas com sucesso.",
    });
    setDeleteAllDialogOpen(false);
    setIsSelectionMode(false);
    setSelectedNotifications(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedNotifications(new Set());
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96 p-0 glass border-border" align="end">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Notificações</h3>
              {notifications.length > 0 && (
                <div className="flex items-center gap-1">
                  {isSelectionMode ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={selectAll}
                        title={selectedNotifications.size === notifications.length ? "Desmarcar todas" : "Selecionar todas"}
                      >
                        {selectedNotifications.size === notifications.length ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={handleDeleteSelected}
                        disabled={selectedNotifications.size === 0}
                        title="Excluir selecionadas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={exitSelectionMode}
                        title="Cancelar seleção"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setIsSelectionMode(true)}
                      >
                        Selecionar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteAllDialogOpen(true)}
                        title="Apagar todas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            {unreadCount > 0 && !isSelectionMode && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
            {isSelectionMode && (
              <span className="text-xs text-primary">
                {selectedNotifications.size} selecionada{selectedNotifications.size !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-secondary/50 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/5",
                      isSelectionMode && selectedNotifications.has(notification.id) && "bg-primary/10"
                    )}
                    onClick={() => isSelectionMode && toggleSelection(notification.id)}
                  >
                    <div className="flex gap-3">
                      {isSelectionMode && (
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedNotifications.has(notification.id)}
                            onCheckedChange={() => toggleSelection(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Apagar todas as notificações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover todas as {notifications.length} notificações. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              Apagar Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
