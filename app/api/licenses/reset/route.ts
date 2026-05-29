import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/licenses/reset  (admin only)
// Body: { licenseId }
// Unbinds the device so the buyer can re-activate on a new machine.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const licenseId = String(body?.licenseId ?? "").trim();
  if (!licenseId) {
    return NextResponse.json({ error: "licenseId wajib diisi." }, { status: 400 });
  }

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) {
    return NextResponse.json({ error: "Lisensi tidak ditemukan." }, { status: 404 });
  }

  await prisma.license.update({
    where: { id: licenseId },
    data: {
      isActivated: false,
      deviceId: null,
      activatedAt: null,
      activatedPlatform: null,
      resetAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
