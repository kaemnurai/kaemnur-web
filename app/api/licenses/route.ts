import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";

// All license data includes buyer info — admin only.
export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { productId, buyerName, buyerWhatsapp } = body ?? {};

  if (!productId || !buyerName || !buyerWhatsapp) {
    return NextResponse.json(
      { error: "productId, buyerName and buyerWhatsapp are required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Generate a unique key (retry on the rare collision).
  let key = generateLicenseKey();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.license.findUnique({ where: { key } });
    if (!exists) break;
    key = generateLicenseKey();
  }

  const license = await prisma.license.create({
    data: { key, productId, buyerName, buyerWhatsapp },
  });

  return NextResponse.json(license, { status: 201 });
}
