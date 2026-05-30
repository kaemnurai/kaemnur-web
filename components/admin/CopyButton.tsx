"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function CopyButton({ value, title = "Salin" }: { value: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-grid h-6 w-6 place-items-center rounded text-fg-muted hover:bg-card-hover hover:text-fg"
    >
      <Icon name={copied ? "check" : "copy"} size={13} className={copied ? "text-success" : undefined} />
    </button>
  );
}
