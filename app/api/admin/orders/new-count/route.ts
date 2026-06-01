import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/orders/new-count — number of orders awaiting confirmation.
export async function GET() {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await prisma.order.count({ where: { status: "MENUNGGU_KONFIRMASI" } });
  return NextResponse.json({ count });
}
