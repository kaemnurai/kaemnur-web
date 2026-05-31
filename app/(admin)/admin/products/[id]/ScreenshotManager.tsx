"use client";

import { useRef, useState } from "react";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { createScreenshot, removeScreenshot } from "@/app/(admin)/admin/actions";

type Shot = { id: string; url: string };

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export function ScreenshotManager({
  productId,
  productSlug,
  initial,
}: {
  productId: string;
  productSlug: string;
  initial: Shot[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Shot[]>(initial.map((s) => ({ id: s.id, url: s.url })));
  const [uploads, setUploads] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: File[]) {
    for (const file of files) {
      if (!ACCEPT.includes(file.type)) {
        toast(`${file.name}: format harus PNG, JPG, atau WEBP.`, "error");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast(`${file.name}: ukuran maksimal 5MB.`, "error");
        continue;
      }
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploads((u) => [...u, tempId]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("productSlug", productSlug);
        const res = await fetch("/api/admin/upload/screenshot", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Upload gagal.");
        const created = await createScreenshot(productId, data.url);
        setItems((it) => [...it, { id: created.id, url: created.url }]);
        toast("Screenshot ditambahkan", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Upload gagal.", "error");
      } finally {
        setUploads((u) => u.filter((id) => id !== tempId));
      }
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus screenshot ini?")) return;
    setDeleting(id);
    try {
      await removeScreenshot(id, productId);
      setItems((it) => it.filter((s) => s.id !== id));
      toast("Screenshot dihapus", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus.", "error");
    } finally {
      setDeleting(null);
    }
  }

  const empty = items.length === 0 && uploads.length === 0;

  return (
    <div
      className="rounded-card border border-line bg-card p-5"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-fg">Screenshots</h2>
          <p className="text-[12px] text-fg-sub">
            PNG, JPG atau WEBP. Maks 5MB per file. Drag &amp; drop untuk mengurutkan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
        >
          <Icon name="upload" size={13} />
          Upload screenshot
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {empty ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={
            "flex w-full flex-col items-center justify-center gap-2 rounded-btn border-2 border-dashed py-12 text-[13px] text-fg-sub transition-colors " +
            (dragOver ? "border-accent" : "border-line hover:border-fg-muted")
          }
        >
          <Icon name="image" size={22} className="text-fg-muted" />
          Belum ada screenshot. Klik atau drop gambar untuk upload.
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <div key={s.id} className="group relative">
              <ResponsiveImage
                src={s.url}
                alt={`Screenshot ${i + 1}`}
                aspectRatio="16/10"
                transparent={false}
                sizes="(max-width: 1024px) 50vw, 240px"
                containerClassName="border border-line"
              />
              <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded bg-bg/80 text-[11px] font-semibold text-fg">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                disabled={deleting === s.id}
                title="Hapus screenshot"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded bg-danger/80 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100 disabled:opacity-100"
              >
                {deleting === s.id ? <Spinner className="h-4 w-4" /> : <Icon name="trash" size={14} />}
              </button>
            </div>
          ))}
          {uploads.map((id) => (
            <div
              key={id}
              className="grid aspect-[16/10] place-items-center rounded-xl border border-dashed border-line bg-[#0F1419] text-accent"
            >
              <Spinner />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
