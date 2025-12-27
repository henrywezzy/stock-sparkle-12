import { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Printer, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useEPIs, EPI } from "@/hooks/useEPIs";
import { useTermosEntrega, TermoEntrega } from "@/hooks/useTermosEntrega";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { DeliveryTermPrint } from "./DeliveryTermPrint";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EPIItem {
  epi_id: string;
  epi_name: string;
  ca_number: string;
  tamanho: string;
  quantidade: number;
  data_entrega: string;
  data_validade: string;
}

interface DeliveryTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryTermDialog({ open, onOpenChange }: DeliveryTermDialogProps) {
  const { employees } = useEmployees();
  const { epis } = useEPIs();
  const { createTermo } = useTermosEntrega();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [epiItems, setEpiItems] = useState<EPIItem[]>([]);
  const [createdTermo, setCreatedTermo] = useState<TermoEntrega | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('form');
      setSelectedEmployeeId("");
      setObservacoes("");
      setEpiItems([]);
      setCreatedTermo(null);
    }
  }, [open]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const addEPIItem = () => {
    const today = new Date().toISOString().split('T')[0];
    setEpiItems([...epiItems, {
      epi_id: "",
      epi_name: "",
      ca_number: "",
      tamanho: "",
      quantidade: 1,
      data_entrega: today,
      data_validade: "",
    }]);
  };

  const updateEPIItem = (index: number, field: keyof EPIItem, value: string | number) => {
    const updated = [...epiItems];
    updated[index] = { ...updated[index], [field]: value };

    // If EPI is selected, auto-fill CA and calculate validity
    if (field === 'epi_id' && value) {
      const epi = epis.find(e => e.id === value);
      if (epi) {
        updated[index].epi_name = epi.name;
        updated[index].ca_number = epi.ca_number || "";
        if (epi.default_validity_days) {
          const deliveryDate = new Date(updated[index].data_entrega);
          updated[index].data_validade = addDays(deliveryDate, epi.default_validity_days).toISOString().split('T')[0];
        }
      }
    }

    // Recalculate validity when delivery date changes
    if (field === 'data_entrega' && value) {
      const epi = epis.find(e => e.id === updated[index].epi_id);
      if (epi?.default_validity_days) {
        updated[index].data_validade = addDays(new Date(value as string), epi.default_validity_days).toISOString().split('T')[0];
      }
    }

    setEpiItems(updated);
  };

  const removeEPIItem = (index: number) => {
    setEpiItems(epiItems.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!selectedEmployeeId) {
      toast({ title: "Selecione um funcionário", variant: "destructive" });
      return false;
    }
    if (epiItems.length === 0) {
      toast({ title: "Adicione pelo menos um EPI", variant: "destructive" });
      return false;
    }
    for (const item of epiItems) {
      if (!item.epi_id) {
        toast({ title: "Selecione todos os EPIs", variant: "destructive" });
        return false;
      }
      const epi = epis.find(e => e.id === item.epi_id);
      if (epi && epi.quantity < item.quantidade) {
        toast({ 
          title: "Estoque insuficiente", 
          description: `${epi.name} possui apenas ${epi.quantity} unidades em estoque.`,
          variant: "destructive" 
        });
        return false;
      }
    }
    return true;
  };

  const handleGenerateTermo = async () => {
    if (!validateForm()) return;

    try {
      await createTermo.mutateAsync({
        employee_id: selectedEmployeeId,
        responsavel_nome: user?.email?.split('@')[0] || "Almoxarife",
        observacoes,
        epis: epiItems.map(item => ({
          epi_id: item.epi_id,
          ca_number: item.ca_number,
          tamanho: item.tamanho,
          quantidade: item.quantidade,
          data_entrega: item.data_entrega,
          data_validade: item.data_validade || undefined,
        })),
      });

      // Create a mock termo for preview
      setCreatedTermo({
        id: 'preview',
        numero: `TERMO-${new Date().getFullYear()}-XXXXX`,
        employee_id: selectedEmployeeId,
        data_emissao: new Date().toISOString().split('T')[0],
        responsavel_nome: user?.email?.split('@')[0] || "Almoxarife",
        observacoes,
        status: 'pendente',
        created_at: new Date().toISOString(),
        employees: selectedEmployee ? {
          name: selectedEmployee.name,
          department: selectedEmployee.department,
          position: selectedEmployee.position,
          registration_number: selectedEmployee.registration_number,
          email: selectedEmployee.email,
          phone: selectedEmployee.phone,
        } : null,
        termo_epis: epiItems.map((item, index) => ({
          id: `preview-${index}`,
          termo_id: 'preview',
          epi_id: item.epi_id,
          ca_number: item.ca_number,
          tamanho: item.tamanho,
          quantidade: item.quantidade,
          data_entrega: item.data_entrega,
          data_validade: item.data_validade,
          data_devolucao: null,
          created_at: new Date().toISOString(),
          epis: { name: item.epi_name, ca_number: item.ca_number },
        })),
      });

      setStep('preview');
    } catch (error) {
      console.error('Error creating termo:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!createdTermo) return;

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
    doc.text(`Nº ${createdTermo.numero}`, pageWidth - 14, 15, { align: "right" });
    doc.text(`Data: ${format(new Date(createdTermo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - 14, 21, { align: "right" });
    
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
    doc.text(`Nome: ${createdTermo.employees?.name || '-'}`, 18, 72);
    doc.text(`Matrícula: ${createdTermo.employees?.registration_number || '-'}`, pageWidth / 2 + 10, 72);
    doc.text(`Cargo: ${createdTermo.employees?.position || '-'}`, 18, 79);
    doc.text(`Setor: ${createdTermo.employees?.department || '-'}`, pageWidth / 2 + 10, 79);

    // EPIs table
    autoTable(doc, {
      startY: 92,
      head: [['Item', 'CA', 'Tam.', 'Qtd', 'Entrega', 'Validade', 'Devolução']],
      body: createdTermo.termo_epis?.map(item => [
        item.epis?.name || '-',
        item.ca_number || '-',
        item.tamanho || '-',
        item.quantidade.toString(),
        format(new Date(item.data_entrega), 'dd/MM/yyyy'),
        item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy') : '-',
        '___/___/______',
      ]) || [],
      headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
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

    // Observations
    if (createdTermo.observacoes) {
      finalY = finalY + 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Observações: ${createdTermo.observacoes}`, 14, finalY);
      finalY += 10;
    } else {
      finalY = finalY + 60;
    }

    // Date line
    const dateExtended = format(new Date(createdTermo.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Local e Data: _________________________, ${dateExtended}`, pageWidth / 2, finalY + 10, { align: "center" });

    // Signatures
    const sigY = finalY + 35;
    doc.setLineWidth(0.3);
    doc.line(25, sigY, 95, sigY);
    doc.line(115, sigY, 185, sigY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(createdTermo.employees?.name || 'Colaborador', 60, sigY + 5, { align: "center" });
    doc.text(createdTermo.responsavel_nome || 'Responsável', 150, sigY + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Matrícula: ${createdTermo.employees?.registration_number || '-'}`, 60, sigY + 10, { align: "center" });
    doc.text("Almoxarifado", 150, sigY + 10, { align: "center" });
    doc.text("ASSINATURA DO COLABORADOR", 60, sigY + 16, { align: "center" });
    doc.text("ASSINATURA DO RESPONSÁVEL", 150, sigY + 16, { align: "center" });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("VIA DO COLABORADOR", 14, 285);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 285, { align: "right" });

    // Second page (company copy)
    doc.addPage();
    
    // Repeat header for second page
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
    doc.text(`Nº ${createdTermo.numero}`, pageWidth - 14, 15, { align: "right" });
    doc.text(`Data: ${format(new Date(createdTermo.data_emissao), 'dd/MM/yyyy')}`, pageWidth - 14, 21, { align: "right" });
    
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
    doc.text(`Nome: ${createdTermo.employees?.name || '-'}`, 18, 72);
    doc.text(`Matrícula: ${createdTermo.employees?.registration_number || '-'}`, pageWidth / 2 + 10, 72);
    doc.text(`Cargo: ${createdTermo.employees?.position || '-'}`, 18, 79);
    doc.text(`Setor: ${createdTermo.employees?.department || '-'}`, pageWidth / 2 + 10, 79);

    autoTable(doc, {
      startY: 92,
      head: [['Item', 'CA', 'Tam.', 'Qtd', 'Entrega', 'Validade', 'Devolução']],
      body: createdTermo.termo_epis?.map(item => [
        item.epis?.name || '-',
        item.ca_number || '-',
        item.tamanho || '-',
        item.quantidade.toString(),
        format(new Date(item.data_entrega), 'dd/MM/yyyy'),
        item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy') : '-',
        '___/___/______',
      ]) || [],
      headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
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

    if (createdTermo.observacoes) {
      finalY = finalY + 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Observações: ${createdTermo.observacoes}`, 14, finalY);
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
    doc.text(createdTermo.employees?.name || 'Colaborador', 60, sigY2 + 5, { align: "center" });
    doc.text(createdTermo.responsavel_nome || 'Responsável', 150, sigY2 + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Matrícula: ${createdTermo.employees?.registration_number || '-'}`, 60, sigY2 + 10, { align: "center" });
    doc.text("Almoxarifado", 150, sigY2 + 10, { align: "center" });
    doc.text("ASSINATURA DO COLABORADOR", 60, sigY2 + 16, { align: "center" });
    doc.text("ASSINATURA DO RESPONSÁVEL", 150, sigY2 + 16, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("VIA DA EMPRESA - ARQUIVO", 14, 285);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 285, { align: "right" });

    doc.save(`termo-epi-${createdTermo.employees?.registration_number || 'sem-matricula'}-${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast({ title: "PDF gerado", description: "O arquivo foi baixado com sucesso." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={step === 'preview' ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-2xl"}>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Novo Termo de Entrega de EPI</DialogTitle>
              <DialogDescription>
                Selecione o funcionário e adicione os EPIs a serem entregues
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label>Funcionário *</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === 'active').map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.registration_number || 'Sem matrícula'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEmployee && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.position} • {selectedEmployee.department}
                  </p>
                )}
              </div>

              {/* EPIs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>EPIs a entregar *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEPIItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar EPI
                  </Button>
                </div>

                {epiItems.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
                    Clique em "Adicionar EPI" para incluir itens
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {epiItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => removeEPIItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Select 
                              value={item.epi_id} 
                              onValueChange={(v) => updateEPIItem(index, 'epi_id', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o EPI" />
                              </SelectTrigger>
                              <SelectContent>
                                {epis.filter(e => e.quantity > 0).map(epi => (
                                  <SelectItem key={epi.id} value={epi.id}>
                                    {epi.name} (Estoque: {epi.quantity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input 
                            placeholder="CA" 
                            value={item.ca_number}
                            onChange={(e) => updateEPIItem(index, 'ca_number', e.target.value)}
                          />
                          <Input 
                            placeholder="Tamanho" 
                            value={item.tamanho}
                            onChange={(e) => updateEPIItem(index, 'tamanho', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            min={1}
                            value={item.quantidade}
                            onChange={(e) => updateEPIItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                          />
                          <Input 
                            type="date" 
                            value={item.data_entrega}
                            onChange={(e) => updateEPIItem(index, 'data_entrega', e.target.value)}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Validade: {item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy', { locale: ptBR }) : 'Não calculada'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea 
                  placeholder="Observações adicionais (opcional)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateTermo} disabled={createTermo.isPending}>
                {createTermo.isPending ? "Gerando..." : "Gerar Termo"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="no-print">
              <DialogTitle>Preview do Termo</DialogTitle>
              <DialogDescription>
                Visualize e imprima o termo de entrega
              </DialogDescription>
            </DialogHeader>

            <div ref={printRef}>
              {createdTermo && <DeliveryTermPrint termo={createdTermo} />}
            </div>

            <DialogFooter className="no-print gap-2">
              <Button variant="outline" onClick={() => setStep('form')}>
                Voltar
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
