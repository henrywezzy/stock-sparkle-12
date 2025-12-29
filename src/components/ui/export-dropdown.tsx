import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToPDF, ExportColumn } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportDropdownProps {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  disabled?: boolean;
  selectedCount?: number;
}

export function ExportDropdown({
  title,
  filename,
  columns,
  data,
  disabled = false,
  selectedCount = 0,
}: ExportDropdownProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "pdf") => {
    if (data.length === 0) {
      toast({
        title: "Nenhum item para exportar",
        description: "Selecione pelo menos um item para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const options = {
        title,
        filename,
        columns,
        data,
      };

      if (format === "csv") {
        exportToCSV(options);
        toast({
          title: "Exportado com sucesso!",
          description: `${data.length} item(s) exportado(s) para CSV.`,
        });
      } else {
        exportToPDF(options);
        toast({
          title: "Exportado com sucesso!",
          description: `${data.length} item(s) exportado(s) para PDF.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar para Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar para PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
