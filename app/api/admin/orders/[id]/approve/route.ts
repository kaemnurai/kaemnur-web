import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

// POST /api/admin/orders/[id]/approve — confirm payment + issue a lifetime
// license, reusing the existing HMAC key generator (lib/license).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (order.status !== "MENUNGGU_KONFIRMASI") {
    return NextResponse.json(
      { error: "Pesanan harus berstatus Menunggu Konfirmasi." },
      { status: 400 }
    );
  }

  // Reuse the existing, tested key generator (KAEM-XXXX-XXXX-CCCC HMAC).
  let key = generateLicenseKey();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.license.findUnique({ where: { key } });
    if (!exists) break;
    key = generateLicenseKey();
  }

  const approvedBy = process.env.ADMIN_USERNAME ?? "admin";

  // Lifetime license (expiresAt null), linked to the buyer's account.
  // isActivated stays false so the desktop app can bind it to a device later.
  const license = await prisma.license.create({
    data: {
      key,
      productId: order.productId,
      buyerName: order.customerName,
      buyerWhatsapp: order.customerPhone,
      userId: order.userId,
      isActivated: false,
      expiresAt: null,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "SUDAH_DIBAYAR",
      licenseId: license.id,
      approvedAt: new Date(),
      approvedBy,
    },
  });

  await prisma.notification.create({
    data: {
      type: "order_approved",
      orderId: order.id,
      userId: order.userId,
      link: `/transaksi/${order.id}`,
      message: `Pembayaran Anda dikonfirmasi! Lisensi ${order.productName} sudah tersedia di akun Anda.`,
    },
  });

  return NextResponse.json({ licenseKey: license.key });
}
