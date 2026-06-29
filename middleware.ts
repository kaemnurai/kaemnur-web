import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps the Supabase cookie alive between requests.
  // Do NOT remove this; it's required for Server Components to read auth state.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Keep auth/session middleware away from login, API routes, Next internals,
    // favicon, public asset requests, and /admin (which uses its own cookie
    // session, not Supabase) so they cannot participate in loops and don't
    // pay for a Supabase round-trip they never read.
    "/((?!api(?:/|$)|admin(?:/|$)|login(?:/|$)|_next(?:/|$)|favicon.ico|.*\\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webmanifest|webp|woff|woff2)$).*)",
  ],
};
