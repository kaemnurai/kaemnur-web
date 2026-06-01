import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/notifications
export async function GET() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: null }, // admin-facing only (user-targeted have userId set)
    orderBy: { createdAt: "desc" },
    include: {
      topic: { select: { id: true, title: true, category: true } },
      order: { select: { id: true, orderNumber: true } },
    },
  });

  return NextResponse.json(notifications);
}
