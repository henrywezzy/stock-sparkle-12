import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useEntries } from './useEntries';
import { useExits } from './useExits';
import { useEmployees } from './useEmployees';
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

export const useNotifications = () => {
  const { products } = useProducts();
  const { entries } = useEntries();
  const { exits } = useExits();
  const { employees } = useEmployees();

  const notifications = useMemo(() => {
    const allNotifications: Notification[] = [];

    // Low stock notifications
    products
      .filter((p) => p.quantity <= (p.min_quantity || 10))
      .forEach((product) => {
        allNotifications.push({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          title: 'Estoque Baixo',
          description: `${product.name} está com apenas ${product.quantity} unidades (mínimo: ${product.min_quantity || 10})`,
          time: formatDistanceToNow(new Date(product.updated_at), { addSuffix: true, locale: ptBR }),
          read: false,
        });
      });

    // Recent entries (last 5)
    entries.slice(0, 5).forEach((entry) => {
      allNotifications.push({
        id: `entry-${entry.id}`,
        type: 'entry',
        title: 'Nova Entrada',
        description: `+${entry.quantity} unidades de ${entry.products?.name || 'Produto'}`,
        time: formatDistanceToNow(new Date(entry.entry_date), { addSuffix: true, locale: ptBR }),
        read: false,
      });
    });

    // Recent exits (last 5)
    exits.slice(0, 5).forEach((exit) => {
      allNotifications.push({
        id: `exit-${exit.id}`,
        type: 'exit',
        title: 'Nova Saída',
        description: `-${exit.quantity} unidades de ${exit.products?.name || 'Produto'}`,
        time: formatDistanceToNow(new Date(exit.exit_date), { addSuffix: true, locale: ptBR }),
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
        
        allNotifications.push({
          id: `expiry-${product.id}`,
          type: 'expiry',
          title: isExpired ? 'Produto Vencido' : 'Vencimento Próximo',
          description: `${product.name} ${isExpired ? 'venceu' : 'vence'} em ${expiryDate.toLocaleDateString('pt-BR')}`,
          time: formatDistanceToNow(expiryDate, { addSuffix: true, locale: ptBR }),
          read: false,
        });
      });

    // New employees (last 3)
    employees
      .filter((e) => e.status === 'active')
      .slice(0, 3)
      .forEach((employee) => {
        allNotifications.push({
          id: `employee-${employee.id}`,
          type: 'employee',
          title: 'Funcionário Ativo',
          description: `${employee.name} - ${employee.department || 'Sem departamento'}`,
          time: formatDistanceToNow(new Date(employee.created_at), { addSuffix: true, locale: ptBR }),
          read: false,
        });
      });

    // Sort by most recent
    return allNotifications.sort((a, b) => {
      // Priority: low_stock and expiry first, then by time
      if (a.type === 'low_stock' && b.type !== 'low_stock') return -1;
      if (a.type !== 'low_stock' && b.type === 'low_stock') return 1;
      if (a.type === 'expiry' && b.type !== 'expiry') return -1;
      if (a.type !== 'expiry' && b.type === 'expiry') return 1;
      return 0;
    });
  }, [products, entries, exits, employees]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
  };
};
