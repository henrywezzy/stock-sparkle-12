import { useState, useMemo } from "react";
import { Search, Filter, ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, Calendar, User, Loader2, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEntries } from "@/hooks/useEntries";
import { useExits } from "@/hooks/useExits";
import { useStockHistory } from "@/hooks/useStockHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Movement {
  id: string;
  type: "entry" | "exit";
  date: Date;
  product: string;
  quantity: number;
  person: string;
  details: string;
}

export default function History() {
  const { entries, isLoading: entriesLoading } = useEntries();
  const { exits, isLoading: exitsLoading } = useExits();
  const { history, isLoading: historyLoading } = useStockHistory();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("30");

  const isLoading = entriesLoading || exitsLoading || historyLoading;

  // Combinar entradas e saídas em movimentações
  const movements = useMemo<Movement[]>(() => {
    const entryMovements = entries.map((e) => ({
      id: `entry-${e.id}`,
      type: "entry" as const,
      date: new Date(e.entry_date),
      product: e.products?.name || "Produto",
      quantity: e.quantity,
      person: e.received_by || "—",
      details: e.suppliers?.name || e.invoice_number || "—",
    }));

    const exitMovements = exits.map((e) => ({
      id: `exit-${e.id}`,
      type: "exit" as const,
      date: new Date(e.exit_date),
      product: e.products?.name || "Produto",
      quantity: e.quantity,
      person: e.employees?.name || "—",
      details: e.destination || e.reason || "—",
    }));

    return [...entryMovements, ...exitMovements].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [entries, exits]);

  // Filtrar movimentações
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(periodFilter, 10);
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return movements.filter((m) => {
      const matchesSearch =
        m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || m.type === typeFilter;
      const matchesPeriod = m.date >= periodStart;

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [movements, searchTerm, typeFilter, periodFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalEntries = filteredMovements.filter((m) => m.type === "entry");
    const totalExits = filteredMovements.filter((m) => m.type === "exit");

    return {
      total: filteredMovements.length,
      entries: totalEntries.length,
      entriesQty: totalEntries.reduce((acc, m) => acc + m.quantity, 0),
      exits: totalExits.length,
      exitsQty: totalExits.reduce((acc, m) => acc + m.quantity, 0),
    };
  }, [filteredMovements]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        description="Visualize todas as movimentações do almoxarifado"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Histórico" }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <HistoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Movimentações</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entradas</p>
            <p className="text-2xl font-bold">{stats.entries}</p>
            <p className="text-xs text-muted-foreground">+{stats.entriesQty} itens</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ArrowUpFromLine className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saídas</p>
            <p className="text-2xl font-bold">{stats.exits}</p>
            <p className="text-xs text-muted-foreground">-{stats.exitsQty} itens</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto, responsável ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entry">Entradas</SelectItem>
            <SelectItem value="exit">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          {/* Timeline */}
          <div className="glass rounded-xl p-6">
            <div className="space-y-4">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação encontrada
                </div>
              ) : (
                filteredMovements.slice(0, 50).map((movement, index) => (
                  <div
                    key={movement.id}
                    className="flex gap-4 animate-slide-up"
                    style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                  >
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          movement.type === "entry"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {movement.type === "entry" ? (
                          <ArrowDownToLine className="w-5 h-5" />
                        ) : (
                          <ArrowUpFromLine className="w-5 h-5" />
                        )}
                      </div>
                      {index < filteredMovements.length - 1 && index < 49 && (
                        <div className="w-px h-full bg-border/50 my-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={
                                movement.type === "entry"
                                  ? "bg-success/20 text-success"
                                  : "bg-destructive/20 text-destructive"
                              }
                            >
                              {movement.type === "entry" ? "Entrada" : "Saída"}
                            </Badge>
                            <span className="font-semibold">{movement.product}</span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(movement.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {movement.person}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`font-bold text-lg ${
                            movement.type === "entry" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {movement.type === "entry" ? "+" : "-"}{movement.quantity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {movement.type === "entry" ? "Fornecedor/NF" : "Destino"}: {movement.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {filteredMovements.length > 50 && (
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Mostrando 50 de {filteredMovements.length} movimentações
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          {/* Audit Log from stock_history */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Log de Alterações de Estoque
            </h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro de auditoria encontrado
                </div>
              ) : (
                history.slice(0, 100).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        entry.action === 'entry' ? 'bg-success/10' : 
                        entry.action === 'exit' ? 'bg-destructive/10' : 'bg-warning/10'
                      }`}>
                        {entry.action === 'entry' ? (
                          <ArrowDownToLine className="w-4 h-4 text-success" />
                        ) : entry.action === 'exit' ? (
                          <ArrowUpFromLine className="w-4 h-4 text-destructive" />
                        ) : (
                          <Package className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{entry.products?.name || "Produto"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          {entry.user_name && ` • ${entry.user_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{entry.previous_quantity ?? '?'}</span>
                        {' → '}
                        <span className="font-medium">{entry.new_quantity ?? '?'}</span>
                      </p>
                      <p className={`text-xs font-medium ${
                        entry.action === 'entry' ? 'text-success' : 
                        entry.action === 'exit' ? 'text-destructive' : 'text-warning'
                      }`}>
                        {entry.action === 'entry' ? '+' : entry.action === 'exit' ? '-' : '±'}{entry.quantity}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
