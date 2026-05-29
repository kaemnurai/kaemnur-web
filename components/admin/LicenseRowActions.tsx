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

  return (
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
    </div>
  );
}
