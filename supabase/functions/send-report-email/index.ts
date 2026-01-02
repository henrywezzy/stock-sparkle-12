import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Restrict CORS to specific origin in production
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper to generate unique request ID
function generateRequestId(): string {
  return crypto.randomUUID();
}

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

interface ReportEmailRequest {
  to: string;
  subject: string;
  reportData: {
    date: string;
    type: string;
    categoryName?: string;
    responsible: string;
    totalItems: number;
    countedItems: number;
    divergences: number;
    adjustments: number;
    status: string;
  };
  companyName: string;
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

async function sendEmail(to: string[], subject: string, html: string, attachments?: Array<{filename: string, content: string}>) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const body: any = {
    from: "Stockly <onboarding@resend.dev>",
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    body.attachments = attachments;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
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

const handler = async (req: Request): Promise<Response> => {
  const requestId = generateRequestId();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.error(`[${requestId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", request_id: requestId }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user has admin or almoxarife role
    const hasRole = await verifyUserRole(user.id, ["admin", "almoxarife"]);
    if (!hasRole) {
      console.error(`[${requestId}] User lacks required role:`, user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Insufficient permissions", request_id: requestId }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the request
    await logRequest(requestId, 'send-report-email', user.id, 'processing');

    const { to, subject, reportData, companyName, pdfBase64 }: ReportEmailRequest = await req.json();

    console.log(`[${requestId}] Sending report email to: ${to} by user ${user.id}`);

    // Escape user inputs
    const safeCompanyName = escapeHtml(companyName);
    const safeResponsible = escapeHtml(reportData.responsible);
    const safeCategoryName = escapeHtml(reportData.categoryName);

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const attachments = pdfBase64 ? [
      {
        filename: `relatorio-inventario-${new Date(reportData.date).toISOString().split('T')[0]}.pdf`,
        content: pdfBase64,
      }
    ] : undefined;

    const emailResponse = await sendEmail(
      [to],
      subject,
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Inventário</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${safeCompanyName}</h1>
                      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Sistema de Gestão de Almoxarifado</p>
                    </td>
                  </tr>
                  
                  <!-- Title -->
                  <tr>
                    <td style="padding: 32px 32px 16px 32px; text-align: center;">
                      <h2 style="color: #1e293b; margin: 0; font-size: 22px;">Relatório de Inventário</h2>
                      <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
                        ${formatDate(reportData.date)}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Info Box -->
                  <tr>
                    <td style="padding: 0 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 8px; padding: 20px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="50%" style="padding-bottom: 12px;">
                                  <span style="color: #64748b; font-size: 12px;">Tipo</span><br>
                                  <strong style="color: #1e293b; font-size: 14px;">
                                    ${reportData.type === 'complete' ? 'Inventário Completo' : `Categoria: ${safeCategoryName}`}
                                  </strong>
                                </td>
                                <td width="50%" style="padding-bottom: 12px;">
                                  <span style="color: #64748b; font-size: 12px;">Status</span><br>
                                  <strong style="color: ${reportData.status === 'completed' ? '#22c55e' : '#94a3b8'}; font-size: 14px;">
                                    ${reportData.status === 'completed' ? '✓ Concluído' : 'Cancelado'}
                                  </strong>
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2">
                                  <span style="color: #64748b; font-size: 12px;">Responsável</span><br>
                                  <strong style="color: #1e293b; font-size: 14px;">${safeResponsible}</strong>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Stats -->
                  <tr>
                    <td style="padding: 24px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="33%" style="text-align: center; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
                            <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${reportData.countedItems}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">de ${reportData.totalItems} conferidos</div>
                          </td>
                          <td width="5"></td>
                          <td width="33%" style="text-align: center; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
                            <div style="font-size: 28px; font-weight: 700; color: #22c55e;">${reportData.adjustments}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">ajustes realizados</div>
                          </td>
                          <td width="5"></td>
                          <td width="33%" style="text-align: center; padding: 16px; background-color: #fef9c3; border-radius: 8px;">
                            <div style="font-size: 28px; font-weight: 700; color: #eab308;">${reportData.divergences}</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">divergências</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${pdfBase64 ? `
                  <!-- Attachment Notice -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 8px; padding: 16px;">
                        <tr>
                          <td style="padding: 16px; text-align: center;">
                            <span style="color: #64748b; font-size: 14px;">
                              📎 O relatório completo em PDF está anexado a este email
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        Este email foi enviado automaticamente pelo sistema ${safeCompanyName}.<br>
                        Por favor, não responda a este email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments
    );

    console.log(`[${requestId}] Report email sent successfully:`, emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error sending report email:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
