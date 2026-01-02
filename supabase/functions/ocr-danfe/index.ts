import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
      return new Response(
        JSON.stringify({ error: 'Unauthorized', request_id: requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin or almoxarife role
    const hasRole = await verifyUserRole(user.id, ["admin", "almoxarife"]);
    if (!hasRole) {
      console.error(`[${requestId}] User lacks required role:`, user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions', request_id: requestId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request
    await logRequest(requestId, 'ocr-danfe', user.id, 'processing');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado', request_id: requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ error: 'Tipo de arquivo não suportado. Use PDF ou imagem.', request_id: requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande. Máximo 10MB.', request_id: requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Processing file: ${file.name}, Size: ${file.size}, User: ${user.id}`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error(`[${requestId}] LOVABLE_API_KEY not configured`);
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ error: 'Chave de API não configurada', request_id: requestId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mimeType = file.type || 'application/pdf';
    console.log(`[${requestId}] Sending to AI Gateway with mime: ${mimeType}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Você é um especialista em extrair dados de DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) brasileira.

Analise a imagem do DANFE e extraia os seguintes dados no formato JSON:

{
  "chave_acesso": "string (44 dígitos - procure por 'CHAVE DE ACESSO' ou números em grupos de 4)",
  "numero": "string (número da NF-e)",
  "serie": "string",
  "data_emissao": "string (formato ISO: YYYY-MM-DD)",
  "nome_emitente": "string (NOME/RAZÃO SOCIAL do emitente)",
  "cnpj_emitente": "string (CNPJ do emitente - 14 dígitos)",
  "nome_destinatario": "string (NOME/RAZÃO SOCIAL do destinatário)",
  "cnpj_destinatario": "string (CNPJ/CPF do destinatário)",
  "valor_total": number (valor total da nota fiscal),
  "itens": [
    {
      "codigo_produto": "string",
      "descricao": "string",
      "quantidade_comercial": number,
      "unidade_comercial": "string",
      "valor_unitario_comercial": number,
      "valor_bruto": number
    }
  ]
}

IMPORTANTE:
- A chave de acesso tem 44 dígitos numéricos, geralmente aparece na parte superior do DANFE
- Extraia TODOS os itens da lista de produtos/serviços
- Se algum campo não for encontrado, use null para strings e 0 para números
- Retorne APENAS o JSON, sem markdown ou explicações`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] AI Gateway error:`, response.status, errorText);
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar imagem com IA',
          request_id: requestId
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log(`[${requestId}] AI Response received`);

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA', request_id: requestId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse the JSON from the AI response
    let nfeData;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      nfeData = JSON.parse(jsonStr);
      console.log(`[${requestId}] Data extracted successfully: ${nfeData.chave_acesso}`);
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing AI response:`, parseError);
      await logRequest(requestId, 'ocr-danfe', user.id, 'failed');
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível extrair dados do DANFE',
          request_id: requestId
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response to match NFEData structure
    const formattedData = {
      request_id: requestId,
      chave_nfe: (nfeData.chave_acesso || '').replace(/\D/g, ''),
      status: 'ocr',
      numero: nfeData.numero || '',
      serie: nfeData.serie || '',
      data_emissao: nfeData.data_emissao ? new Date(nfeData.data_emissao).toISOString() : new Date().toISOString(),
      nome_emitente: nfeData.nome_emitente || 'Emitente não identificado',
      cnpj_emitente: (nfeData.cnpj_emitente || '').replace(/\D/g, ''),
      nome_destinatario: nfeData.nome_destinatario || undefined,
      cnpj_destinatario: nfeData.cnpj_destinatario ? (nfeData.cnpj_destinatario || '').replace(/\D/g, '') : undefined,
      valor_total: Number(nfeData.valor_total) || 0,
      itens: (nfeData.itens || []).map((item: any, idx: number) => ({
        numero_item: String(idx + 1),
        codigo_produto: item.codigo_produto || '',
        descricao: item.descricao || '',
        quantidade_comercial: Number(item.quantidade_comercial) || 0,
        valor_unitario_comercial: Number(item.valor_unitario_comercial) || 0,
        valor_bruto: Number(item.valor_bruto) || 0,
        unidade_comercial: item.unidade_comercial || 'UN',
      })),
      status_manifestacao: 'pendente',
    };

    await logRequest(requestId, 'ocr-danfe', user.id, 'completed');

    return new Response(
      JSON.stringify(formattedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] OCR DANFE Error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar DANFE',
        request_id: requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
