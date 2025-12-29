import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { NFEData, NFEItem } from "@/hooks/useNFe";

export interface NFeHistoryRecord {
  id: string;
  chave_acesso: string;
  numero: string | null;
  serie: string | null;
  data_emissao: string | null;
  nome_emitente: string | null;
  cnpj_emitente: string | null;
  nome_destinatario: string | null;
  cnpj_destinatario: string | null;
  valor_total: number | null;
  status_manifestacao: string | null;
  xml_path: string | null;
  pdf_path: string | null;
  itens: unknown;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export function useNFeHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch history
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["nfe-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfe_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Cast needed because JSONB column has unknown shape at DB level
      return (data ?? []) as NFeHistoryRecord[];
    },
  });

  // Save NF-e to history
  const saveToHistory = useMutation({
    mutationFn: async ({
      nfeData,
      xmlContent,
    }: {
      nfeData: NFEData;
      xmlContent?: string;
    }) => {
      let xmlPath: string | null = null;

      // Upload XML if provided
      if (xmlContent) {
        const fileName = `xml/${nfeData.chave_nfe}.xml`;
        const { error: uploadError } = await supabase.storage
          .from("nfe-files")
          .upload(fileName, new Blob([xmlContent], { type: "application/xml" }), {
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro ao fazer upload do XML:", uploadError);
        } else {
          xmlPath = fileName;
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Upsert to history table
      const { data, error } = await supabase
        .from("nfe_history")
        .upsert(
          {
            chave_acesso: nfeData.chave_nfe,
            numero: nfeData.numero || null,
            serie: nfeData.serie || null,
            data_emissao: nfeData.data_emissao || null,
            nome_emitente: nfeData.nome_emitente || null,
            cnpj_emitente: nfeData.cnpj_emitente || null,
            nome_destinatario: nfeData.nome_destinatario || null,
            cnpj_destinatario: nfeData.cnpj_destinatario || null,
            valor_total: nfeData.valor_total || 0,
            status_manifestacao: nfeData.status_manifestacao || "pendente",
            xml_path: xmlPath,
            itens: nfeData.itens as any,
            source: nfeData.status || "xml",
            created_by: user?.id || null,
          },
          { onConflict: "chave_acesso" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfe-history"] });
      toast({
        title: "NF-e salva",
        description: "A NF-e foi salva no histórico com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar NF-e",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download XML from storage
  const downloadXmlFromStorage = async (
    xmlPath: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("nfe-files")
        .download(xmlPath);

      if (error) throw error;
      return await data.text();
    } catch (error) {
      console.error("Erro ao baixar XML:", error);
      return null;
    }
  };

  // Get signed URL for download
  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("nfe-files")
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Erro ao gerar URL de download:", error);
      return null;
    }
  };

  // Process DANFE PDF with OCR
  const processDanfePdf = async (file: File): Promise<NFEData | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("ocr-danfe", {
        body: formData,
      });

      if (error) {
        console.error("Erro ao processar DANFE:", error);
        toast({
          title: "Erro ao processar DANFE",
          description: error.message || "Não foi possível extrair dados do PDF.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.error) {
        toast({
          title: "Erro no OCR",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "DANFE processado",
        description: "Dados extraídos do PDF com sucesso.",
      });

      return data as NFEData;
    } catch (error) {
      console.error("Erro ao processar DANFE:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Find existing record by chave
  const findByChave = (chave: string): NFeHistoryRecord | undefined => {
    return history.find((h) => h.chave_acesso === chave.replace(/\D/g, ""));
  };

  return {
    history,
    isLoading,
    isUploading,
    saveToHistory,
    downloadXmlFromStorage,
    getDownloadUrl,
    processDanfePdf,
    findByChave,
  };
}
