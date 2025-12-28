import { useMemo, useState, useCallback, useEffect } from 'react';
import { useProducts } from './useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Notification {
  id: string;
  type: 'entry' | 'exit' | 'low_stock' | 'expiry' | 'employee' | 'info';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const STORAGE_KEY = 'dismissedNotifications';

export const useNotifications = () => {
  const { products } = useProducts();
  const { isViewer } = useAuth();
  
  // Estado para armazenar IDs de notificações descartadas
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar do localStorage após montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDismissedIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Error loading dismissed notifications:', e);
    }
    setIsInitialized(true);
  }, []);

  const saveDismissedIds = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error saving dismissed notifications:', e);
    }
    setDismissedIds(ids);
  }, []);

  const allNotifications = useMemo(() => {
    const notifications: Notification[] = [];

    // Para visualizador, mostrar apenas produtos com estoque zerado (sem detalhes de valor)
    // e produtos próximos ao vencimento
    if (isViewer) {
      // Apenas produtos sem estoque (crítico) - sem mostrar valores
      products
        .filter((p) => p.quantity === 0)
        .forEach((product) => {
          notifications.push({
            id: `low-stock-${product.id}`,
            type: 'low_stock',
            title: 'Produto Sem Estoque',
            description: `${product.name} está sem unidades disponíveis`,
            time: formatDistanceToNow(new Date(product.updated_at), { addSuffix: true, locale: ptBR }),
            read: false,
          });
        });

      // Produtos vencidos ou próximos do vencimento
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      products
        .filter((p) => p.expiry_date && new Date(p.expiry_date) <= thirtyDaysFromNow)
        .forEach((product) => {
          const expiryDate = new Date(product.expiry_date!);
          const isExpired = expiryDate < today;
          
          notifications.push({
            id: `expiry-${product.id}`,
            type: 'expiry',
            title: isExpired ? 'Produto Vencido' : 'Vencimento Próximo',
            description: `${product.name} ${isExpired ? 'venceu' : 'vence'} em ${expiryDate.toLocaleDateString('pt-BR')}`,
            time: formatDistanceToNow(expiryDate, { addSuffix: true, locale: ptBR }),
            read: false,
          });
        });

      return notifications.sort((a, b) => {
        if (a.type === 'low_stock' && b.type !== 'low_stock') return -1;
        if (a.type !== 'low_stock' && b.type === 'low_stock') return 1;
        return 0;
      });
    }

    // Notificações completas para admin e almoxarife
    // Low stock notifications
    products
      .filter((p) => p.quantity <= (p.min_quantity || 10))
      .forEach((product) => {
        notifications.push({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          title: 'Estoque Baixo',
          description: `${product.name} está com apenas ${product.quantity} unidades (mínimo: ${product.min_quantity || 10})`,
          time: formatDistanceToNow(new Date(product.updated_at), { addSuffix: true, locale: ptBR }),
          read: false,
        });
      });

    // Products near expiry
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    products
      .filter((p) => p.expiry_date && new Date(p.expiry_date) <= thirtyDaysFromNow)
      .forEach((product) => {
        const expiryDate = new Date(product.expiry_date!);
        const isExpired = expiryDate < today;
        
        notifications.push({
          id: `expiry-${product.id}`,
          type: 'expiry',
          title: isExpired ? 'Produto Vencido' : 'Vencimento Próximo',
          description: `${product.name} ${isExpired ? 'venceu' : 'vence'} em ${expiryDate.toLocaleDateString('pt-BR')}`,
          time: formatDistanceToNow(expiryDate, { addSuffix: true, locale: ptBR }),
          read: false,
        });
      });

    // Sort by most recent
    return notifications.sort((a, b) => {
      // Priority: low_stock and expiry first, then by time
      if (a.type === 'low_stock' && b.type !== 'low_stock') return -1;
      if (a.type !== 'low_stock' && b.type === 'low_stock') return 1;
      if (a.type === 'expiry' && b.type !== 'expiry') return -1;
      if (a.type !== 'expiry' && b.type === 'expiry') return 1;
      return 0;
    });
  }, [products, isViewer]);

  // Filtrar notificações descartadas
  const notifications = useMemo(() => {
    return allNotifications.filter((n) => !dismissedIds.has(n.id));
  }, [allNotifications, dismissedIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissNotification = useCallback((id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    saveDismissedIds(newDismissed);
  }, [dismissedIds, saveDismissedIds]);

  const dismissAllNotifications = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    const newDismissed = new Set([...dismissedIds, ...allIds]);
    saveDismissedIds(newDismissed);
  }, [notifications, dismissedIds, saveDismissedIds]);

  const dismissSelectedNotifications = useCallback((ids: string[]) => {
    const newDismissed = new Set([...dismissedIds, ...ids]);
    saveDismissedIds(newDismissed);
  }, [dismissedIds, saveDismissedIds]);

  return {
    notifications,
    unreadCount,
    dismissNotification,
    dismissAllNotifications,
    dismissSelectedNotifications,
  };
};
