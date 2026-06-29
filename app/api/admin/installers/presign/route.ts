import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isR2Configured, createPresignedUploadUrl, buildInstallerKey, publicUrl } from "@/lib/r2";
import { isValidPlatform } from "@/lib/installers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/installers/presign
// Returns a short-lived presigned PUT URL so the browser can upload the
// installer file straight to R2 — the file itself never passes through
// this (or any) Vercel function body.
// Body: { productId, platform, filename, contentType }
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Cloudflare R2 belum dikonfigurasi. Set CLOUDFLARE_R2_* di environment Vercel.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  const platform = String(body?.platform ?? "").trim().toUpperCase();
  const filename = String(body?.filename ?? "").trim();
  const contentType = String(body?.contentType ?? "").trim() || "application/octet-stream";

  if (!productId || !filename) {
    return NextResponse.json({ error: "productId dan filename wajib diisi." }, { status: 400 });
  }
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Platform tidak valid." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const key = buildInstallerKey(product.slug, filename);
    const uploadUrl = await createPresignedUploadUrl(key, contentType);
    return NextResponse.json({ uploadUrl, key, publicUrl: publicUrl(key) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat presigned URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
