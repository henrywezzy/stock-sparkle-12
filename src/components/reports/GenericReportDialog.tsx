import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  Mail,
  Loader2,
  FileText,
  Building2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";

export interface ReportColumn {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  format?: (value: any, row: any) => string;
}

export interface ReportSummary {
  label: string;
  value: string | number;
  color?: "primary" | "success" | "warning" | "destructive" | "muted";
  icon?: React.ReactNode;
}

export interface GenericReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: any[];
  summaries?: ReportSummary[];
  fileName?: string;
  metadata?: { label: string; value: string }[];
}

export function GenericReportDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  columns,
  data,
  summaries = [],
  fileName = "relatorio",
  metadata = [],
}: GenericReportDialogProps) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(settings?.name || "Stockly", 14, 18);
    doc.setFontSize(9);
    doc.text("Sistema de Gestão de Almoxarifado", 14, 26);
    
    // Company info on header
    if (settings?.cnpj) {
      doc.setFontSize(8);
      doc.text(`CNPJ: ${settings.cnpj}`, pageWidth - 14, 18, { align: "right" });
    }
    if (settings?.phone) {
      doc.text(`Tel: ${settings.phone}`, pageWidth - 14, 24, { align: "right" });
    }
    if (settings?.email) {
      doc.text(settings.email, pageWidth - 14, 30, { align: "right" });
    }
    
    // Report Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), pageWidth / 2, 55, { align: "center" });
    
    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, pageWidth / 2, 62, { align: "center" });
    }
    
    // Metadata Box
    let yPos = 70;
    if (metadata.length > 0) {
      doc.setFillColor(248, 250, 252);
      const metaHeight = Math.ceil(metadata.length / 2) * 12 + 10;
      doc.roundedRect(14, yPos, pageWidth - 28, metaHeight, 3, 3, 'F');
      
      doc.setFontSize(9);
      const colWidth = (pageWidth - 42) / 2;
      
      metadata.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 20 + col * colWidth;
        const y = yPos + 8 + row * 12;
        
        doc.setTextColor(100, 116, 139);
        doc.text(`${item.label}:`, x, y);
        doc.setTextColor(30, 41, 59);
        doc.text(item.value, x + 40, y);
      });
      
      yPos += metaHeight + 10;
    }
    
    // Summary Cards
    if (summaries.length > 0) {
      const cardWidth = (pageWidth - 28 - (summaries.length - 1) * 5) / Math.min(summaries.length, 4);
      
      summaries.slice(0, 4).forEach((summary, index) => {
        const x = 14 + index * (cardWidth + 5);
        
        // Card background
        const bgColors: Record<string, [number, number, number]> = {
          primary: [239, 246, 255],
          success: [240, 253, 244],
          warning: [254, 249, 195],
          destructive: [254, 242, 242],
          muted: [248, 250, 252],
        };
        const color = bgColors[summary.color || 'muted'];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(x, yPos, cardWidth, 25, 2, 2, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(summary.label, x + 5, yPos + 8);
        
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(String(summary.value), x + 5, yPos + 20);
      });
      
      yPos += 35;
    }
    
    // Data Table
    if (data.length > 0) {
      const headers = columns.map(col => col.header);
      const body = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          return col.format ? col.format(value, row) : String(value ?? '—');
        })
      );
      
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: body,
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [30, 41, 59], 
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }
    
    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`${fileName}-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
    toast({
      title: "PDF gerado!",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const handlePrint = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite o email do destinatário.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const doc = generatePDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          to: emailTo,
          subject: `${title} - ${format(new Date(), "dd/MM/yyyy")}`,
          reportData: {
            title,
            subtitle,
            metadata,
            summaries: summaries.map(s => ({ label: s.label, value: s.value })),
            itemCount: data.length,
          },
          companyName: settings?.name || 'Stockly',
          pdfBase64,
        },
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: `O relatório foi enviado para ${emailTo}`,
      });
      setShowEmailDialog(false);
      setEmailTo("");
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-border",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Report Preview */}
          <div className="flex-1 overflow-auto">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Report Header */}
              <div className="bg-slate-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{settings?.name || 'Stockly'}</h1>
                    <p className="text-slate-300 text-sm">Sistema de Gestão de Almoxarifado</p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    {settings?.cnpj && <p>CNPJ: {settings.cnpj}</p>}
                    {settings?.phone && <p>Tel: {settings.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Report Title */}
              <div className="text-center py-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{title.toUpperCase()}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>

              {/* Metadata */}
              {metadata.length > 0 && (
                <div className="p-6 bg-muted/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metadata.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="font-medium text-sm">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              {summaries.length > 0 && (
                <div className="p-6">
                  <div className={`grid gap-4 grid-cols-${Math.min(summaries.length, 4)}`}
                    style={{ gridTemplateColumns: `repeat(${Math.min(summaries.length, 4)}, minmax(0, 1fr))` }}>
                    {summaries.map((summary, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${colorClasses[summary.color || 'muted']}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {summary.icon}
                          <span className="text-sm opacity-80">{summary.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{summary.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              {data.length > 0 && (
                <div className="p-6 pt-0">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {columns.map((col, index) => (
                              <th
                                key={index}
                                className={`p-3 font-medium text-${col.align || 'left'}`}
                              >
                                {col.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-muted/50">
                              {columns.map((col, colIndex) => {
                                const value = row[col.key];
                                const formatted = col.format ? col.format(value, row) : String(value ?? '—');
                                return (
                                  <td
                                    key={colIndex}
                                    className={`p-3 text-${col.align || 'left'}`}
                                  >
                                    {formatted}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    Total de registros: {data.length}
                  </p>
                </div>
              )}

              {data.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado para exibir</p>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} pelo sistema {settings?.name || 'Stockly'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Enviar Relatório por Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">Email do Destinatário</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="email@exemplo.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendEmail} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
