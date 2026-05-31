"use client";

import { useRef, useState } from "react";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// Right-column card on the product General tab: featured toggle + hero image
// upload. Both submit with the General form ("Save changes").
export function FeaturedHeroCard({
  productSlug,
  initialHeroImageUrl,
  initialFeatured,
}: {
  productSlug: string;
  initialHeroImageUrl: string | null;
  initialFeatured: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(initialHeroImageUrl);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast("Format harus PNG, JPG, atau WEBP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Ukuran hero image maksimal 5MB.", "error");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productSlug", productSlug);
      const res = await fetch("/api/admin/upload/hero", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload gagal.");
      setHeroUrl(data.url);
      toast("Hero image berhasil diupload", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload gagal.", "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function removeHero() {
    if (!window.confirm("Hapus hero image dari produk ini?")) return;
    setHeroUrl(null);
    toast("Hero image dihapus. Klik Save changes untuk menyimpan.", "info");
  }

  return (
    <div className="rounded-card border border-line bg-card p-5">
      {/* Submitted with the General form on "Save changes" */}
      <input type="hidden" name="heroImageUrl" form="general-form" value={heroUrl ?? ""} readOnly />

      <h2 className="text-[14px] font-semibold text-fg">Featured &amp; Hero</h2>
      <p className="text-[12px] text-fg-sub">Tampilkan produk ini di halaman utama</p>

      <label className="mt-4 flex items-center gap-2 text-[13px] text-fg">
        <input
          type="checkbox"
          name="isFeatured"
          form="general-form"
          defaultChecked={initialFeatured}
          className="h-4 w-4 accent-[#F4B400]"
        />
        Featured on landing page
      </label>

      <div className="my-4 border-t border-line" />

      <p className="text-[12px] font-semibold text-fg">Hero Image</p>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-sub">
        Gambar hero homepage.{" "}
        <span className="font-semibold text-accent">
          WAJIB format PNG/WEBP dengan background TRANSPARAN
        </span>{" "}
        agar menyatu dengan hero section. Rekomendasi: 1200x800px, mockup
        laptop/device, max 5MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {heroUrl ? (
        <div className="mt-3">
          {/* Preview bg matches the homepage hero for an accurate preview */}
          <div className="relative">
            <ResponsiveImage
              src={heroUrl}
              alt="Hero preview"
              transparent
              aspectRatio="16/10"
              sizes="360px"
              containerClassName="max-h-48 bg-gradient-to-br from-[#1A1F2E] to-[#0F1419]"
            />
            {busy && (
              <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/60">
                <Spinner className="text-white" />
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-btn border border-accent/60 px-3 text-[12px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              <Icon name="image" size={13} />
              Ganti Gambar
            </button>
            <button
              type="button"
              onClick={removeHero}
              disabled={busy}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn border border-danger/50 px-3 text-[12px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            >
              <Icon name="trash" size={13} />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "mt-3 flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-[#0F1419] px-4 text-center transition-colors",
            dragOver ? "border-accent" : "border-[#2A2F3E] hover:border-fg-muted"
          )}
        >
          {busy ? (
            <Spinner className="text-accent" />
          ) : (
            <>
              <Icon name="upload" size={22} className="text-fg-muted" />
              <span className="text-[13px] font-medium text-fg">Upload Hero Image</span>
              <span className="text-[11px] text-fg-sub">
                💡 Tips: Gunakan PNG transparan agar gambar menyatu dengan hero
                section
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
