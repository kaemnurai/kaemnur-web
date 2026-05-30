import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/account/downloads
// Returns the authenticated user's download history (most recent first).
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.downloadLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(logs);
}

// DELETE /api/account/downloads
// Clears the authenticated user's entire download history.
export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await prisma.downloadLog.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true, deleted: count });
}
