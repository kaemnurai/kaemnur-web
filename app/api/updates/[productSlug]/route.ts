import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPlatform } from "@/lib/installers";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const cacheHeaders = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/updates/{productSlug}?platform=WINDOWS
// Used by desktop apps (KaemExcel, KaemPDF/KaemDocs, KaemBot, Winur Family
// Hub, KaemPhoto, …) to check for the latest installer. Always 200 with a
// real release, or 404 — never 200 with a null/empty payload.
export async function GET(
  req: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  const productSlug = params.productSlug?.trim().toLowerCase();
  const platform = req.nextUrl.searchParams.get("platform")?.trim().toUpperCase() ?? "";

  if (!productSlug || !isValidPlatform(platform)) {
    return json({ error: "not_found" }, { status: 404 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: { id: true },
  });
  if (!product) {
    return json({ error: "not_found" }, { status: 404 });
  }

  const installer = await prisma.installer.findFirst({
    where: { productId: product.id, platform },
    orderBy: { createdAt: "desc" },
    select: { version: true, fileUrl: true, sha256: true, fileSize: true },
  });

  // sha256 is NOT NULL in the schema, but guard defensively anyway — a
  // release must never be served without a verifiable checksum.
  if (!installer || !installer.sha256) {
    return json({ error: "not_found" }, { status: 404 });
  }

  const changelog = await prisma.changelog.findFirst({
    where: { productId: product.id, version: installer.version },
    orderBy: { releasedAt: "desc" },
    select: { notes: true },
  });

  return json(
    {
      version: installer.version,
      url: installer.fileUrl,
      sha256: installer.sha256,
      fileSize: installer.fileSize,
      changelog: changelog?.notes ?? "",
    },
    { headers: cacheHeaders }
  );
}
