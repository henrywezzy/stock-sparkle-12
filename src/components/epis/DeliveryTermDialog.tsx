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
    
    // Header
    doc.setFontSize(16);
    doc.text("Termo de Responsabilidade e Recebimento", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Equipamentos de Proteção Individual (EPIs)", 105, 27, { align: "center" });
    
    // Employee info
    doc.setFontSize(12);
    doc.text("Dados do Colaborador", 14, 40);
    doc.setFontSize(10);
    doc.text(`Nome: ${createdTermo.employees?.name || '-'}`, 14, 48);
    doc.text(`Matrícula: ${createdTermo.employees?.registration_number || '-'}`, 14, 54);
    doc.text(`Cargo: ${createdTermo.employees?.position || '-'}`, 14, 60);
    doc.text(`Setor: ${createdTermo.employees?.department || '-'}`, 120, 54);

    // EPIs table
    autoTable(doc, {
      startY: 70,
      head: [['Item', 'CA', 'Tam.', 'Qtd', 'Entrega', 'Validade']],
      body: createdTermo.termo_epis?.map(item => [
        item.epis?.name || '-',
        item.ca_number || '-',
        item.tamanho || '-',
        item.quantidade.toString(),
        format(new Date(item.data_entrega), 'dd/MM/yyyy'),
        item.data_validade ? format(new Date(item.data_validade), 'dd/MM/yyyy') : '-',
      ]) || [],
    });

    // Terms text
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    const termsText = "Declaro que recebi os Equipamentos de Proteção Individual (EPIs) discriminados acima, em perfeito estado de conservação e adequados às minhas medidas. COMPROMETO-ME A: Utilizar os EPIs durante todo o período de trabalho; Guardar e conservar em local adequado; Comunicar qualquer alteração que os torne impróprios; Responsabilizar-me pela guarda e conservação; Devolver em caso de desligamento; Ressarcir em caso de dano ou perda por negligência. ESTOU CIENTE DE QUE: O não uso dos EPIs constitui ato faltoso, sujeitando-me às penalidades previstas na NR-06 e CLT Art. 158.";
    doc.text(termsText, 14, finalY, { maxWidth: 180 });

    // Signatures
    doc.setFontSize(10);
    doc.text("_______________________________", 30, 250);
    doc.text("Assinatura do Colaborador", 40, 256);
    doc.text("_______________________________", 120, 250);
    doc.text("Assinatura do Responsável", 128, 256);

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
