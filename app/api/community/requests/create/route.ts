import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/community/requests/create — body { title, description }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (title.length < 2) return NextResponse.json({ error: "Nama aplikasi minimal 2 karakter." }, { status: 400 });
  if (description.length < 5) return NextResponse.json({ error: "Deskripsi minimal 5 karakter." }, { status: 400 });

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? null, displayName, avatarUrl: user.user_metadata?.avatar_url ?? null },
    update: {},
  });

  const created = await prisma.appRequest.create({ data: { title, description, userId: user.id } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
