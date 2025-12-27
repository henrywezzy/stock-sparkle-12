import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_user_registration" | "user_approved" | "user_rejected";
  userEmail: string;
  userName?: string;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Stockly <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userEmail, userName }: NotificationRequest = await req.json();
    console.log(`Processing ${type} notification for ${userEmail}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === "new_user_registration") {
      // Get all admin users to notify
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .eq("approved", true);

      if (rolesError) {
        console.error("Error fetching admin roles:", rolesError);
        throw rolesError;
      }

      if (!adminRoles || adminRoles.length === 0) {
        console.log("No admin users found to notify");
        return new Response(JSON.stringify({ message: "No admins to notify" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get admin emails from profiles
      const adminUserIds = adminRoles.map((r) => r.user_id);
      const { data: adminProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", adminUserIds);

      if (profilesError) {
        console.error("Error fetching admin profiles:", profilesError);
        throw profilesError;
      }

      const adminEmails = adminProfiles
        ?.map((p) => p.email)
        .filter((email): email is string => !!email);

      if (!adminEmails || adminEmails.length === 0) {
        console.log("No admin emails found");
        return new Response(JSON.stringify({ message: "No admin emails found" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log(`Sending notification to ${adminEmails.length} admins`);

      // Send email to all admins
      const emailResponse = await sendEmail(
        adminEmails,
        "🔔 Novo usuário aguardando aprovação - Stockly",
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; margin: 0; font-size: 24px;">Stockly</h1>
                  <p style="color: #71717a; margin: 5px 0 0 0; font-size: 14px;">Gestão de Almoxarifado</p>
                </div>
                
                <div style="border-left: 4px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;">
                  <h2 style="color: #18181b; margin: 0 0 8px 0; font-size: 18px;">Novo Usuário Cadastrado</h2>
                  <p style="color: #52525b; margin: 0; font-size: 14px;">Um novo usuário se cadastrou e está aguardando aprovação.</p>
                </div>
                
                <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #18181b;">Nome:</strong> <span style="color: #52525b;">${userName || "Não informado"}</span></p>
                  <p style="margin: 0; font-size: 14px;"><strong style="color: #18181b;">Email:</strong> <span style="color: #52525b;">${userEmail}</span></p>
                </div>
                
                <p style="color: #52525b; font-size: 14px; margin-bottom: 24px;">
                  Acesse as configurações do sistema para aprovar ou rejeitar este usuário.
                </p>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Este é um email automático do sistema Stockly.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );

      console.log("Admin notification email sent:", emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (type === "user_approved") {
      const emailResponse = await sendEmail(
        [userEmail],
        "✅ Seu acesso foi aprovado - Stockly",
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; margin: 0; font-size: 24px;">Stockly</h1>
                  <p style="color: #71717a; margin: 5px 0 0 0; font-size: 14px;">Gestão de Almoxarifado</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 28px;">✓</span>
                  </div>
                </div>
                
                <h2 style="color: #18181b; text-align: center; margin: 0 0 16px 0; font-size: 20px;">Acesso Aprovado!</h2>
                
                <p style="color: #52525b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                  Olá${userName ? ` ${userName}` : ""}! Seu cadastro foi aprovado pelo administrador. Agora você pode acessar o sistema normalmente.
                </p>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Este é um email automático do sistema Stockly.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );

      console.log("User approved email sent:", emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (type === "user_rejected") {
      const emailResponse = await sendEmail(
        [userEmail],
        "Acesso não aprovado - Stockly",
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; margin: 0; font-size: 24px;">Stockly</h1>
                  <p style="color: #71717a; margin: 5px 0 0 0; font-size: 14px;">Gestão de Almoxarifado</p>
                </div>
                
                <h2 style="color: #18181b; text-align: center; margin: 0 0 16px 0; font-size: 20px;">Acesso Não Aprovado</h2>
                
                <p style="color: #52525b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                  Infelizmente seu pedido de acesso ao sistema não foi aprovado. Se você acredita que isso foi um erro, entre em contato com o administrador.
                </p>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Este é um email automático do sistema Stockly.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );

      console.log("User rejected email sent:", emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid notification type" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
