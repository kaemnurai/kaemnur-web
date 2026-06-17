import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildKaemFormTokenRedirect,
  createKaemFormLaunchToken,
  getSafeKaemFormRedirectUrl,
} from "@/lib/kaemform-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirect", returnPath);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { token } = await createKaemFormLaunchToken(user);
    const callbackUrl = getSafeKaemFormRedirectUrl(req.nextUrl.searchParams.get("redirect_to"));
    const targetUrl = buildKaemFormTokenRedirect(callbackUrl, token);
    const state = req.nextUrl.searchParams.get("state");
    if (state) targetUrl.searchParams.set("state", state);
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth bridge belum dikonfigurasi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
