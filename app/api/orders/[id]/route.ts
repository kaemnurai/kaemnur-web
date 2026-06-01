import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/orders/[id] — single order detail (owner only).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { slug: true, logoUrl: true } },
      license: { select: { key: true } },
    },
  });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    productName: order.productName,
    productSlug: order.product.slug,
    productLogoUrl: order.product.logoUrl,
    amount: order.amount,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt.toISOString(),
    licenseKey: order.status === "SUDAH_DIBAYAR" ? order.license?.key ?? null : null,
  });
}
