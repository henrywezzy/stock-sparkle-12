import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NFEItem {
  numero_item: string;
  codigo_produto: string;
  descricao: string;
  quantidade_comercial: number;
  valor_unitario_comercial: number;
  valor_bruto: number;
  unidade_comercial: string;
  ncm?: string;
  cfop?: string;
}

export interface NFEData {
  chave_nfe: string;
  status: string;
  numero: string;
  serie: string;
  data_emissao: string;
  nome_emitente: string;
  cnpj_emitente: string;
  nome_destinatario?: string;
  cnpj_destinatario?: string;
  valor_total: number;
  itens: NFEItem[];
  status_manifestacao?: 'pendente' | 'ciencia' | 'confirmada' | 'desconhecida' | 'nao_realizada';
}

export type ManifestacaoTipo = 'ciencia' | 'confirmacao' | 'desconhecimento' | 'nao_realizada';

export function useNFe() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const consultarNFe = async (chaveAcesso: string): Promise<NFEData | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('focus-nfe', {
        body: { 
          action: 'consultar',
          chave_acesso: chaveAcesso 
        }
      });

      if (error) {
        console.error('Error consulting NFe:', error);
        toast({
          title: "Erro ao consultar NF-e",
          description: error.message || "Não foi possível consultar a nota fiscal.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.error) {
        toast({
          title: "NF-e não encontrada",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      // Transform Focus NFe response to our format
      const nfeData: NFEData = {
        chave_nfe: data.chave_nfe || chaveAcesso.replace(/\D/g, ''),
        status: data.status || 'autorizada',
        numero: data.numero || '',
        serie: data.serie || '',
        data_emissao: data.data_emissao || new Date().toISOString(),
        nome_emitente: data.nome_emitente || 'Emitente não identificado',
        cnpj_emitente: data.cnpj_emitente || '',
        nome_destinatario: data.nome_destinatario,
        cnpj_destinatario: data.cnpj_destinatario,
        valor_total: data.valor_total || 0,
        itens: (data.itens || []).map((item: any) => ({
          numero_item: item.numero_item || '',
          codigo_produto: item.codigo_produto || item.codigo || '',
          descricao: item.descricao || '',
          quantidade_comercial: item.quantidade_comercial || item.quantidade || 0,
          valor_unitario_comercial: item.valor_unitario_comercial || item.valor_unitario || 0,
          valor_bruto: item.valor_bruto || item.subtotal || 0,
          unidade_comercial: item.unidade_comercial || item.unidade || 'UN',
          ncm: item.ncm,
          cfop: item.cfop,
        })),
        status_manifestacao: data.status_manifestacao || 'pendente',
      };

      return nfeData;
    } catch (error) {
      console.error('Error consulting NFe:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const manifestarNFe = async (
    chaveAcesso: string, 
    tipo: ManifestacaoTipo
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('focus-nfe', {
        body: {
          action: 'manifestar',
          chave_acesso: chaveAcesso,
          tipo_manifestacao: tipo,
        }
      });

      if (error) {
        console.error('Error manifesting NFe:', error);
        toast({
          title: "Erro ao manifestar NF-e",
          description: error.message || "Não foi possível registrar a manifestação.",
          variant: "destructive",
        });
        return false;
      }

      if (data?.error) {
        toast({
          title: "Erro na manifestação",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      const tipoLabels: Record<string, string> = {
        ciencia: "Ciência da Operação",
        confirmacao: "Confirmação da Operação",
        desconhecimento: "Desconhecimento da Operação",
        nao_realizada: "Operação Não Realizada",
      };

      toast({
        title: "Manifestação registrada!",
        description: `${tipoLabels[tipo]} enviada com sucesso para a SEFAZ.`,
      });

      return true;
    } catch (error) {
      console.error('Error manifesting NFe:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const listarNFesRecebidas = async (): Promise<NFEData[]> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('focus-nfe', {
        body: { action: 'listar_recebidas' }
      });

      if (error) {
        console.error('Error listing NFes:', error);
        toast({
          title: "Erro ao listar NF-es",
          description: error.message || "Não foi possível obter a lista de notas.",
          variant: "destructive",
        });
        return [];
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error listing NFes:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const downloadXML = async (chaveAcesso: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('focus-nfe', {
        body: {
          action: 'download_xml',
          chave_acesso: chaveAcesso,
        }
      });

      if (error || data?.error) {
        toast({
          title: "Erro ao baixar XML",
          description: error?.message || data?.error || "Não foi possível baixar o XML.",
          variant: "destructive",
        });
        return null;
      }

      return data.xml;
    } catch (error) {
      console.error('Error downloading XML:', error);
      return null;
    }
  };

  return {
    isLoading,
    consultarNFe,
    manifestarNFe,
    listarNFesRecebidas,
    downloadXML,
  };
}
