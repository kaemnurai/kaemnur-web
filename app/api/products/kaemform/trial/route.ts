import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

const TRIAL_DAYS = 14;

// POST /api/products/kaemform/trial — grants a one-time 14-day KaemForm
// trial license to the signed-in user.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { slug: "kaemform" } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  const existing = await prisma.license.findFirst({
    where: { productId: product.id, userId: user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Trial KaemForm sudah pernah diklaim." }, { status: 409 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  const displayName =
    profile?.displayName ??
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  let key = generateLicenseKey();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.license.findUnique({ where: { key } });
    if (!exists) break;
    key = generateLicenseKey();
  }

  const license = await prisma.license.create({
    data: {
      key,
      productId: product.id,
      userId: user.id,
      buyerName: displayName,
      buyerWhatsapp: "",
      isActivated: false,
      expiresAt,
    },
  });

  return NextResponse.json({ expiresAt: license.expiresAt });
}
