import { NextResponse } from "next/server";

// Shared parsing/validation for the admin image-upload routes.
export const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Replace anything unsafe for an object-key path segment with a hyphen. */
export function sanitizeSegment(input: string): string {
  return (
    input
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset"
  );
}

export type ParsedUpload =
  | { ok: true; file: File; buffer: Buffer; ext: string; slug: string }
  | { ok: false; response: NextResponse };

/** Validate FormData (file + productSlug), enforce type + size, return a Buffer. */
export async function parseImageUpload(
  form: FormData,
  maxBytes: number
): Promise<ParsedUpload> {
  const file = form.get("file");
  const slug = sanitizeSegment(String(form.get("productSlug") ?? ""));

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tidak ada file yang diunggah." }, { status: 400 }),
    };
  }
  if (!form.get("productSlug")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "productSlug wajib diisi." }, { status: 400 }),
    };
  }
  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Format harus PNG, JPG, atau WEBP." }, { status: 415 }),
    };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      response: NextResponse.json({ error: `Ukuran maksimal ${mb}MB.` }, { status: 413 }),
    };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true, file, buffer, ext, slug };
}
