"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function RevealKey({ fullKey }: { fullKey: string }) {
  const masked =
    fullKey.split("-").length === 4
      ? `${fullKey.split("-")[0]}-${fullKey.split("-")[1]}-****-****`
      : fullKey;

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px] text-fg">
        {revealed ? fullKey : masked}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="text-[11px] font-medium text-accent hover:underline"
      >
        {revealed ? "Sembunyikan" : "Tampilkan"}
      </button>
      <button
        type="button"
        onClick={copyKey}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-sub hover:text-fg"
      >
        <Icon name="copy" size={12} />
        {copied ? "Tersalin!" : "Salin"}
      </button>
    </div>
  );
}
