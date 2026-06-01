import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/orders/[id]/cancel — owner cancels their order.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }
  if (order.status === "SUDAH_DIBAYAR") {
    return NextResponse.json({ error: "Pesanan sudah dibayar." }, { status: 400 });
  }
  if (order.status === "DIBATALKAN") {
    return NextResponse.json({ success: true });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "DIBATALKAN" } });
  return NextResponse.json({ success: true });
}
