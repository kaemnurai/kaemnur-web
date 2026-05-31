import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { uploadToR2Assets, isR2AssetsConfigured } from "@/lib/r2-assets";
import { parseImageUpload } from "@/lib/upload-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/upload/hero — homepage hero image (max 5MB).
// Prefer PNG/WEBP (transparent backgrounds); JPG/JPEG accepted as a fallback.
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
  const parsed = await parseImageUpload(form, 5 * 1024 * 1024);
  if (!parsed.ok) return parsed.response;

  try {
    const key = `heroes/${parsed.slug}/hero.${parsed.ext}`;
    const url = await uploadToR2Assets(parsed.buffer, key, parsed.file.type);
    return NextResponse.json({ url: `${url}?v=${Date.now()}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
