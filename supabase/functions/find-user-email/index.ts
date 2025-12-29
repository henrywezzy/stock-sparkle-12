import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication - this function queries user data so requires auth
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log(`User email found for identifier by user ${user.id}`);

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
