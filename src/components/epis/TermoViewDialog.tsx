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
    const margin = 10;
    let currentY = 10;
    
    // Company Header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(company.name, margin, currentY);
    currentY += 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${company.cnpj}`, margin, currentY);
    currentY += 3;
    doc.text(company.address, margin, currentY);
    currentY += 3;
    doc.text(`Tel: ${company.phone}`, margin, currentY);
    
    // Term number and date (right aligned)
    doc.setFontSize(8);
    doc.text(`Nº ${termo.numero}`, pageWidth - margin, 10, { align: "right" });
    doc.text(`Data: ${format(new Date(termo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - margin, 14, { align: "right" });
    
    currentY += 5;
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
    
    // Title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE E RECEBIMENTO", pageWidth / 2, currentY, { align: "center" });
    currentY += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI E UNIFORME", pageWidth / 2, currentY, { align: "center" });
    currentY += 3;
    doc.setFontSize(6);
    doc.text("Conforme NR-06 (Portaria SEPRT nº 915/2019) e Art. 158 da CLT", pageWidth / 2, currentY, { align: "center" });
    currentY += 6;
    
    // Employee box
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 18);
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 5, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("IDENTIFICAÇÃO DO COLABORADOR", margin + 2, currentY + 3.5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Nome: ${termo.employees?.name || '-'}`, margin + 2, currentY + 9);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, pageWidth / 2 + 5, currentY + 9);
    doc.text(`Cargo: ${termo.employees?.position || '-'}`, margin + 2, currentY + 14);
    doc.text(`Setor: ${termo.employees?.department || '-'}`, pageWidth / 2 + 5, currentY + 14);
    currentY += 22;

    // Declaration
    doc.setDrawColor(0);
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'FD');
    doc.setFontSize(6);
    doc.text(
      "Declaro, para todos os fins legais, ter recebido gratuitamente da empresa acima identificada, em perfeito estado de conservação e funcionamento,",
      margin + 2, currentY + 4
    );
    doc.text(
      "os Equipamentos de Proteção Individual (EPI) e Uniformes abaixo discriminados, os quais são adequados aos riscos das atividades desenvolvidas",
      margin + 2, currentY + 8
    );
    doc.text("em minha função na indústria metalmecânica.", margin + 2, currentY + 11);
    currentY += 16;

    // EPIs table
    const epiRows = termo.termo_epis?.map(item => [
      item.epis?.name || '-',
      item.ca_number || item.epis?.ca_number || '-',
      item.tamanho || '-',
      item.quantidade.toString(),
      format(new Date(item.data_entrega), 'dd/MM/yy'),
      item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yy') : '___/___/____',
      item.data_devolucao ? format(new Date(item.data_devolucao), 'dd/MM/yy') : '___/___/____',
      '',
    ]) || [];

    // Add empty rows for manual additions
    const emptyRowsCount = Math.max(5, 8 - epiRows.length);
    for (let i = 0; i < emptyRowsCount; i++) {
      epiRows.push(['', '', '', '', '___/___/____', '___/___/____', '___/___/____', '']);
    }

    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO EPI/UNIFORME', 'Nº C.A.', 'TAM.', 'QTD', 'ENTREGA', 'VALIDADE', 'DEVOLUÇÃO', 'ASS.']],
      body: epiRows,
      headStyles: { fillColor: [80, 80, 80], fontSize: 6, cellPadding: 1.5 },
      bodyStyles: { fontSize: 6, cellPadding: 1.5, minCellHeight: 5 },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 10, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 24, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    currentY = (doc as any).lastAutoTable.finalY + 3;

    // Obligations Section
    const obligationsBoxHeight = 68;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, pageWidth - (margin * 2), obligationsBoxHeight);

    // Employee Obligations
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 4, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("OBRIGAÇÕES DO COLABORADOR (NR-06, item 6.7)", margin + 2, currentY + 2.8);
    let oblY = currentY + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text("a) Utilizar o EPI apenas para a finalidade a que se destina, durante toda a jornada de trabalho;", margin + 4, oblY);
    doc.text("b) Responsabilizar-se pela guarda e conservação do EPI que lhe foi confiado;", margin + 4, oblY + 3);
    doc.text("c) Comunicar imediatamente ao empregador qualquer alteração que torne o EPI impróprio para uso;", margin + 4, oblY + 6);
    doc.text("d) Cumprir as determinações do empregador sobre o uso adequado do EPI;", margin + 4, oblY + 9);
    doc.text("e) Devolver o EPI ao empregador quando solicitado ou em caso de rescisão do contrato de trabalho;", margin + 4, oblY + 12);
    doc.text("f) Submeter-se ao treinamento sobre uso correto, guarda e conservação do EPI.", margin + 4, oblY + 15);

    // Employer Obligations
    let empY = oblY + 20;
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, empY - 2.5, pageWidth - (margin * 2), 4, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("RESPONSABILIDADES DO EMPREGADOR (NR-06, item 6.6)", margin + 2, empY);
    empY += 3;
    doc.setFont("helvetica", "normal");
    doc.text("a) Adquirir o EPI adequado ao risco de cada atividade;", margin + 4, empY);
    doc.text("b) Exigir seu uso e fornecer ao trabalhador somente EPI aprovado pelo órgão nacional competente;", margin + 4, empY + 3);
    doc.text("c) Orientar e treinar o trabalhador sobre o uso adequado, guarda e conservação;", margin + 4, empY + 6);
    doc.text("d) Substituir imediatamente quando danificado ou extraviado;", margin + 4, empY + 9);
    doc.text("e) Higienizar e realizar manutenção periódica, quando aplicável.", margin + 4, empY + 12);

    // Policy
    let polY = empY + 17;
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, polY - 2.5, pageWidth - (margin * 2), 4, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("POLÍTICA DE USO, CONSERVAÇÃO, TROCA E DEVOLUÇÃO", margin + 2, polY);
    polY += 3;
    doc.setFont("helvetica", "normal");
    doc.text("• A troca será realizada mediante apresentação do EPI danificado ou desgastado pelo uso normal;", margin + 4, polY);
    doc.text("• EPIs danificados por mau uso, negligência ou extravio poderão ser descontados conforme Art. 462 da CLT;", margin + 4, polY + 3);
    doc.text("• Uniformes são de uso exclusivo nas dependências da empresa e em serviço externo autorizado;", margin + 4, polY + 6);
    doc.text("• A devolução é obrigatória na rescisão contratual, afastamento ou quando solicitado pela empresa.", margin + 4, polY + 9);

    currentY += obligationsBoxHeight + 2;

    // Consequences box
    doc.setFillColor(255, 248, 225);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 14, 'FD');
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 4, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("CONSEQUÊNCIAS DO NÃO USO OU USO INADEQUADO", margin + 2, currentY + 2.8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(
      "Conforme NR-06 (item 6.7.1) e Art. 158, parágrafo único, da CLT, constitui ato faltoso a recusa injustificada do empregado em usar o EPI fornecido.",
      margin + 2, currentY + 7
    );
    doc.text(
      "O descumprimento poderá acarretar sanções disciplinares progressivas: advertência verbal, advertência escrita, suspensão e dispensa por justa causa.",
      margin + 2, currentY + 10.5
    );
    currentY += 17;

    // Observations
    if (termo.observacoes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`Observações: ${termo.observacoes}`, margin, currentY);
      currentY += 5;
    }

    // Final Declaration
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'FD');
    doc.setFontSize(5.5);
    doc.text(
      "Declaro ter recebido treinamento sobre o uso correto, guarda e conservação dos EPIs acima relacionados, estando ciente de que o não cumprimento",
      margin + 2, currentY + 3
    );
    doc.text(
      "das normas de segurança constitui ato faltoso sujeito às penalidades previstas em lei. Este termo é válido para auditorias e fiscalizações trabalhistas.",
      margin + 2, currentY + 6.5
    );
    currentY += 14;

    // Date line
    const dateExtended = format(new Date(termo.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Local e Data: ______________________________________________, ${dateExtended}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Signatures
    doc.setLineWidth(0.3);
    doc.line(margin + 10, currentY, margin + 75, currentY);
    doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 10, currentY);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(termo.employees?.name || 'Colaborador', margin + 42.5, currentY + 4, { align: "center" });
    doc.text(termo.responsavel_nome || 'Responsável', pageWidth - margin - 42.5, currentY + 4, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(`Matrícula: ${termo.employees?.registration_number || '-'}`, margin + 42.5, currentY + 7, { align: "center" });
    doc.text("COLABORADOR", margin + 42.5, currentY + 10, { align: "center" });
    doc.text("RESPONSÁVEL PELA ENTREGA / ALMOXARIFADO", pageWidth - margin - 42.5, currentY + 7, { align: "center" });

    // Footer
    doc.setFontSize(5);
    doc.setTextColor(100);
    doc.text(`Documento gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} | Válido para auditorias e fiscalizações | Ref: ${termo.numero}`, pageWidth / 2, pageHeight - 6, { align: "center" });

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