import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getLicenseInfo, getProductIds } from "../_shared/license.ts";

const ALLOWED_ORIGIN = "https://kaemnur.com";
const REDIRECT_URL = "https://form.kaemnur.com/auth/callback";

Deno.serve(async (req) => {
  const cors = corsHeaders(ALLOWED_ORIGIN);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json", Allow: "POST, OPTIONS" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const launchTokenSecret = Deno.env.get("LAUNCH_TOKEN_SECRET");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !launchTokenSecret) {
    return new Response(JSON.stringify({ error: "Auth bridge is not configured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Verify the caller's session JWT and get their auth.users record.
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await anonClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const user = userData.user;
  if (!user.email) {
    return new Response(JSON.stringify({ error: "Authenticated user has no email" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Service-role client for license + profile lookups (bypasses RLS).
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await supabase
    .from("UserProfile")
    .select("displayName, avatarUrl")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.display_name ??
    profile?.displayName ??
    user.email?.split("@")[0] ??
    "User";
  const avatar_url = user.user_metadata?.avatar_url ?? profile?.avatarUrl ?? null;

  const productIds = await getProductIds(supabase);
  const license = await getLicenseInfo(supabase, user.id, productIds);

  const secret = new TextEncoder().encode(launchTokenSecret);
  const token = await new SignJWT({
    kaemnur_uid: user.id,
    email: user.email,
    name,
    avatar_url,
    license,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(secret);

  return new Response(JSON.stringify({ token, redirect_url: REDIRECT_URL }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
