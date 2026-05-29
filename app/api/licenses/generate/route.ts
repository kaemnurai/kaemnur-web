import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

// POST /api/licenses/generate  (admin only)
// Body: { buyerName, buyerWhatsapp, productId }
// Generates a HMAC-signed key, stores it, returns { key, id }.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const buyerName = String(body?.buyerName ?? "").trim();
  const buyerWhatsapp = String(body?.buyerWhatsapp ?? "").trim();
  const productId = String(body?.productId ?? "").trim();

  if (!buyerName || !buyerWhatsapp || !productId) {
    return NextResponse.json(
      { error: "Nama pembeli, WhatsApp, dan produk wajib diisi." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  // Generate a unique key (retry on the rare collision).
  let key = generateLicenseKey();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.license.findUnique({ where: { key } });
    if (!exists) break;
    key = generateLicenseKey();
  }

  const license = await prisma.license.create({
    data: { key, productId, buyerName, buyerWhatsapp, isActivated: false },
  });

  return NextResponse.json({ key: license.key, id: license.id }, { status: 201 });
}
