"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type Props = {
  licenseId: string;
  fullKey: string;
  maskedKey: string;
  isActivated: boolean;
};

export function LicenseRowActions({ licenseId, fullKey, maskedKey, isActivated }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function copyKey() {
    await navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleReset() {
    const ok = window.confirm(
      `Reset lisensi ${maskedKey}? Pembeli dapat mengaktifkan ulang di perangkat baru.`
    );
    if (!ok) return;
    setResetting(true);
    try {
      const res = await fetch("/api/licenses/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Gagal mereset lisensi.");
      }
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    const activeWarning = isActivated
      ? "\n\n⚠️ Lisensi ini sedang aktif di perangkat pembeli.\nMenghapus akan mencabut akses PRO mereka saat pengecekan berikutnya."
      : "";

    const ok = window.confirm(
      `Hapus lisensi ${maskedKey}?\nTindakan ini permanen dan tidak dapat dibatalkan.\nPembeli tidak akan bisa menggunakan kunci ini lagi.${activeWarning}`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/licenses/${licenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Lisensi berhasil dihapus.");
        // Beri waktu sebentar agar toast terlihat, lalu refresh tabel.
        setTimeout(() => router.refresh(), 800);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Gagal menghapus lisensi.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Toast notifikasi */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-btn border border-success/30 bg-success/15 px-4 py-2.5 text-[13px] font-medium text-success shadow-card-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={copyKey}
          title="Salin kunci lengkap"
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-fg-sub hover:bg-card-hover hover:text-fg"
        >
          <Icon name="copy" size={12} />
          {copied ? "Tersalin!" : "Salin"}
        </button>

        {isActivated && (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-warning hover:bg-warning/10 disabled:opacity-60"
          >
            <Icon name="arrow-left" size={12} />
            {resetting ? "Mereset…" : "Reset"}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Hapus lisensi secara permanen"
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          <Icon name="trash" size={12} />
          {deleting ? "Menghapus…" : "Hapus"}
        </button>
      </div>
    </>
  );
}
