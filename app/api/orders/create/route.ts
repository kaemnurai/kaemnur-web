import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueOrderNumber } from "@/lib/orders";

export const dynamic = "force-dynamic";

// POST /api/orders/create — body { productId }. Creates a BELUM_BAYAR order.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  if (!productId) return NextResponse.json({ error: "Produk wajib diisi." }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  if (product.priceAmount == null) {
    return NextResponse.json({ error: "Produk ini tidak memiliki versi PRO." }, { status: 400 });
  }

  const displayName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  // Ensure the profile exists (FK + name prefill) — lazy-create like the
  // community flow does for users without an OAuth callback.
  const profile = await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      displayName,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: {},
  });

  const orderNumber = await generateUniqueOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      productId: product.id,
      productName: product.name,
      amount: product.priceAmount,
      customerName: profile.displayName ?? displayName,
      customerPhone: "",
    },
  });

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
