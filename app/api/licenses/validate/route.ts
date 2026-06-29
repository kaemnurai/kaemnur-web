import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

// POST /api/licenses/validate
// Used by desktop apps to bind a license to a device once online.
// Body: { key, deviceId, platform, checkOnly?, productSlug? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "").trim().toUpperCase();
  const deviceId = String(body?.deviceId ?? "").trim();
  const platformRaw = String(body?.platform ?? "").trim().toUpperCase();
  const platform = ["WINDOWS", "MAC", "LINUX", "WEB", "ANDROID"].includes(platformRaw) ? platformRaw : null;
  const checkOnly = body?.checkOnly === true;
  const productSlug = String(body?.productSlug ?? body?.product ?? "").trim().toLowerCase();

  if (!key || !deviceId) {
    return json({ valid: false, reason: "Kunci dan ID perangkat wajib diisi." }, { status: 400 });
  }

  if (checkOnly) {
    const license = await prisma.license.findUnique({
      where: { key },
      select: {
        isActivated: true,
        deviceId: true,
        buyerName: true,
        activatedAt: true,
        product: { select: { name: true, slug: true } },
      },
    });

    if (license && productSlug && license.product.slug !== productSlug) {
      return json({ valid: false, reason: "Kunci lisensi bukan untuk produk ini." });
    }

    if (license && license.isActivated && license.deviceId && license.deviceId === deviceId) {
      return json({
        valid: true,
        buyerName: license.buyerName,
        product: license.product.name,
        productSlug: license.product.slug,
        activatedAt: license.activatedAt,
      });
    }

    return json({ valid: false, reason: "not_activated" });
  }

  if (!verifyLicenseKey(key)) {
    return json({ valid: false, reason: "Kunci lisensi tidak valid." });
  }

  const license = await prisma.license.findUnique({
    where: { key },
    include: { product: { select: { name: true, slug: true } } },
  });

  if (!license) {
    return json({ valid: false, reason: "Kunci tidak terdaftar." });
  }

  if (productSlug && license.product.slug !== productSlug) {
    return json({ valid: false, reason: "Kunci lisensi bukan untuk produk ini." });
  }

  if (license.isActivated) {
    if (license.deviceId && license.deviceId === deviceId) {
      return json({
        valid: true,
        buyerName: license.buyerName,
        product: license.product.name,
        productSlug: license.product.slug,
        issuedAt: license.createdAt,
        activatedAt: license.activatedAt,
      });
    }

    return json({
      valid: false,
      reason: "Lisensi sudah diaktifkan di perangkat lain. Hubungi admin untuk reset.",
    });
  }

  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      isActivated: true,
      deviceId,
      activatedPlatform: platform,
      activatedAt: new Date(),
    },
  });

  return json({
    valid: true,
    buyerName: updated.buyerName,
    product: license.product.name,
    productSlug: license.product.slug,
    issuedAt: updated.createdAt,
    activatedAt: updated.activatedAt,
  });
}
