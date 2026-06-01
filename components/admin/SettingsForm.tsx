"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

type Initial = {
  qrisImageUrl: string | null;
  qrisName: string | null;
  adminWhatsapp: string | null;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(initial.qrisImageUrl);
  const [qrisName, setQrisName] = useState(initial.qrisName ?? "");
  const [adminWhatsapp, setAdminWhatsapp] = useState(initial.adminWhatsapp ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast("Format harus PNG atau JPG.", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Ukuran maksimal 5MB.", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/qris", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload gagal.");
      setQrisUrl(data.url);
      toast("QRIS berhasil diupload", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload gagal.", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrisName: qrisName.trim(), adminWhatsapp: adminWhatsapp.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Gagal menyimpan.");
      }
      toast("Pengaturan disimpan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* QRIS */}
      <div className="rounded-card border border-line bg-card p-5">
        <h2 className="text-[14px] font-semibold text-fg">QRIS Pembayaran</h2>
        <p className="mt-0.5 text-[12px] text-fg-sub">
          Gambar QRIS yang ditampilkan ke pembeli saat checkout. PNG/JPG, maks 5MB.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative grid h-44 w-44 shrink-0 place-items-center overflow-hidden rounded-card border border-line bg-bg">
            {qrisUrl ? (
              <Image src={qrisUrl} alt="QRIS" fill sizes="176px" className="object-contain p-2" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-fg-muted">
                <Icon name="image" size={26} />
                <span className="text-[11px]">Belum ada QRIS</span>
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 grid place-items-center bg-black/60">
                <Spinner className="text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-bg px-3 text-[12px] font-medium text-fg-sub transition-colors hover:border-fg-muted hover:text-fg disabled:opacity-50"
            >
              <Icon name="upload" size={13} />
              Upload QRIS
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <div>
              <label htmlFor="qrisName" className="mb-1 block text-[12px] font-medium text-fg-sub">
                Nama Merchant
              </label>
              <input
                id="qrisName"
                value={qrisName}
                onChange={(e) => setQrisName(e.target.value)}
                placeholder="cth. Kaemnur Store"
                className="h-9 w-full rounded-btn border border-line bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin WhatsApp */}
      <div className="rounded-card border border-line bg-card p-5">
        <h2 className="text-[14px] font-semibold text-fg">WhatsApp Admin</h2>
        <p className="mt-0.5 text-[12px] text-fg-sub">Nomor tujuan tombol Hubungi Admin.</p>
        <div className="mt-4">
          <label htmlFor="adminWa" className="mb-1 block text-[12px] font-medium text-fg-sub">
            Nomor WhatsApp Admin
          </label>
          <input
            id="adminWa"
            value={adminWhatsapp}
            onChange={(e) => setAdminWhatsapp(e.target.value)}
            placeholder="6282111990423"
            inputMode="tel"
            className="h-9 w-full max-w-xs rounded-btn border border-line bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-btn bg-accent px-5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" size={14} />}
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
