import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  return NextResponse.redirect(new URL("/products/kaemform?desktop=1", origin));
}
