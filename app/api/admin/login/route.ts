import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, sessionToken, verifyAdminPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url), {
      status: 303,
    });
  }

  const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
