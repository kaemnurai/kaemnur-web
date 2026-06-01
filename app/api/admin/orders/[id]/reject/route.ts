import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/orders/[id]/reject — cancel an order (rejection / manual
// expiry). Already-approved orders cannot be rejected.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (order.status === "SUDAH_DIBAYAR") {
    return NextResponse.json({ error: "Pesanan sudah disetujui." }, { status: 400 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "DIBATALKAN" } });
  return NextResponse.json({ success: true });
}
