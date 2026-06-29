import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPlatform, LATEST_INSTALLER_ORDER } from "@/lib/installers";
import { recordDownloadEvent } from "@/lib/download-tracking";

export const dynamic = "force-dynamic";

// GET /api/downloads/{productSlug}?platform=WINDOWS
//
// Canonical public download endpoint. Resolves the LATEST installer for the
// product+platform (same logic as /api/updates), records one real download
// event, then redirects to the file. Public buttons point here instead of
// linking R2 directly, so:
//   • every click is counted exactly once (page views never count);
//   • only the latest release is ever served (old, possibly-buggy versions
//     cannot be downloaded by the public).
export async function GET(
  req: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  const slug = params.productSlug?.trim().toLowerCase();
  const platform = req.nextUrl.searchParams.get("platform")?.trim().toUpperCase() ?? "";

  if (!slug || !isValidPlatform(platform)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const installer = await prisma.installer.findFirst({
    where: { productId: product.id, platform },
    orderBy: LATEST_INSTALLER_ORDER,
    select: { id: true, fileUrl: true, platform: true },
  });
  if (!installer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await recordDownloadEvent(req, {
    productId: product.id,
    installerId: installer.id,
    platform: installer.platform,
  });

  return NextResponse.redirect(installer.fileUrl, 302);
}
