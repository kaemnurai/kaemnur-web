import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/orders — current user's orders, newest first.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
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
      licenseKey: o.status === "SUDAH_DIBAYAR" ? o.license?.key ?? null : null,
    }))
  );
}
