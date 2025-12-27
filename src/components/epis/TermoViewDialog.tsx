import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TermoEntrega } from "@/hooks/useTermosEntrega";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { DeliveryTermPrint } from "./DeliveryTermPrint";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TermoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termo: TermoEntrega | null;
}

export function TermoViewDialog({ open, onOpenChange, termo }: TermoViewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { settings: companySettings } = useCompanySettings();

  if (!termo) return null;

  const company = {
    name: companySettings?.name || "Empresa XYZ Ltda",
    cnpj: companySettings?.cnpj || "00.000.000/0001-00",
    address: companySettings?.address 
      ? `${companySettings.address}${companySettings.city ? ` - ${companySettings.city}` : ''}${companySettings.state ? `/${companySettings.state}` : ''}`
      : "Rua Exemplo, 123 - Centro - Cidade/UF",
    phone: companySettings?.phone || "(00) 0000-0000",
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Company Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(company.name, margin, 15);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${company.cnpj}`, margin, 20);
    doc.text(company.address, margin, 24);
    doc.text(`Tel: ${company.phone}`, margin, 28);
    
    // Term number and date (right aligned)
    doc.setFontSize(9);
    doc.text(`Nº ${termo.numero}`, pageWidth - margin, 15, { align: "right" });
    doc.text(`Data: ${format(new Date(termo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - margin, 20, { align: "right" });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, 33, pageWidth - margin, 33);
    
    // Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE E RECEBIMENTO", pageWidth / 2, 41, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Equipamentos de Proteção Individual - EPI e Uniforme", pageWidth / 2, 46, { align: "center" });
    
    // Employee box
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, 51, pageWidth - (margin * 2), 22);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, 51, pageWidth - (margin * 2), 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DADOS DO COLABORADOR", margin + 3, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nome: ${termo.employees?.name || '-'}`, margin + 3, 62);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, pageWidth / 2 + 5, 62);
    doc.text(`Cargo: ${termo.employees?.position || '-'}`, margin + 3, 68);
    doc.text(`Setor: ${termo.employees?.department || '-'}`, pageWidth / 2 + 5, 68);

    // EPIs table
    const epiRows = termo.termo_epis?.map(item => [
      item.epis?.name || '-',
      item.ca_number || '-',
      item.tamanho || '-',
      item.quantidade.toString(),
      format(new Date(item.data_entrega), 'dd/MM/yy'),
      item.data_devolucao ? format(new Date(item.data_devolucao), 'dd/MM/yy') : '__/__/__',
      '', // Signature column
    ]) || [];

    // Add empty rows for manual additions (fewer rows to fit page)
    const emptyRowsCount = Math.max(2, 5 - epiRows.length);
    for (let i = 0; i < emptyRowsCount; i++) {
      epiRows.push(['', '', '', '', '__/__/__', '__/__/__', '']);
    }

    autoTable(doc, {
      startY: 78,
      head: [['EPI/Uniforme', 'CA', 'Tam', 'Qtd', 'Entrega', 'Devol.', 'Ass.']],
      body: epiRows,
      headStyles: { fillColor: [80, 80, 80], fontSize: 8, cellPadding: 2 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 10, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    // Terms text box
    let finalY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, finalY, pageWidth - (margin * 2), 42);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const termsY = finalY + 5;
    
    doc.text("Declaro que recebi os EPIs e Uniformes acima, em perfeito estado, comprometendo-me a:", margin + 3, termsY);
    
    doc.text("1. Usar durante toda a jornada de trabalho;", margin + 5, termsY + 5);
    doc.text("2. Responsabilizar-me pela guarda e conservação;", margin + 5, termsY + 9);
    doc.text("3. Comunicar qualquer alteração que os torne impróprios;", margin + 5, termsY + 13);
    doc.text("4. Cumprir as determinações do empregador;", margin + 5, termsY + 17);
    doc.text("5. Devolver em caso de desligamento ou quando solicitado;", margin + 5, termsY + 21);
    doc.text("6. Ressarcir em caso de dano ou perda por negligência.", margin + 5, termsY + 25);
    
    doc.setFont("helvetica", "bold");
    doc.text("ESTOU CIENTE: O não uso constitui ato faltoso (NR-06 e CLT Art. 158).", margin + 3, termsY + 33);

    finalY = finalY + 47;

    // Observations
    if (termo.observacoes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Obs: ${termo.observacoes}`, margin, finalY);
      finalY += 8;
    }

    // Date line
    const dateExtended = format(new Date(termo.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Local e Data: _________________________, ${dateExtended}`, pageWidth / 2, finalY + 5, { align: "center" });

    // Signatures
    const sigY = finalY + 25;
    doc.setLineWidth(0.3);
    doc.line(margin + 10, sigY, margin + 75, sigY);
    doc.line(pageWidth - margin - 75, sigY, pageWidth - margin - 10, sigY);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(termo.employees?.name || 'Colaborador', margin + 42.5, sigY + 4, { align: "center" });
    doc.text(termo.responsavel_nome || 'Responsável', pageWidth - margin - 42.5, sigY + 4, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Mat: ${termo.employees?.registration_number || '-'}`, margin + 42.5, sigY + 8, { align: "center" });
    doc.text("COLABORADOR", margin + 42.5, sigY + 12, { align: "center" });
    doc.text("RESPONSÁVEL PELA ENTREGA", pageWidth - margin - 42.5, sigY + 8, { align: "center" });

    // Footer
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")} | Ref: ${termo.numero}`, pageWidth / 2, pageHeight - 8, { align: "center" });

    doc.save(`termo-epi-${termo.employees?.registration_number || 'sem-matricula'}-${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    pendente: { label: "Pendente", variant: "secondary" },
    assinado: { label: "Assinado", variant: "default" },
    arquivado: { label: "Arquivado", variant: "default" },
  };

  const config = statusConfig[termo.status || 'pendente'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-3">
            <span>Termo {termo.numero}</span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <DeliveryTermPrint termo={termo} companySettings={companySettings} />
        </div>

        <DialogFooter className="no-print gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}