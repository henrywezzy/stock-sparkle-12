import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Focus NFe API endpoints
const FOCUS_API_URL = Deno.env.get('FOCUS_NFE_AMBIENTE') === 'producao' 
  ? 'https://api.focusnfe.com.br' 
  : 'https://homologacao.focusnfe.com.br';

const FOCUS_TOKEN = Deno.env.get('FOCUS_NFE_TOKEN');

interface NFEItem {
  numero_item: string;
  codigo_produto: string;
  descricao: string;
  quantidade_comercial: number;
  valor_unitario_comercial: number;
  valor_bruto: number;
  unidade_comercial: string;
  ncm: string;
  cfop: string;
}

interface NFEResponse {
  chave_nfe: string;
  status: string;
  numero: string;
  serie: string;
  protocolo: string;
  data_emissao: string;
  nome_emitente: string;
  cnpj_emitente: string;
  nome_destinatario?: string;
  cnpj_destinatario?: string;
  valor_total: number;
  itens: NFEItem[];
  status_sefaz?: string;
  mensagem_sefaz?: string;
}

// Helper to escape HTML and prevent XSS
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate access key format (44 digits)
function validateChaveAcesso(chave: string): boolean {
  const cleanChave = chave.replace(/\D/g, '');
  return cleanChave.length === 44;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client and verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role (admin or almoxarife)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, approved')
      .eq('user_id', user.id)
      .single();

    if (!roleData?.approved || !['admin', 'almoxarife'].includes(roleData.role)) {
      console.error('User lacks required role');
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Focus NFe token is configured
    if (!FOCUS_TOKEN) {
      console.error('FOCUS_NFE_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Focus NFe API not configured. Please add FOCUS_NFE_TOKEN secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, chave_acesso, tipo_manifestacao } = await req.json();

    console.log(`Focus NFe action: ${action}, chave: ${chave_acesso?.substring(0, 10)}...`);

    // Validate chave_acesso for actions that require it
    if (['consultar', 'manifestar', 'download_xml'].includes(action)) {
      if (!chave_acesso || !validateChaveAcesso(chave_acesso)) {
        return new Response(
          JSON.stringify({ error: 'Invalid chave_acesso. Must be 44 digits.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const cleanChave = chave_acesso?.replace(/\D/g, '') || '';

    switch (action) {
      case 'consultar': {
        // Consultar NF-e pela chave de acesso
        const response = await fetch(`${FOCUS_API_URL}/v2/nfes_recebidas/${cleanChave}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(FOCUS_TOKEN + ':')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe API error:', response.status, errorText);
          
          // Try alternative endpoint for NFe lookup
          const altResponse = await fetch(`${FOCUS_API_URL}/v2/nfes/${cleanChave}`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(FOCUS_TOKEN + ':')}`,
              'Content-Type': 'application/json',
            },
          });

          if (!altResponse.ok) {
            return new Response(
              JSON.stringify({ 
                error: 'NF-e não encontrada ou não autorizada para consulta.',
                details: escapeHtml(errorText)
              }),
              { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const altData = await altResponse.json();
          return new Response(
            JSON.stringify(altData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_recebidas': {
        // Listar NF-es recebidas (destinadas à empresa)
        const cnpj = Deno.env.get('FOCUS_NFE_CNPJ') || '';
        
        const response = await fetch(`${FOCUS_API_URL}/v2/nfes_recebidas?cnpj=${cnpj}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(FOCUS_TOKEN + ':')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe API error:', response.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Erro ao listar NF-es recebidas', details: escapeHtml(errorText) }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'manifestar': {
        // Tipos de manifestação: ciencia, confirmacao, desconhecimento, nao_realizada
        const validTipos = ['ciencia', 'confirmacao', 'desconhecimento', 'nao_realizada'];
        if (!tipo_manifestacao || !validTipos.includes(tipo_manifestacao)) {
          return new Response(
            JSON.stringify({ error: 'tipo_manifestacao inválido. Use: ciencia, confirmacao, desconhecimento, ou nao_realizada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const manifestacaoEndpoint = {
          ciencia: 'ciencia',
          confirmacao: 'confirmacao',
          desconhecimento: 'desconhecimento',
          nao_realizada: 'nao_realizada',
        };

        const response = await fetch(`${FOCUS_API_URL}/v2/nfes_recebidas/${cleanChave}/manifestar`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(FOCUS_TOKEN + ':')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: manifestacaoEndpoint[tipo_manifestacao as keyof typeof manifestacaoEndpoint],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe manifestation error:', response.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Erro ao manifestar NF-e', details: escapeHtml(errorText) }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log(`Manifestação ${tipo_manifestacao} registrada para chave ${cleanChave}`);
        
        return new Response(
          JSON.stringify({ success: true, ...data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'download_xml': {
        // Download do XML completo da NF-e
        const response = await fetch(`${FOCUS_API_URL}/v2/nfes_recebidas/${cleanChave}.xml`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(FOCUS_TOKEN + ':')}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe XML download error:', response.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Erro ao baixar XML da NF-e', details: escapeHtml(errorText) }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const xml = await response.text();
        return new Response(
          JSON.stringify({ xml }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida. Use: consultar, listar_recebidas, manifestar, ou download_xml' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Focus NFe function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
