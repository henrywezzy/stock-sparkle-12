import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface DataFiltersProps {
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  showDateFilter?: boolean;
  onDateFromChange?: (date: Date | undefined) => void;
  onDateToChange?: (date: Date | undefined) => void;
  dateFrom?: Date;
  dateTo?: Date;
  showCategoryFilter?: boolean;
  categories?: FilterOption[];
  onCategoryChange?: (value: string) => void;
  selectedCategory?: string;
  showSupplierFilter?: boolean;
  suppliers?: FilterOption[];
  onSupplierChange?: (value: string) => void;
  selectedSupplier?: string;
  showEmployeeFilter?: boolean;
  employees?: FilterOption[];
  onEmployeeChange?: (value: string) => void;
  selectedEmployee?: string;
  onClearFilters?: () => void;
}

export const DataFilters = ({
  onSearch,
  searchPlaceholder = 'Buscar...',
  showDateFilter = false,
  onDateFromChange,
  onDateToChange,
  dateFrom,
  dateTo,
  showCategoryFilter = false,
  categories = [],
  onCategoryChange,
  selectedCategory,
  showSupplierFilter = false,
  suppliers = [],
  onSupplierChange,
  selectedSupplier,
  showEmployeeFilter = false,
  employees = [],
  onEmployeeChange,
  selectedEmployee,
  onClearFilters,
}: DataFiltersProps) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const hasActiveFilters =
    searchValue ||
    dateFrom ||
    dateTo ||
    (selectedCategory && selectedCategory !== 'all') ||
    (selectedSupplier && selectedSupplier !== 'all') ||
    (selectedEmployee && selectedEmployee !== 'all');

  const handleClearAll = () => {
    setSearchValue('');
    onSearch('');
    onClearFilters?.();
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Date From */}
        {showDateFilter && (
          <div className="min-w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={onDateFromChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Date To */}
        {showDateFilter && (
          <div className="min-w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={onDateToChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Category Filter */}
        {showCategoryFilter && categories.length > 0 && (
          <div className="min-w-[180px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Categoria</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Supplier Filter */}
        {showSupplierFilter && suppliers.length > 0 && (
          <div className="min-w-[180px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fornecedor</Label>
            <Select value={selectedSupplier} onValueChange={onSupplierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.value} value={supplier.value}>
                    {supplier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Employee Filter */}
        {showEmployeeFilter && employees.length > 0 && (
          <div className="min-w-[180px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Funcionário</Label>
            <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.value} value={employee.value}>
                    {employee.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
