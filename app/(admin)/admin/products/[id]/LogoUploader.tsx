"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

// Product logo uploader. Uploads to Cloudflare R2 (assets bucket) via the admin
// API, stores the URL in a hidden field submitted with the General form, and
// persists on "Save changes".
export function LogoUploader({
  productSlug,
  initialLogoUrl,
  initial,
}: {
  productSlug: string;
  initialLogoUrl: string | null;
  initial: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast("Format harus PNG, JPG, atau WEBP.", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Ukuran logo maksimal 2MB.", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productSlug", productSlug);
      const res = await fetch("/api/admin/upload/logo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload gagal.");
      setLogoUrl(data.url);
      setPreviewUrl(`${data.url}?v=${Date.now()}`);
      toast("Logo berhasil diupload", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload gagal.", "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="shrink-0">
      {/* Submitted with the General form on "Save changes" */}
      <input type="hidden" name="logoUrl" form="general-form" value={logoUrl ?? ""} readOnly />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Ganti logo (PNG/JPG/WEBP, max 2MB)"
        className="group relative grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-card border border-line bg-card text-[26px] font-bold text-accent transition-colors hover:border-accent/60"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          initial
        )}

        {/* Hover overlay */}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/50 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Icon name="camera" size={16} />
          Ganti logo
        </span>

        {/* Uploading spinner */}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60">
            <Spinner className="h-5 w-5 text-white" />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
