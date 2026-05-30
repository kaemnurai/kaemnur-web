import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_PINNED = 3;

// PUT /api/admin/community/topics/[id]/pin
// Admin only. Toggles isPinned. Rejects pinning when already at the max.
export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topic = await prisma.topic.findUnique({
    where: { id: params.id },
    select: { id: true, isPinned: true },
  });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // Only enforce the cap when pinning (not when unpinning).
  if (!topic.isPinned) {
    const pinnedCount = await prisma.topic.count({ where: { isPinned: true } });
    if (pinnedCount >= MAX_PINNED) {
      return NextResponse.json(
        { error: "Maksimal 3 postingan dapat disematkan" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.topic.update({
    where: { id: params.id },
    data: { isPinned: !topic.isPinned },
    select: { id: true, isPinned: true },
  });

  return NextResponse.json({ success: true, isPinned: updated.isPinned });
}
