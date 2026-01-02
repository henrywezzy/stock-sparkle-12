import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication - this function queries user data so requires auth
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.error(`[${requestId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", request_id: requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has admin or almoxarife role - prevents email enumeration by regular users
    const hasRole = await verifyUserRole(user.id, ["admin", "almoxarife"]);
    if (!hasRole) {
      console.error(`[${requestId}] User lacks required role:`, user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Insufficient permissions", request_id: requestId }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the request
    await logRequest(requestId, 'find-user-email', user.id, 'processing');

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { identifier } = await req.json();

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Identifier is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    
    // Check if identifier looks like an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
    
    if (isEmail) {
      return new Response(
        JSON.stringify({ email: cleanIdentifier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if identifier looks like a phone number (remove non-digits for comparison)
    const digitsOnly = cleanIdentifier.replace(/\D/g, '');
    const isPhone = digitsOnly.length >= 10 && digitsOnly.length <= 15;

    let query;
    if (isPhone) {
      // Search by phone - try to match with or without formatting
      query = supabase
        .from('profiles')
        .select('email, phone')
        .or(`phone.ilike.%${digitsOnly}%,phone.ilike.%${cleanIdentifier}%`)
        .limit(1);
    } else {
      // Search by username
      query = supabase
        .from('profiles')
        .select('email, username')
        .ilike('username', cleanIdentifier)
        .limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to search user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${requestId}] User email found for identifier by authorized user ${user.id}`);

    return new Response(
      JSON.stringify({ email: data[0].email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
