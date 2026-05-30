import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/admin/community/topics/[id]
// Admin only. Deletes the topic and all its comments (cascade).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topic = await prisma.topic.findUnique({ where: { id: params.id } });
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  await prisma.topic.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
