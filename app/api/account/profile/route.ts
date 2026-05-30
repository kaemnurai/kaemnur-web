import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/account/profile
// Body: { displayName: string }
// Updates the UserProfile record and Supabase user metadata.
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const displayName = String(body?.displayName ?? "").trim();

  if (!displayName || displayName.length < 2) {
    return NextResponse.json(
      { error: "Nama minimal 2 karakter." },
      { status: 400 }
    );
  }

  // Update Prisma profile
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      displayName,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: { displayName },
  });

  return NextResponse.json({ success: true, displayName });
}
