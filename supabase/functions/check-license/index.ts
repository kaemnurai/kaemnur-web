import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getLicenseInfo, getProductIds } from "../_shared/license.ts";

const ALLOWED_ORIGIN = "https://form.kaemnur.com";

async function findAuthUser(
  supabase: ReturnType<typeof createClient>,
  email: string | null,
  kaemnurUid: string | null
) {
  if (kaemnurUid) {
    const { data, error } = await supabase.auth.admin.getUserById(kaemnurUid);
    if (error && error.status !== 404) throw error;
    return data.user ?? null;
  }

  const normalizedEmail = email?.toLowerCase();
  if (!normalizedEmail) return null;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < 1000) break;
  }

  return null;
}

async function findClaimableLicense(
  supabase: ReturnType<typeof createClient>,
  key: string,
  kaemformProductId: string | null
) {
  if (!kaemformProductId) return null;

  const { data, error } = await supabase
    .from("License")
    .select("id, productId, userId, expiresAt")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.productId !== kaemformProductId) return null;

  const expiry = data.expiresAt ? new Date(data.expiresAt).getTime() : null;
  if (expiry !== null && expiry <= Date.now()) return null;

  return data;
}

async function claimLicenseCode(
  supabase: ReturnType<typeof createClient>,
  licenseId: string,
  authUserId: string
) {
  const { error } = await supabase
    .from("License")
    .update({
      userId: authUserId,
      isActivated: true,
      activatedAt: new Date().toISOString(),
      deviceId: `kaemform-account:${authUserId}`,
      activatedPlatform: "WEB",
    })
    .eq("id", licenseId);

  if (error) throw error;
}

// Server-to-server: KaemForm looks up a Kaemnur account + its KaemForm
// license by email, kaemnur_uid, or a purchase license_code. Protected by a
// shared x-api-key, not Supabase Auth.
Deno.serve(async (req) => {
  const cors = corsHeaders(ALLOWED_ORIGIN);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json", Allow: "GET, OPTIONS" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  const expectedApiKey = Deno.env.get("KAEMFORM_API_KEY");
  if (!expectedApiKey) {
    return new Response(JSON.stringify({ error: "Auth bridge is not configured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (!apiKey || apiKey !== expectedApiKey) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() || null;
  const kaemnurUid = url.searchParams.get("kaemnur_uid")?.trim() || null;
  const licenseCode = url.searchParams.get("license_code")?.trim().toUpperCase() || null;

  if (!email && !kaemnurUid && !licenseCode) {
    return new Response(JSON.stringify({ error: "email, kaemnur_uid, or license_code is required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const productIds = await getProductIds(supabase);

  const authUser = await findAuthUser(supabase, email, kaemnurUid);
  if (!authUser) {
    return new Response(JSON.stringify({ found: false }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (licenseCode) {
    const license = await findClaimableLicense(supabase, licenseCode, productIds.kaemformId);
    if (!license || (license.userId && license.userId !== authUser.id)) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await claimLicenseCode(supabase, license.id, authUser.id);
  }

  const { data: profile, error: profileError } = await supabase
    .from("UserProfile")
    .select("displayName, avatarUrl")
    .eq("id", authUser.id)
    .maybeSingle();
  if (profileError) throw profileError;

  const license = await getLicenseInfo(supabase, authUser.id, productIds);
  const name =
    profile?.displayName ??
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.display_name ??
    authUser.email?.split("@")[0] ??
    "User";
  const avatarUrl = profile?.avatarUrl ?? authUser.user_metadata?.avatar_url ?? null;

  return new Response(
    JSON.stringify({
      found: true,
      kaemnur_uid: authUser.id,
      email: authUser.email,
      name,
      avatar_url: avatarUrl,
      license,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
});
