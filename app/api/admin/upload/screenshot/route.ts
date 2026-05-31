import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { uploadToR2Assets } from "@/lib/r2-assets";
import { parseImageUpload, sanitizeSegment } from "@/lib/upload-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/upload/screenshot — product screenshot (max 5MB, png/jpeg/webp)
export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const parsed = await parseImageUpload(form, 5 * 1024 * 1024);
  if (!parsed.ok) return parsed.response;

  try {
    const safeName = sanitizeSegment(parsed.file.name || `screenshot.${parsed.ext}`);
    const key = `screenshots/${parsed.slug}/${Date.now()}-${safeName}`;
    const url = await uploadToR2Assets(parsed.buffer, key, parsed.file.type);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
