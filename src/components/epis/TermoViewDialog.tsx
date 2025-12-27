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

  if (!termo) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Company Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Empresa XYZ Ltda", 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("CNPJ: 00.000.000/0001-00", 14, 21);
    doc.text("Rua Exemplo, 123 - Centro - Cidade/UF", 14, 26);
    doc.text("Tel: (00) 0000-0000", 14, 31);
    
    // Term number and date
    doc.setFontSize(10);
    doc.text(`Nº ${termo.numero}`, pageWidth - 14, 15, { align: "right" });
    doc.text(`Data: ${format(new Date(termo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - 14, 21, { align: "right" });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 36, pageWidth - 14, 36);
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE E RECEBIMENTO", pageWidth / 2, 46, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Equipamentos de Proteção Individual (EPIs)", pageWidth / 2, 52, { align: "center" });
    
    // Employee box
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(14, 58, pageWidth - 28, 28);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 58, pageWidth - 28, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DADOS DO COLABORADOR", 18, 63);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${termo.employees?.name || '-'}`, 18, 72);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, pageWidth / 2 + 10, 72);
    doc.text(`Cargo: ${termo.employees?.position || '-'}`, 18, 79);
    doc.text(`Setor: ${termo.employees?.department || '-'}`, pageWidth / 2 + 10, 79);

    // EPIs table with empty rows for manual additions
    const epiRows = termo.termo_epis?.map(item => [
      item.epis?.name || '-',
      item.ca_number || '-',
      item.tamanho || '-',
      item.quantidade.toString(),
      format(new Date(item.data_entrega), 'dd/MM/yyyy'),
      item.data_devolucao ? format(new Date(item.data_devolucao), 'dd/MM/yyyy') : '___/___/______',
      item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy') : '-',
    ]) || [];

    // Add 5 empty rows for manual additions
    for (let i = 0; i < 5; i++) {
      epiRows.push(['', '', '', '', '___/___/______', '___/___/______', '___/___/______']);
    }

    autoTable(doc, {
      startY: 92,
      head: [['Item', 'CA', 'Tam.', 'Qtd', 'Entrega', 'Devolução', 'Validade']],
      body: epiRows,
      headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
      bodyStyles: { fontSize: 9, minCellHeight: 8 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 28, halign: 'center' },
        6: { cellWidth: 27, halign: 'center' },
      },
    });

    // Terms text box
    let finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(14, finalY, pageWidth - 28, 55);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const termsY = finalY + 6;
    doc.text("Declaro que recebi os Equipamentos de Proteção Individual (EPIs) discriminados acima, em perfeito estado de", 18, termsY);
    doc.text("conservação e adequados às minhas medidas.", 18, termsY + 4);
    
    doc.setFont("helvetica", "bold");
    doc.text("COMPROMETO-ME A:", 18, termsY + 12);
    doc.setFont("helvetica", "normal");
    doc.text("• Utilizar os EPIs durante todo o período de trabalho", 22, termsY + 17);
    doc.text("• Guardar e conservar em local adequado", 22, termsY + 21);
    doc.text("• Comunicar qualquer alteração que os torne impróprios", 22, termsY + 25);
    doc.text("• Responsabilizar-me pela guarda e conservação", 22, termsY + 29);
    doc.text("• Devolver em caso de desligamento", 22, termsY + 33);
    doc.text("• Ressarcir em caso de dano ou perda por negligência", 22, termsY + 37);
    
    doc.setFont("helvetica", "bold");
    doc.text("ESTOU CIENTE DE QUE: O não uso dos EPIs constitui ato faltoso, sujeitando-me às penalidades previstas", 18, termsY + 45);
    doc.text("na NR-06 e CLT Art. 158.", 18, termsY + 49);

    if (termo.observacoes) {
      finalY = finalY + 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Observações: ${termo.observacoes}`, 14, finalY);
      finalY += 10;
    } else {
      finalY = finalY + 60;
    }

    const dateExtended = format(new Date(termo.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Local e Data: _________________________, ${dateExtended}`, pageWidth / 2, finalY + 10, { align: "center" });

    const sigY = finalY + 35;
    doc.setLineWidth(0.3);
    doc.line(25, sigY, 95, sigY);
    doc.line(115, sigY, 185, sigY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(termo.employees?.name || 'Colaborador', 60, sigY + 5, { align: "center" });
    doc.text(termo.responsavel_nome || 'Responsável', 150, sigY + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, 60, sigY + 10, { align: "center" });
    doc.text("Almoxarifado", 150, sigY + 10, { align: "center" });
    doc.text("ASSINATURA DO COLABORADOR", 60, sigY + 16, { align: "center" });
    doc.text("ASSINATURA DO RESPONSÁVEL", 150, sigY + 16, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("VIA DO COLABORADOR", 14, 285);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 285, { align: "right" });

    // Second page
    doc.addPage();
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Empresa XYZ Ltda", 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("CNPJ: 00.000.000/0001-00", 14, 21);
    doc.text("Rua Exemplo, 123 - Centro - Cidade/UF", 14, 26);
    doc.text("Tel: (00) 0000-0000", 14, 31);
    
    doc.setFontSize(10);
    doc.text(`Nº ${termo.numero}`, pageWidth - 14, 15, { align: "right" });
    doc.text(`Data: ${format(new Date(termo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - 14, 21, { align: "right" });
    
    doc.setLineWidth(0.5);
    doc.line(14, 36, pageWidth - 14, 36);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE E RECEBIMENTO", pageWidth / 2, 46, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Equipamentos de Proteção Individual (EPIs)", pageWidth / 2, 52, { align: "center" });
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(14, 58, pageWidth - 28, 28);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 58, pageWidth - 28, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DADOS DO COLABORADOR", 18, 63);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${termo.employees?.name || '-'}`, 18, 72);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, pageWidth / 2 + 10, 72);
    doc.text(`Cargo: ${termo.employees?.position || '-'}`, 18, 79);
    doc.text(`Setor: ${termo.employees?.department || '-'}`, pageWidth / 2 + 10, 79);

    // EPIs table for second page with empty rows
    const epiRows2 = termo.termo_epis?.map(item => [
      item.epis?.name || '-',
      item.ca_number || '-',
      item.tamanho || '-',
      item.quantidade.toString(),
      format(new Date(item.data_entrega), 'dd/MM/yyyy'),
      item.data_devolucao ? format(new Date(item.data_devolucao), 'dd/MM/yyyy') : '___/___/______',
      item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy') : '-',
    ]) || [];

    for (let i = 0; i < 5; i++) {
      epiRows2.push(['', '', '', '', '___/___/______', '___/___/______', '___/___/______']);
    }

    autoTable(doc, {
      startY: 92,
      head: [['Item', 'CA', 'Tam.', 'Qtd', 'Entrega', 'Devolução', 'Validade']],
      body: epiRows2,
      headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
      bodyStyles: { fontSize: 9, minCellHeight: 8 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 28, halign: 'center' },
        6: { cellWidth: 27, halign: 'center' },
      },
    });

    finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(14, finalY, pageWidth - 28, 55);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const termsY2 = finalY + 6;
    doc.text("Declaro que recebi os Equipamentos de Proteção Individual (EPIs) discriminados acima, em perfeito estado de", 18, termsY2);
    doc.text("conservação e adequados às minhas medidas.", 18, termsY2 + 4);
    
    doc.setFont("helvetica", "bold");
    doc.text("COMPROMETO-ME A:", 18, termsY2 + 12);
    doc.setFont("helvetica", "normal");
    doc.text("• Utilizar os EPIs durante todo o período de trabalho", 22, termsY2 + 17);
    doc.text("• Guardar e conservar em local adequado", 22, termsY2 + 21);
    doc.text("• Comunicar qualquer alteração que os torne impróprios", 22, termsY2 + 25);
    doc.text("• Responsabilizar-me pela guarda e conservação", 22, termsY2 + 29);
    doc.text("• Devolver em caso de desligamento", 22, termsY2 + 33);
    doc.text("• Ressarcir em caso de dano ou perda por negligência", 22, termsY2 + 37);
    
    doc.setFont("helvetica", "bold");
    doc.text("ESTOU CIENTE DE QUE: O não uso dos EPIs constitui ato faltoso, sujeitando-me às penalidades previstas", 18, termsY2 + 45);
    doc.text("na NR-06 e CLT Art. 158.", 18, termsY2 + 49);

    if (termo.observacoes) {
      finalY = finalY + 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Observações: ${termo.observacoes}`, 14, finalY);
      finalY += 10;
    } else {
      finalY = finalY + 60;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Local e Data: _________________________, ${dateExtended}`, pageWidth / 2, finalY + 10, { align: "center" });

    const sigY2 = finalY + 35;
    doc.setLineWidth(0.3);
    doc.line(25, sigY2, 95, sigY2);
    doc.line(115, sigY2, 185, sigY2);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(termo.employees?.name || 'Colaborador', 60, sigY2 + 5, { align: "center" });
    doc.text(termo.responsavel_nome || 'Responsável', 150, sigY2 + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, 60, sigY2 + 10, { align: "center" });
    doc.text("Almoxarifado", 150, sigY2 + 10, { align: "center" });
    doc.text("ASSINATURA DO COLABORADOR", 60, sigY2 + 16, { align: "center" });
    doc.text("ASSINATURA DO RESPONSÁVEL", 150, sigY2 + 16, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("VIA DA EMPRESA - ARQUIVO", 14, 285);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 285, { align: "right" });

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
          <DeliveryTermPrint termo={termo} />
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
