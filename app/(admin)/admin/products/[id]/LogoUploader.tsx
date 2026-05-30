"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveProductLogo } from "@/app/(admin)/admin/actions";

const BUCKET = "product-logos";

export function LogoUploader({
  productId,
  initialLogoUrl,
  initial,
}: {
  productId: string;
  initialLogoUrl: string | null;
  initial: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("PNG, JPG or WEBP only");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Max 2MB");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${productId}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      await saveProductLogo(productId, url);
      setLogoUrl(url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Upload logo (PNG/JPG/WEBP, max 2MB)"
        className="group relative grid h-16 w-16 place-items-center overflow-hidden rounded-card border border-line bg-card text-[26px] font-bold text-accent transition-colors hover:border-accent/60"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
        <span className="absolute inset-0 grid place-items-center bg-bg/70 text-[10px] font-medium text-fg opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? "…" : "Change"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="mt-1 max-w-[120px] text-[10px] text-danger">{error}</p>}
    </div>
  );
}
