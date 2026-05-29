import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

// POST /api/licenses/validate
// Called by the KaemDocs desktop app to bind a license to a device (online).
// Offline HMAC validation still happens inside the app itself; this endpoint
// adds central device binding + one-device enforcement.
//
// Body: { key, deviceId, platform, checkOnly? }
// Returns { valid: true, buyerName, product, issuedAt, activatedAt }
//      or { valid: false, reason }
//
// checkOnly === true  → pemeriksaan READ-ONLY (dipanggil app KaemDocs tiap startup).
//   Tidak pernah menulis ke database. Hanya mengonfirmasi lisensi masih aktif
//   dan terikat ke perangkat yang sama. Dipakai untuk mendeteksi reset/revoke.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "").trim().toUpperCase();
  const deviceId = String(body?.deviceId ?? "").trim();
  const platformRaw = String(body?.platform ?? "").trim().toUpperCase();
  const platform = ["WINDOWS", "MAC", "LINUX"].includes(platformRaw) ? platformRaw : null;
  const checkOnly = body?.checkOnly === true;

  if (!key || !deviceId) {
    return NextResponse.json(
      { valid: false, reason: "Kunci dan ID perangkat wajib diisi." },
      { status: 400 }
    );
  }

  // ── Pemeriksaan READ-ONLY (checkOnly) ──────────────────────────────────
  // Tidak mengubah field apa pun (deviceId/isActivated/activatedAt). Satu kali
  // baca DB ber-index → cepat (< 2 detik). Tidak menyentuh logika aktivasi.
  if (checkOnly) {
    const license = await prisma.license.findUnique({
      where: { key },
      select: { isActivated: true, deviceId: true, buyerName: true, activatedAt: true },
    });

    if (license && license.isActivated && license.deviceId && license.deviceId === deviceId) {
      return NextResponse.json({
        valid: true,
        buyerName: license.buyerName,
        activatedAt: license.activatedAt,
      });
    }
    // Tidak terdaftar / direset / dicabut / pindah perangkat → tidak aktif.
    return NextResponse.json({ valid: false, reason: "not_activated" });
  }

  // 1) Offline-style signature check first — reject forged/typo'd keys cheaply.
  if (!verifyLicenseKey(key)) {
    return NextResponse.json({ valid: false, reason: "Kunci lisensi tidak valid." });
  }

  // 2) Key must exist in our records.
  const license = await prisma.license.findUnique({
    where: { key },
    include: { product: { select: { name: true } } },
  });
  if (!license) {
    return NextResponse.json({ valid: false, reason: "Kunci tidak terdaftar." });
  }

  // 3) Already activated?
  if (license.isActivated) {
    if (license.deviceId && license.deviceId === deviceId) {
      // Same device re-activating (e.g. reinstall) — allow.
      return NextResponse.json({
        valid: true,
        buyerName: license.buyerName,
        product: license.product.name,
        issuedAt: license.createdAt,
        activatedAt: license.activatedAt,
      });
    }
    return NextResponse.json({
      valid: false,
      reason: "Lisensi sudah diaktifkan di perangkat lain. Hubungi admin untuk reset.",
    });
  }

  // 4) First activation — bind to this device.
  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      isActivated: true,
      deviceId,
      activatedPlatform: platform,
      activatedAt: new Date(),
    },
  });

  return NextResponse.json({
    valid: true,
    buyerName: updated.buyerName,
    product: license.product.name,
    issuedAt: updated.createdAt,
    activatedAt: updated.activatedAt,
  });
}
