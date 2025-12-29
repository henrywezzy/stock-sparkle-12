import { useState } from "react";
import { 
  FileText, 
  Search, 
  Check, 
  X, 
  AlertTriangle,
  Package,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  FileCheck,
  FileX,
  HelpCircle,
  Ban,
  Download,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tipos para NF-e
interface NFEItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

interface NFEData {
  chave_acesso: string;
  emitente: {
    nome: string;
    cnpj: string;
  };
  data_emissao: string;
  valor_total: number;
  itens: NFEItem[];
  status_manifestacao?: 'pendente' | 'ciencia' | 'confirmada' | 'desconhecida' | 'nao_realizada';
}

// Manifestação Status
const manifestacaoStatus = {
  pendente: { label: "Pendente", color: "secondary", icon: HelpCircle },
  ciencia: { label: "Ciência", color: "primary", icon: FileCheck },
  confirmada: { label: "Confirmada", color: "success", icon: Check },
  desconhecida: { label: "Desconhecida", color: "destructive", icon: FileX },
  nao_realizada: { label: "Não Realizada", color: "warning", icon: Ban },
};

export default function NFe() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"consultar" | "historico">("consultar");
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nfeData, setNfeData] = useState<NFEData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [manifestacaoTipo, setManifestacaoTipo] = useState<string>("");
  const [historicoNFes, setHistoricoNFes] = useState<NFEData[]>([]);

  // Validar chave de acesso (44 dígitos)
  const isChaveValida = chaveAcesso.replace(/\D/g, "").length === 44;

  // Simular consulta NF-e
  const consultarNFe = async () => {
    if (!isChaveValida) {
      toast({
        title: "Chave inválida",
        description: "A chave de acesso deve conter 44 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Dados simulados
    const mockData: NFEData = {
      chave_acesso: chaveAcesso.replace(/\D/g, ""),
      emitente: {
        nome: "Distribuidora de Materiais LTDA",
        cnpj: "12.345.678/0001-90",
      },
      data_emissao: new Date().toISOString(),
      valor_total: 2850.75,
      itens: [
        {
          codigo: "001",
          descricao: "Parafuso Sextavado M10x50mm",
          quantidade: 500,
          valor_unitario: 0.85,
          subtotal: 425.00,
        },
        {
          codigo: "002",
          descricao: "Porca Sextavada M10",
          quantidade: 500,
          valor_unitario: 0.45,
          subtotal: 225.00,
        },
        {
          codigo: "003",
          descricao: "Arruela Lisa M10",
          quantidade: 1000,
          valor_unitario: 0.15,
          subtotal: 150.00,
        },
        {
          codigo: "004",
          descricao: "Luva de Segurança - Par",
          quantidade: 50,
          valor_unitario: 18.50,
          subtotal: 925.00,
        },
        {
          codigo: "005",
          descricao: "Óculos de Proteção Incolor",
          quantidade: 30,
          valor_unitario: 25.25,
          subtotal: 757.50,
        },
        {
          codigo: "006",
          descricao: "Capacete de Segurança Classe B",
          quantidade: 10,
          valor_unitario: 36.825,
          subtotal: 368.25,
        },
      ],
      status_manifestacao: 'pendente',
    };

    setNfeData(mockData);
    setIsLoading(false);
  };

  // Confirmar manifestação
  const confirmarManifestacao = async (tipo: string) => {
    setManifestacaoTipo(tipo);
    setConfirmDialogOpen(true);
  };

  const executarManifestacao = async () => {
    if (!nfeData) return;

    setIsLoading(true);
    
    // Simular envio para SEFAZ
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusMap: Record<string, NFEData['status_manifestacao']> = {
      ciencia: 'ciencia',
      confirmacao: 'confirmada',
      desconhecimento: 'desconhecida',
      nao_realizada: 'nao_realizada',
    };

    const nfeAtualizada = {
      ...nfeData,
      status_manifestacao: statusMap[manifestacaoTipo],
    };

    setNfeData(nfeAtualizada);
    setHistoricoNFes(prev => {
      const exists = prev.find(n => n.chave_acesso === nfeData.chave_acesso);
      if (exists) {
        return prev.map(n => n.chave_acesso === nfeData.chave_acesso ? nfeAtualizada : n);
      }
      return [nfeAtualizada, ...prev];
    });

    const tipoLabels: Record<string, string> = {
      ciencia: "Ciência da Operação",
      confirmacao: "Confirmação da Operação",
      desconhecimento: "Desconhecimento da Operação",
      nao_realizada: "Operação Não Realizada",
    };

    toast({
      title: "Manifestação registrada!",
      description: `${tipoLabels[manifestacaoTipo]} enviada com sucesso para a SEFAZ.`,
    });

    setIsLoading(false);
    setConfirmDialogOpen(false);
  };

  // Limpar consulta
  const limparConsulta = () => {
    setChaveAcesso("");
    setNfeData(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="NF-e"
        description="Gestão de Notas Fiscais Eletrônicas de entrada"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "NF-e" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "consultar" | "historico")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="consultar" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Consultar NF-e
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultar" className="mt-4 space-y-4">
          {/* Consulta */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Consultar Nota Fiscal
              </CardTitle>
              <CardDescription>
                Digite a chave de acesso da NF-e (44 dígitos) para consultar os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="chave">Chave de Acesso</Label>
                  <Input
                    id="chave"
                    value={chaveAcesso}
                    onChange={(e) => setChaveAcesso(e.target.value)}
                    placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                    className="font-mono text-sm"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {chaveAcesso.replace(/\D/g, "").length}/44 dígitos
                  </p>
                </div>
                <div className="flex gap-2 sm:self-end">
                  <Button
                    onClick={consultarNFe}
                    disabled={!isChaveValida || isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Consultar
                  </Button>
                  {nfeData && (
                    <Button variant="outline" onClick={limparConsulta}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Consulta */}
          {nfeData && (
            <>
              {/* Resumo */}
              <Card className="glass border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {nfeData.emitente.nome}
                      </CardTitle>
                      <CardDescription className="font-mono mt-1">
                        CNPJ: {nfeData.emitente.cnpj}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-sm",
                        nfeData.status_manifestacao === 'confirmada' && "bg-success/20 text-success border-success/30",
                        nfeData.status_manifestacao === 'pendente' && "bg-secondary text-secondary-foreground",
                        nfeData.status_manifestacao === 'ciencia' && "bg-primary/20 text-primary border-primary/30",
                        nfeData.status_manifestacao === 'desconhecida' && "bg-destructive/20 text-destructive border-destructive/30",
                        nfeData.status_manifestacao === 'nao_realizada' && "bg-warning/20 text-warning border-warning/30"
                      )}
                    >
                      {manifestacaoStatus[nfeData.status_manifestacao || 'pendente'].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="glass rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Data Emissão</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(nfeData.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <Package className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Itens</p>
                      <p className="font-semibold text-sm">{nfeData.itens.length}</p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <DollarSign className="w-5 h-5 mx-auto text-success mb-1" />
                      <p className="text-xs text-muted-foreground">Total NF-e</p>
                      <p className="font-semibold text-sm text-success">
                        {formatCurrency(nfeData.valor_total)}
                      </p>
                    </div>
                    <div className="glass rounded-lg p-3 text-center">
                      <FileText className="w-5 h-5 mx-auto text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Chave</p>
                      <p className="font-mono text-xs truncate" title={nfeData.chave_acesso}>
                        ...{nfeData.chave_acesso.slice(-12)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Itens */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Itens da Nota Fiscal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="w-20">Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead className="text-right">Vlr. Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nfeData.itens.map((item, idx) => (
                          <TableRow key={idx} className="border-border">
                            <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                            <TableCell className="font-medium">{item.descricao}</TableCell>
                            <TableCell className="text-center">{item.quantidade}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-border bg-muted/30">
                          <TableCell colSpan={4} className="text-right font-semibold">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-bold text-success">
                            {formatCurrency(nfeData.valor_total)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Ações de Manifestação */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Manifestação do Destinatário
                  </CardTitle>
                  <CardDescription>
                    Selecione a ação de manifestação para esta nota fiscal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/50"
                      onClick={() => confirmarManifestacao('ciencia')}
                      disabled={nfeData.status_manifestacao !== 'pendente'}
                    >
                      <HelpCircle className="w-6 h-6 text-primary" />
                      <span className="text-xs text-center">Ciência da Operação</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2 hover:bg-success/10 hover:border-success/50"
                      onClick={() => confirmarManifestacao('confirmacao')}
                      disabled={nfeData.status_manifestacao === 'confirmada'}
                    >
                      <Check className="w-6 h-6 text-success" />
                      <span className="text-xs text-center">Confirmar Operação</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2 hover:bg-destructive/10 hover:border-destructive/50"
                      onClick={() => confirmarManifestacao('desconhecimento')}
                      disabled={nfeData.status_manifestacao === 'confirmada'}
                    >
                      <X className="w-6 h-6 text-destructive" />
                      <span className="text-xs text-center">Desconhecer Operação</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2 hover:bg-warning/10 hover:border-warning/50"
                      onClick={() => confirmarManifestacao('nao_realizada')}
                      disabled={nfeData.status_manifestacao === 'confirmada'}
                    >
                      <Ban className="w-6 h-6 text-warning" />
                      <span className="text-xs text-center">Op. Não Realizada</span>
                    </Button>
                  </div>
                  
                  {nfeData.status_manifestacao === 'confirmada' && (
                    <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
                      <Check className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium text-success">Operação Confirmada</p>
                        <p className="text-sm text-muted-foreground">
                          Esta nota fiscal já foi confirmada e os itens podem ser lançados no estoque.
                        </p>
                      </div>
                      <Button className="ml-auto bg-success hover:bg-success/90">
                        <Download className="w-4 h-4 mr-2" />
                        Lançar Estoque
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-4">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Histórico de NF-e Manifestadas
              </CardTitle>
              <CardDescription>
                Lista de notas fiscais que passaram por manifestação do destinatário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicoNFes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma NF-e manifestada ainda</p>
                  <p className="text-sm">Consulte e manifeste notas fiscais para vê-las aqui</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Emitente</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoNFes.map((nfe, idx) => {
                        const StatusIcon = manifestacaoStatus[nfe.status_manifestacao || 'pendente'].icon;
                        return (
                          <TableRow key={idx} className="border-border">
                            <TableCell className="font-medium">{nfe.emitente.nome}</TableCell>
                            <TableCell className="font-mono text-sm">{nfe.emitente.cnpj}</TableCell>
                            <TableCell>
                              {format(new Date(nfe.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(nfe.valor_total)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  nfe.status_manifestacao === 'confirmada' && "bg-success/20 text-success border-success/30",
                                  nfe.status_manifestacao === 'ciencia' && "bg-primary/20 text-primary border-primary/30",
                                  nfe.status_manifestacao === 'desconhecida' && "bg-destructive/20 text-destructive border-destructive/30",
                                  nfe.status_manifestacao === 'nao_realizada' && "bg-warning/20 text-warning border-warning/30"
                                )}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {manifestacaoStatus[nfe.status_manifestacao || 'pendente'].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setChaveAcesso(nfe.chave_acesso);
                                  setNfeData(nfe);
                                  setActiveTab("consultar");
                                }}
                              >
                                <Search className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirmar Manifestação
            </DialogTitle>
            <DialogDescription>
              {manifestacaoTipo === 'ciencia' && "Ao registrar Ciência da Operação, você declara que tomou conhecimento da emissão desta NF-e. Esta ação permite baixar o XML completo."}
              {manifestacaoTipo === 'confirmacao' && "Ao confirmar a operação, você declara que a mercadoria foi recebida e está tudo correto. Esta ação é irreversível."}
              {manifestacaoTipo === 'desconhecimento' && "Ao desconhecer a operação, você declara que não reconhece esta nota fiscal. Use apenas se o CNPJ foi utilizado indevidamente."}
              {manifestacaoTipo === 'nao_realizada' && "Ao declarar operação não realizada, você informa que a operação foi cancelada ou a mercadoria foi devolvida."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={executarManifestacao}
              disabled={isLoading}
              className={cn(
                manifestacaoTipo === 'confirmacao' && "bg-success hover:bg-success/90",
                manifestacaoTipo === 'desconhecimento' && "bg-destructive hover:bg-destructive/90",
                manifestacaoTipo === 'nao_realizada' && "bg-warning hover:bg-warning/90 text-warning-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
