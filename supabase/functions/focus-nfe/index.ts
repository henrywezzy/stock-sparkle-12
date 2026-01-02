import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// Restrict CORS to specific origin in production
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to generate unique request ID
function generateRequestId(): string {
  return crypto.randomUUID();
}

// Focus NFe API endpoints
const FOCUS_BASE_URLS = {
  producao: 'https://api.focusnfe.com.br',
  homologacao: 'https://homologacao.focusnfe.com.br',
} as const;

type FocusEnv = keyof typeof FOCUS_BASE_URLS;

function normalizeEnv(env?: string): FocusEnv {
  const e = (env || '').toLowerCase().trim();
  return e === 'producao' ? 'producao' : 'homologacao';
}

const CONFIG_ENV = normalizeEnv(Deno.env.get('FOCUS_NFE_AMBIENTE'));
const FOCUS_TOKEN = Deno.env.get('FOCUS_NFE_TOKEN');

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getFocusAuthHeaders() {
  // Basic auth: token as username, empty password
  return {
    Authorization: `Basic ${btoa(`${FOCUS_TOKEN}:`)}`,
  };
}

// Verify authentication and return user
async function verifyAuth(req: Request): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "Missing authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user };
}

// Verify user has required role
async function verifyUserRole(userId: string, allowedRoles: string[]): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("approved", true);

  return roles?.some((r: any) => allowedRoles.includes(r.role)) ?? false;
}

// Log request for audit trail
async function logRequest(requestId: string, functionName: string, userId: string, status: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase
    .from("edge_function_requests")
    .insert({
      request_id: requestId,
      function_name: functionName,
      user_id: userId,
      status: status,
      completed_at: status !== 'pending' ? new Date().toISOString() : null
    });
}

