import { useState } from "react";
import { Search, Filter, ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, Calendar, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { entries, exits } from "@/data/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Movement {
  id: string;
  type: "entry" | "exit";
  date: string;
  product: string;
  quantity: number;
  person: string;
  details: string;
}

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");

  // Combine entries and exits into movements
  const movements: Movement[] = [
    ...entries.map((e) => ({
      id: `entry-${e.id}`,
      type: "entry" as const,
      date: e.date,
      product: e.product,
      quantity: e.quantity,
      person: e.responsible,
      details: e.supplier,
    })),
    ...exits.map((e) => ({
      id: `exit-${e.id}`,
      type: "exit" as const,
      date: e.date,
      product: e.product,
      quantity: e.quantity,
      person: e.employee,
      details: e.destination,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredMovements = movements.filter(
    (m) =>
      m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.person.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-2xl font-bold">{movements.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entradas</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ArrowUpFromLine className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saídas</p>
            <p className="text-2xl font-bold">{exits.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {/* Timeline */}
      <div className="glass rounded-xl p-6">
        <div className="space-y-4">
          {filteredMovements.map((movement, index) => (
            <div
              key={movement.id}
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
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
                {index < filteredMovements.length - 1 && (
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
                    <p className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(movement.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                  {movement.type === "entry" ? "Fornecedor" : "Destino"}: {movement.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
