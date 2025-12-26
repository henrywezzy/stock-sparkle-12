import { Bell, Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Clock, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

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
  const { notifications, unreadCount } = useNotifications();

  return (
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
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
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
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
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
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
