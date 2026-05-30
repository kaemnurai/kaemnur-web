import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/account/downloads/[id]
// Removes a single download-history entry, but only if it belongs to the
// authenticated user.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await prisma.downloadLog.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (log.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.downloadLog.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
