import { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Printer, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
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
import { useEPIs } from "@/hooks/useEPIs";
import { useTermosEntrega } from "@/hooks/useTermosEntrega";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { DeliveryTermPrint } from "./DeliveryTermPrint";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface EPIItem {
  epi_id: string;
  epi_name: string;
  ca_number: string;
  tamanho: string;
  quantidade: number;
  data_entrega: string;
  data_validade: string;
}

interface TermoEmployee {
  name: string;
  department: string | null;
  position: string | null;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
}

interface TermoEPIItem {
  id: string;
  termo_id: string;
  epi_id: string;
  ca_number: string | null;
  tamanho: string | null;
  quantidade: number;
  data_entrega: string;
  data_validade: string | null;
  data_devolucao: string | null;
  created_at: string;
  epis?: { name: string; ca_number: string | null } | null;
}

interface TermoData {
  id: string;
  numero: string;
  employee_id: string;
  data_emissao: string;
  responsavel_nome: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string;
  employees?: TermoEmployee | null;
  termo_epis?: TermoEPIItem[];
}

interface DeliveryTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryTermDialog({ open, onOpenChange }: DeliveryTermDialogProps) {
  const { employees } = useEmployees();
  const { epis } = useEPIs();
  const { createTermo } = useTermosEntrega();
  const { settings: companySettings } = useCompanySettings();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [epiItems, setEpiItems] = useState<EPIItem[]>([]);
  const [createdTermo, setCreatedTermo] = useState<TermoData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

      setCreatedTermo({
        id: 'preview',
        numero: `TERMO-${new Date().getFullYear()}-XXXXX`,
        employee_id: selectedEmployeeId,
        data_emissao: new Date().toISOString().split('T')[0],
        responsavel_nome: user?.email?.split('@')[0] || "Almoxarife",
        observacoes,
        status: null,
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

  const handleDownloadPDF = async () => {
    if (!printRef.current || !createdTermo) return;

    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 8;
      const pageHeight = pdfHeight - 16;
      
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `termo-epi-${createdTermo.employees?.registration_number || 'sem-matricula'}-${format(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);
      toast({ title: "PDF gerado", description: "O arquivo foi baixado com sucesso." });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={step === 'preview' ? "termo-dialog max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible" : "max-w-2xl"}>
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
                      <div key={index} className="border rounded-lg p-3 space-y-3 bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
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
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeEPIItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">CA</Label>
                            <Input 
                              value={item.ca_number} 
                              onChange={(e) => updateEPIItem(index, 'ca_number', e.target.value)}
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Tamanho</Label>
                            <Select 
                              value={item.tamanho} 
                              onValueChange={(v) => updateEPIItem(index, 'tamanho', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tam" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PP">PP</SelectItem>
                                <SelectItem value="P">P</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="G">G</SelectItem>
                                <SelectItem value="GG">GG</SelectItem>
                                <SelectItem value="XG">XG</SelectItem>
                                <SelectItem value="34">34</SelectItem>
                                <SelectItem value="35">35</SelectItem>
                                <SelectItem value="36">36</SelectItem>
                                <SelectItem value="37">37</SelectItem>
                                <SelectItem value="38">38</SelectItem>
                                <SelectItem value="39">39</SelectItem>
                                <SelectItem value="40">40</SelectItem>
                                <SelectItem value="41">41</SelectItem>
                                <SelectItem value="42">42</SelectItem>
                                <SelectItem value="43">43</SelectItem>
                                <SelectItem value="44">44</SelectItem>
                                <SelectItem value="Único">Único</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Qtd</Label>
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantidade} 
                              onChange={(e) => updateEPIItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Entrega</Label>
                            <DateInput 
                              value={item.data_entrega} 
                              onChange={(date) => updateEPIItem(index, 'data_entrega', date)}
                              showPicker={false}
                            />
                          </div>
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

            <div ref={printRef} className="print-content">
              {createdTermo && <DeliveryTermPrint termo={createdTermo} companySettings={companySettings} />}
            </div>

            <DialogFooter className="no-print gap-2">
              <Button variant="outline" onClick={() => setStep('form')}>
                Voltar
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
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
