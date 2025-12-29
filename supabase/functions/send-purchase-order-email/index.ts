import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(options: { from: string; to: string[]; subject: string; html: string; attachments?: { filename: string; content: string }[] }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

interface PurchaseOrderEmailRequest {
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  pdfBase64?: string;
}

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

async function verifyUserRole(supabase: any, userId: string, allowedRoles: string[]): Promise<boolean> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("approved", true);

  return roles?.some((r: any) => allowedRoles.includes(r.role)) ?? false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user has admin or almoxarife role
    const hasRole = await verifyUserRole(supabase, user.id, ["admin", "almoxarife"]);
    if (!hasRole) {
      console.error("User lacks required role:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { orderId, recipientEmail, recipientName, pdfBase64 }: PurchaseOrderEmailRequest = await req.json();

    console.log(`Sending purchase order email for order ${orderId} to ${recipientEmail} by user ${user.id}`);

    // Escape user inputs
    const safeRecipientName = escapeHtml(recipientName);

    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .select(`*, supplier:suppliers(id, name, cnpj, email, phone, address)`)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message || 'Unknown error'}`);
    }

    const { data: items, error: itemsError } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      throw new Error(`Error fetching items: ${itemsError.message}`);
    }

    const { data: company } = await supabase
      .from("company_settings")
      .select("*")
      .single();

    const companyName = escapeHtml(company?.name) || "Empresa";

    const itemsHtml = items?.map((item: { codigo?: string; descricao: string; unidade: string; quantidade: number; valor_unitario: number }, index: number) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center;">${index + 1}</td>
        <td style="padding: 12px; font-family: monospace;">${escapeHtml(item.codigo) || '—'}</td>
        <td style="padding: 12px;">${escapeHtml(item.descricao)}</td>
        <td style="padding: 12px; text-align: center;">${escapeHtml(item.unidade)}</td>
        <td style="padding: 12px; text-align: center; font-weight: 600;">${item.quantidade}</td>
        <td style="padding: 12px; text-align: right;">R$ ${Number(item.valor_unitario).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">R$ ${(Number(item.quantidade) * Number(item.valor_unitario)).toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 40px;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <table style="width: 100%;">
              <tr>
                <td>
                  <h1 style="color: #1f2937; margin: 0; font-size: 24px;">${companyName}</h1>
                  ${company?.cnpj ? `<p style="color: #6b7280; margin: 4px 0; font-size: 14px;">CNPJ: ${escapeHtml(company.cnpj)}</p>` : ''}
                  ${company?.address ? `<p style="color: #6b7280; margin: 4px 0; font-size: 14px;">${escapeHtml(company.address)}</p>` : ''}
                </td>
                <td style="text-align: right;">
                  <h2 style="color: #2563eb; margin: 0; font-size: 20px;">ORDEM DE COMPRA</h2>
                  <p style="font-size: 18px; font-weight: 600; margin: 8px 0;">${escapeHtml(order.numero)}</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Emissão: ${formatDate(order.data_emissao)}</p>
                  ${order.data_entrega ? `<p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Entrega: ${formatDate(order.data_entrega)}</p>` : ''}
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="font-size: 16px; color: #374151;">
              Prezado(a) <strong>${safeRecipientName}</strong>,
            </p>
            <p style="font-size: 14px; color: #6b7280;">
              Segue a Ordem de Compra ${escapeHtml(order.numero)} para sua análise e confirmação.
            </p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0;">Condições de Pagamento</p>
                  <p style="font-weight: 600; margin: 4px 0;">${escapeHtml(order.condicoes_pagamento) || '—'}</p>
                </td>
                <td style="width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0;">Frete</p>
                  <p style="font-weight: 600; margin: 4px 0;">${escapeHtml(order.frete) || '—'}</p>
                </td>
                <td style="width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0;">Solicitante</p>
                  <p style="font-weight: 600; margin: 4px 0;">${escapeHtml(order.solicitante) || '—'}</p>
                </td>
              </tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                <th style="padding: 12px; text-align: center; font-size: 14px;">Item</th>
                <th style="padding: 12px; text-align: left; font-size: 14px;">Código</th>
                <th style="padding: 12px; text-align: left; font-size: 14px;">Descrição</th>
                <th style="padding: 12px; text-align: center; font-size: 14px;">Und</th>
                <th style="padding: 12px; text-align: center; font-size: 14px;">Qtd</th>
                <th style="padding: 12px; text-align: right; font-size: 14px;">Preço Unit.</th>
                <th style="padding: 12px; text-align: right; font-size: 14px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #2563eb; color: white;">
                <td colspan="6" style="padding: 16px; text-align: right; font-weight: bold; font-size: 16px;">TOTAL</td>
                <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 18px;">R$ ${Number(order.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${order.observacoes ? `
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">Observações</h4>
            <p style="color: #78350f; margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(order.observacoes)}</p>
          </div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
              Favor confirmar o recebimento desta ordem e a previsão de entrega.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              <strong>${companyName}</strong><br>
              ${company?.phone ? `Tel: ${escapeHtml(company.phone)}` : ''}<br>
              ${company?.email ? `Email: ${escapeHtml(company.email)}` : ''}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              Este email foi enviado automaticamente pelo sistema de gestão.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailOptions: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: { filename: string; content: string }[];
    } = {
      from: `${companyName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `Ordem de Compra ${order.numero} - ${companyName}`,
      html: emailHtml,
    };

    if (pdfBase64) {
      emailOptions.attachments = [
        {
          filename: `ordem-compra-${order.numero}.pdf`,
          content: pdfBase64,
        },
      ];
    }

    const emailResponse = await sendEmail(emailOptions);

    console.log("Email sent successfully:", emailResponse);

    if (order.status === 'rascunho') {
      await supabase
        .from("purchase_orders")
        .update({ status: 'enviada', updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-purchase-order-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
