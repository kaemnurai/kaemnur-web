import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/notifications/[id]/read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notification = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  });

  return NextResponse.json(notification);
}
