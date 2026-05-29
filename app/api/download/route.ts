import { NextRequest, NextResponse } from "next/server";
import { Platform } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Supports two call patterns:
//   ?id=<installerId>           — direct installer link (used from admin / legacy)
//   ?productId=X&platform=windows — platform-based lookup (used from product page)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const directId = searchParams.get("id");
  const productId = searchParams.get("productId");
  const platformRaw = searchParams.get("platform")?.toUpperCase();

  let installer: { id: string; productId: string; fileUrl: string; platform: Platform } | null =
    null;

  if (directId) {
    installer = await prisma.installer.findUnique({
      where: { id: directId },
      select: { id: true, productId: true, fileUrl: true, platform: true },
    });
  } else if (productId && platformRaw) {
    const platform = Object.values(Platform).find((p) => p === platformRaw) ?? null;
    if (!platform) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    // Latest installer for this product+platform
    installer = await prisma.installer.findFirst({
      where: { productId, platform },
      orderBy: { createdAt: "desc" },
      select: { id: true, productId: true, fileUrl: true, platform: true },
    });
  } else {
    return NextResponse.json(
      { error: "Provide ?id=<installerId> or ?productId=X&platform=windows" },
      { status: 400 }
    );
  }

  if (!installer) {
    return NextResponse.json({ error: "Installer not found" }, { status: 404 });
  }

  // Log the download + increment counter in parallel
  await Promise.all([
    prisma.downloadLog.create({
      data: { productId: installer.productId, platform: installer.platform },
    }),
    prisma.product.update({
      where: { id: installer.productId },
      data: { downloadCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.redirect(installer.fileUrl);
}
