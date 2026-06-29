import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/login/")) return "/";
  return value;
}

// GET /auth/callback
// Handles the OAuth redirect from Supabase (Google OAuth or magic link).
// Exchanges the one-time code for a session, upserts a UserProfile, then
// redirects the browser to the intended destination.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cs) {
            cs.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { id, email, user_metadata } = data.user;
      // Upsert UserProfile so we always have a record for this user.
      await prisma.userProfile.upsert({
        where: { id },
        create: {
          id,
          email: email ?? null,
          displayName:
            user_metadata?.display_name ??
            user_metadata?.full_name ??
            (email ? email.split("@")[0] : null),
          avatarUrl: user_metadata?.avatar_url ?? null,
        },
        update: {
          // Keep displayName/avatarUrl fresh on every Google login.
          email: email ?? undefined,
          displayName:
            user_metadata?.full_name ?? undefined,
          avatarUrl: user_metadata?.avatar_url ?? undefined,
        },
      });
    }
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
