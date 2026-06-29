import { NextRequest, NextResponse } from "next/server";
import { Platform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LATEST_INSTALLER_ORDER } from "@/lib/installers";
import { recordDownloadEvent } from "@/lib/download-tracking";

export const dynamic = "force-dynamic";

// Legacy download endpoint, kept for older/bookmarked links. New public buttons
// use /api/downloads/{slug}?platform=… instead. Either way, only the LATEST
// installer for a product+platform is ever served — old releases are blocked so
// users can't pull a stale, possibly-buggy binary.
//
// Supports two call patterns:
//   ?id=<installerId>             — direct installer link (resolved to its latest)
//   ?productId=X&platform=windows — platform-based lookup
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const directId = searchParams.get("id");
  const productId = searchParams.get("productId");
  const platformRaw = searchParams.get("platform")?.toUpperCase();

  let lookupProductId: string | null = null;
  let platform: Platform | null = null;

  if (directId) {
    const requested = await prisma.installer.findUnique({
      where: { id: directId },
      select: { productId: true, platform: true },
    });
    if (!requested) {
      return NextResponse.json({ error: "Installer not found" }, { status: 404 });
    }
    lookupProductId = requested.productId;
    platform = requested.platform;
  } else if (productId && platformRaw) {
    platform = Object.values(Platform).find((p) => p === platformRaw) ?? null;
    if (!platform) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    lookupProductId = productId;
  } else {
    return NextResponse.json(
      { error: "Provide ?id=<installerId> or ?productId=X&platform=windows" },
      { status: 400 }
    );
  }

  // Always resolve to the latest installer for this product+platform.
  const latest = await prisma.installer.findFirst({
    where: { productId: lookupProductId, platform },
    orderBy: LATEST_INSTALLER_ORDER,
    select: { id: true, productId: true, fileUrl: true, platform: true },
  });
  if (!latest) {
    return NextResponse.json({ error: "Installer not found" }, { status: 404 });
  }

  // If a specific (old) installer id was requested but it isn't the latest,
  // refuse — old versions are not downloadable by the public.
  if (directId && directId !== latest.id) {
    return NextResponse.json(
      { error: "This version is archived. Only the latest release can be downloaded." },
      { status: 410 }
    );
  }

  await recordDownloadEvent(req, {
    productId: latest.productId,
    installerId: latest.id,
    platform: latest.platform,
  });

  return NextResponse.redirect(latest.fileUrl, 302);
}
