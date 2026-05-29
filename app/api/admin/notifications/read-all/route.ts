import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/notifications/read-all
export async function PATCH() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