async function fetchFocus(
  path: string,
  init: RequestInit,
  opts: { retryOtherEnvOn401?: boolean } = {}
): Promise<{ response: Response; envUsed: FocusEnv }> {
  const primary: FocusEnv = CONFIG_ENV;
  const secondary: FocusEnv = primary === 'producao' ? 'homologacao' : 'producao';
  const envs: FocusEnv[] = opts.retryOtherEnvOn401 ? [primary, secondary] : [primary];

  let lastResponse: Response | null = null;
  let lastEnv: FocusEnv = primary;

  for (const env of envs) {
    const baseUrl = FOCUS_BASE_URLS[env];
    lastEnv = env;

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...getFocusAuthHeaders(),
      },
    });

    lastResponse = response;

    // only retry if 401 and allowed
    if (!(opts.retryOtherEnvOn401 && response.status === 401)) {
      return { response, envUsed: env };
    }

    console.warn(`Focus NFe 401 on env=${env}; trying other environment...`);
  }

  // fallback
  return { response: lastResponse!, envUsed: lastEnv };
}

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
  const requestId = generateRequestId();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.error(`[${requestId}] Authentication failed:`, authError);
      return json({ error: 'Unauthorized', request_id: requestId }, 401);
    }

    // Verify user has admin or almoxarife role
    const hasRole = await verifyUserRole(user.id, ["admin", "almoxarife"]);
    if (!hasRole) {
      console.error(`[${requestId}] User lacks required role:`, user.id);
      return json({ error: 'Forbidden: Insufficient permissions', request_id: requestId }, 403);
    }

    // Log the request
    await logRequest(requestId, 'focus-nfe', user.id, 'processing');

    // Check if Focus NFe token is configured
    if (!FOCUS_TOKEN) {
      console.error('FOCUS_NFE_TOKEN not configured');
      return json({ error: 'Focus NFe API not configured. Please set FOCUS_NFE_TOKEN.' });
    }

    const { action, chave_acesso, tipo_manifestacao } = await req.json();

    console.log(`[${requestId}] Focus NFe action: ${action}, chave: ${chave_acesso?.substring(0, 10)}...`);

    // Validate chave_acesso for actions that require it
    if (['consultar', 'manifestar', 'download_xml'].includes(action)) {
      if (!chave_acesso || !validateChaveAcesso(chave_acesso)) {
        return json({ error: 'Invalid chave_acesso. Must be 44 digits.' });
      }
    }

    const cleanChave = chave_acesso?.replace(/\D/g, '') || '';

    switch (action) {
      case 'consultar': {
        // Consultar NF-e pela chave de acesso
        const { response, envUsed } = await fetchFocus(
          `/v2/nfe_recebidas/${cleanChave}`,
          { method: 'GET' },
          { retryOtherEnvOn401: true }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe API error:', response.status, errorText);

          // If not found, try alternative endpoint
          if (response.status === 404) {
            const alt = await fetchFocus(
              `/v2/nfes/${cleanChave}`,
              { method: 'GET' },
              { retryOtherEnvOn401: true }
            );

            if (alt.response.ok) {
              const altData = await alt.response.json();
              return json({ ...altData, _focus_env: alt.envUsed, _focus_env_config: CONFIG_ENV });
            }
          }

          const friendly = response.status === 401
            ? 'Acesso negado na Focus NFe (token inválido ou ambiente incorreto).'
            : 'NF-e não encontrada ou não autorizada para consulta.';

          return json({
            error: friendly,
            focus_status: response.status,
            details: escapeHtml(errorText),
            _focus_env: envUsed,
            _focus_env_config: CONFIG_ENV,
          });
        }

        const data = await response.json();
        return json({ ...data, _focus_env: envUsed, _focus_env_config: CONFIG_ENV });
      }

      case 'listar_recebidas': {
        // Listar NF-es recebidas (destinadas à empresa)
        const cnpj = (Deno.env.get('FOCUS_NFE_CNPJ') || '').replace(/\D/g, '');
        if (!cnpj) {
          return json({ error: 'FOCUS_NFE_CNPJ não configurado para listar notas recebidas.' });
        }

        const { response, envUsed } = await fetchFocus(
          `/v2/nfe_recebidas?cnpj=${cnpj}`,
          { method: 'GET' },
          { retryOtherEnvOn401: true }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe API error:', response.status, errorText);
          return json({
            error: 'Erro ao listar NF-es recebidas',
            focus_status: response.status,
            details: escapeHtml(errorText),
            _focus_env: envUsed,
            _focus_env_config: CONFIG_ENV,
          });
        }

        const data = await response.json();
        // Keep response shape as array/object from Focus API
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return json({ ...data, _focus_env: envUsed, _focus_env_config: CONFIG_ENV });
        }
        return json(data);
      }

      case 'manifestar': {
        // Tipos de manifestação: ciencia, confirmacao, desconhecimento, nao_realizada
        const validTipos = ['ciencia', 'confirmacao', 'desconhecimento', 'nao_realizada'];
        if (!tipo_manifestacao || !validTipos.includes(tipo_manifestacao)) {
          return json({ error: 'tipo_manifestacao inválido. Use: ciencia, confirmacao, desconhecimento, ou nao_realizada' });
        }

        const manifestacaoEndpoint = {
          ciencia: 'ciencia',
          confirmacao: 'confirmacao',
          desconhecimento: 'desconhecimento',
          nao_realizada: 'nao_realizada',
        };

        const { response, envUsed } = await fetchFocus(
          `/v2/nfe_recebidas/${cleanChave}/manifesto`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tipo: manifestacaoEndpoint[tipo_manifestacao as keyof typeof manifestacaoEndpoint],
            }),
          },
          { retryOtherEnvOn401: true }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe manifestation error:', response.status, errorText);
          return json({
            error: 'Erro ao manifestar NF-e',
            focus_status: response.status,
            details: escapeHtml(errorText),
            _focus_env: envUsed,
            _focus_env_config: CONFIG_ENV,
          });
        }

        const data = await response.json();
        console.log(`[${requestId}] Manifestação ${tipo_manifestacao} registrada para chave ${cleanChave}`);

        return json({ success: true, ...data, _focus_env: envUsed, _focus_env_config: CONFIG_ENV });
      }

      case 'download_xml': {
        // Download do XML completo da NF-e
        const { response, envUsed } = await fetchFocus(
          `/v2/nfe_recebidas/${cleanChave}.xml`,
          { method: 'GET' },
          { retryOtherEnvOn401: true }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Focus NFe XML download error:', response.status, errorText);
          return json({
            error: 'Erro ao baixar XML da NF-e',
            focus_status: response.status,
            details: escapeHtml(errorText),
            _focus_env: envUsed,
            _focus_env_config: CONFIG_ENV,
          });
        }

        const xml = await response.text();
        return json({ xml, _focus_env: envUsed, _focus_env_config: CONFIG_ENV });
      }

      default:
        return json({ error: 'Ação inválida. Use: consultar, listar_recebidas, manifestar, ou download_xml' });
    }

  } catch (error) {
    console.error('Focus NFe function error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
