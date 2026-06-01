import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isValidIndonesianPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAY_WINDOW_MS = 24 * 60 * 60 * 1000;

// POST /api/orders/[id]/pay — body { customerPhone }. Marks the order as
// awaiting admin confirmation and notifies admin.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const customerPhone = String(body?.customerPhone ?? "").trim();
  if (!isValidIndonesianPhone(customerPhone)) {
    return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }
  if (order.status !== "BELUM_BAYAR") {
    return NextResponse.json({ error: "Pesanan tidak dapat dibayar." }, { status: 400 });
  }
  if (Date.now() > order.createdAt.getTime() + PAY_WINDOW_MS) {
    return NextResponse.json({ error: "Waktu pembayaran sudah habis." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "MENUNGGU_KONFIRMASI", paidClickedAt: new Date(), customerPhone },
  });

  await prisma.notification.create({
    data: {
      type: "new_order",
      orderId: order.id,
      message: `Pesanan baru menunggu konfirmasi: ${order.orderNumber} - ${order.productName}`,
    },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
