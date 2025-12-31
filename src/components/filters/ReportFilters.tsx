import { useState } from "react";
import { Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface ReportFilters {
  categoryId: string;
  supplierId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  categories: { id: string; name: string; color?: string | null }[];
  suppliers: { id: string; name: string }[];
}

export function ReportFiltersComponent({
  filters,
  onFiltersChange,
  categories,
  suppliers,
}: ReportFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.categoryId !== "all" ||
    filters.supplierId !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      categoryId: "all",
      supplierId: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const activeFiltersCount = [
    filters.categoryId !== "all",
    filters.supplierId !== "all",
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros Avançados</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select
              value={filters.supplierId}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, supplierId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período Personalizado</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {filters.dateFrom
                      ? format(filters.dateFrom, "dd/MM/yy", { locale: ptBR })
                      : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, dateFrom: date })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {filters.dateTo
                      ? format(filters.dateTo, "dd/MM/yy", { locale: ptBR })
                      : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, dateTo: date })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
