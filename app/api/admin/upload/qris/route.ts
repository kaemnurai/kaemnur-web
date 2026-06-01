import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { uploadToR2Assets, isR2AssetsConfigured } from "@/lib/r2-assets";
import { IMAGE_EXT } from "@/lib/upload-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/upload/qris — QRIS payment image (PNG/JPG, max 5MB).
// Stores at settings/qris.{ext} and saves the URL to AppSettings.qrisImageUrl.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2AssetsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Storage not configured. Contact admin to set R2_ASSETS_* environment variables in Vercel dashboard.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Tidak ada file yang diunggah." }, { status: 400 });
  }
  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format harus PNG atau JPG." }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran maksimal 5MB." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2Assets(buffer, `settings/qris.${ext}`, file.type);
    const versioned = `${url}?v=${Date.now()}`;
    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", qrisImageUrl: versioned },
      update: { qrisImageUrl: versioned },
    });
    return NextResponse.json({ url: versioned });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
