import { useState } from "react";
import { Settings2, GripVertical, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ColumnConfig } from "@/hooks/useColumnPreferences";
import { cn } from "@/lib/utils";

interface ColumnSettingsProps {
  columns: ColumnConfig[];
  onToggle: (key: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

export function ColumnSettings({
  columns,
  onToggle,
  onReorder,
  onReset,
}: ColumnSettingsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Colunas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Colunas visíveis</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Resetar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Arraste para reordenar
          </p>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto">
          {columns.map((column, index) => (
            <div
              key={column.key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-move transition-colors",
                draggedIndex === index && "opacity-50 bg-muted",
                dragOverIndex === index && "border-2 border-primary border-dashed",
                "hover:bg-muted"
              )}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Label
                htmlFor={`column-${column.key}`}
                className="flex-1 text-sm cursor-pointer"
              >
                {column.label}
              </Label>
              <Switch
                id={`column-${column.key}`}
                checked={column.visible}
                onCheckedChange={() => onToggle(column.key)}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
        <Separator />
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Check className="w-3 h-3" />
            <span>
              {columns.filter((c) => c.visible).length} de {columns.length} colunas visíveis
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
