import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando arquivo:', file.name, 'Tamanho:', file.size);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Chave de API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mimeType = file.type || 'application/pdf';
    console.log('Enviando para AI Gateway com mime:', mimeType);

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
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar imagem com IA',
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI Response recebida');

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA' }),
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
      console.log('Dados extraídos com sucesso:', nfeData.chave_acesso);
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      console.log('Conteúdo recebido:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível extrair dados do DANFE',
          raw_response: content 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response to match NFEData structure
    const formattedData = {
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

    return new Response(
      JSON.stringify(formattedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR DANFE Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar DANFE',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
