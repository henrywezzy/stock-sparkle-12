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
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Printer,
  Mail,
  Loader2,
  Building2,
  Calendar,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InventoryReport } from "@/hooks/useInventoryReports";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface ReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: InventoryReport;
  products?: Array<{
    name: string;
    category: string;
    systemQty: number;
    physicalQty: number;
    difference: number;
  }>;
}

export function ReportViewerDialog({
  open,
  onOpenChange,
  report,
  products = [],
}: ReportViewerDialogProps) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(settings?.name || "Stockly", 14, 20);
    doc.setFontSize(10);
    doc.text("Sistema de Gestão de Almoxarifado", 14, 28);
    
    // Report Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE INVENTÁRIO", pageWidth / 2, 55, { align: "center" });
    
    // Report Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 65, pageWidth - 28, 35, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Data:", 20, 75);
    doc.text("Tipo:", 20, 85);
    doc.text("Responsável:", 20, 95);
    
    doc.setTextColor(30, 41, 59);
    doc.text(format(new Date(report.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), 45, 75);
    doc.text(report.type === 'complete' ? 'Inventário Completo' : `Categoria: ${report.categoryName}`, 45, 85);
    doc.text(report.responsible, 60, 95);
    
    doc.text("Status:", pageWidth / 2 + 10, 75);
    doc.setTextColor(report.status === 'completed' ? 34 : 148, report.status === 'completed' ? 197 : 163, report.status === 'completed' ? 94 : 184);
    doc.text(report.status === 'completed' ? 'Concluído' : 'Cancelado', pageWidth / 2 + 35, 75);
    
    // Summary Cards
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, 110, (pageWidth - 38) / 3, 25, 2, 2, 'F');
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14 + (pageWidth - 38) / 3 + 5, 110, (pageWidth - 38) / 3, 25, 2, 2, 'F');
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(14 + ((pageWidth - 38) / 3 + 5) * 2, 110, (pageWidth - 38) / 3, 25, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Itens Conferidos", 20, 118);
    doc.text("Ajustes Realizados", 20 + (pageWidth - 38) / 3 + 5, 118);
    doc.text("Divergências", 20 + ((pageWidth - 38) / 3 + 5) * 2, 118);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`${report.countedItems}/${report.totalItems}`, 20, 128);
    doc.text(`${report.adjustments}`, 20 + (pageWidth - 38) / 3 + 5, 128);
    doc.text(`${report.divergences}`, 20 + ((pageWidth - 38) / 3 + 5) * 2, 128);
    
    // Products Table (if available)
    if (products.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Detalhamento por Produto", 14, 150);
      
      autoTable(doc, {
        startY: 155,
        head: [['Produto', 'Categoria', 'Sistema', 'Físico', 'Diferença', 'Status']],
        body: products.map(p => [
          p.name,
          p.category,
          p.systemQty.toString(),
          p.physicalQty.toString(),
          p.difference > 0 ? `+${p.difference}` : p.difference.toString(),
          p.difference === 0 ? 'OK' : 'Divergente'
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
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
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
    
    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`inventario-${format(new Date(report.date), "yyyyMMdd-HHmm")}.pdf`);
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
          subject: `Relatório de Inventário - ${format(new Date(report.date), "dd/MM/yyyy")}`,
          reportData: {
            date: report.date,
            type: report.type,
            categoryName: report.categoryName,
            responsible: report.responsible,
            totalItems: report.totalItems,
            countedItems: report.countedItems,
            divergences: report.divergences,
            adjustments: report.adjustments,
            status: report.status,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Visualizar Relatório
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
          <div className="flex-1 overflow-auto" ref={reportRef}>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Report Header */}
              <div className="bg-slate-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{settings?.name || 'Stockly'}</h1>
                    <p className="text-slate-300 text-sm">Sistema de Gestão de Almoxarifado</p>
                  </div>
                  {settings?.logo_url && (
                    <img src={settings.logo_url} alt="Logo" className="h-12 w-auto" />
                  )}
                </div>
              </div>

              {/* Report Title */}
              <div className="text-center py-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">RELATÓRIO DE INVENTÁRIO</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Documento gerado automaticamente pelo sistema
                </p>
              </div>

              {/* Report Info */}
              <div className="p-6 bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium text-sm">
                        {format(new Date(report.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium text-sm">
                        {report.type === 'complete' ? 'Completo' : `Categoria: ${report.categoryName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsável</p>
                      <p className="font-medium text-sm">{report.responsible}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={report.status === 'completed' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                      {report.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Itens Conferidos</span>
                    </div>
                    <p className="text-2xl font-bold">{report.countedItems}/{report.totalItems}</p>
                    <p className="text-xs text-muted-foreground">
                      {((report.countedItems / report.totalItems) * 100).toFixed(0)}% do total
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm text-muted-foreground">Ajustes Realizados</span>
                    </div>
                    <p className="text-2xl font-bold">{report.adjustments}</p>
                    <p className="text-xs text-muted-foreground">
                      produtos atualizados
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      <span className="text-sm text-muted-foreground">Divergências</span>
                    </div>
                    <p className="text-2xl font-bold">{report.divergences}</p>
                    <p className="text-xs text-muted-foreground">
                      {((report.divergences / report.totalItems) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                </div>
              </div>

              {/* Products Table (if available) */}
              {products.length > 0 && (
                <div className="p-6 pt-0">
                  <h3 className="font-semibold mb-4">Detalhamento por Produto</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Produto</th>
                          <th className="text-left p-3 font-medium">Categoria</th>
                          <th className="text-center p-3 font-medium">Sistema</th>
                          <th className="text-center p-3 font-medium">Físico</th>
                          <th className="text-center p-3 font-medium">Diferença</th>
                          <th className="text-center p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {products.map((product, index) => (
                          <tr key={index} className="hover:bg-muted/50">
                            <td className="p-3">{product.name}</td>
                            <td className="p-3">{product.category}</td>
                            <td className="p-3 text-center">{product.systemQty}</td>
                            <td className="p-3 text-center">{product.physicalQty}</td>
                            <td className={`p-3 text-center font-medium ${product.difference > 0 ? 'text-success' : product.difference < 0 ? 'text-destructive' : ''}`}>
                              {product.difference > 0 ? '+' : ''}{product.difference}
                            </td>
                            <td className="p-3 text-center">
                              {product.difference === 0 ? (
                                <Badge className="bg-success/20 text-success">OK</Badge>
                              ) : (
                                <Badge className="bg-warning/20 text-warning">Divergente</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
