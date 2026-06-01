import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/orders?status= — all orders (admin), optionally filtered.
export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const where: Prisma.OrderWhereInput = {};
  if (
    status === "BELUM_BAYAR" ||
    status === "MENUNGGU_KONFIRMASI" ||
    status === "SUDAH_DIBAYAR" ||
    status === "DIBATALKAN"
  ) {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { slug: true, logoUrl: true } },
      license: { select: { key: true } },
    },
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      productName: o.productName,
      productSlug: o.product.slug,
      productLogoUrl: o.product.logoUrl,
      amount: o.amount,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      createdAt: o.createdAt.toISOString(),
      paidClickedAt: o.paidClickedAt ? o.paidClickedAt.toISOString() : null,
      approvedAt: o.approvedAt ? o.approvedAt.toISOString() : null,
      approvedBy: o.approvedBy,
      licenseKey: o.license?.key ?? null,
    }))
  );
}
