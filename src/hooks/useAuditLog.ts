import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export const useAuditLog = (options?: {
  tableName?: string;
  recordId?: string;
  limit?: number;
}) => {
  const { tableName, recordId, limit = 100 } = options || {};

  const { data: auditLog = [], isLoading, error } = useQuery({
    queryKey: ['audit-log', tableName, recordId, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  // Agrupar por tabela para estatísticas
  const statsByTable = auditLog.reduce((acc, entry) => {
    if (!acc[entry.table_name]) {
      acc[entry.table_name] = { inserts: 0, updates: 0, deletes: 0 };
    }
    if (entry.action === 'INSERT') acc[entry.table_name].inserts++;
    if (entry.action === 'UPDATE') acc[entry.table_name].updates++;
    if (entry.action === 'DELETE') acc[entry.table_name].deletes++;
    return acc;
  }, {} as Record<string, { inserts: number; updates: number; deletes: number }>);

  return {
    auditLog,
    isLoading,
    error,
    statsByTable,
  };
};
