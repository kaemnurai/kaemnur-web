"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type InstallerOption = {
  id: string;
  platform: string;
  version: string;
  fileSize: number;
};

const PLATFORM_META: Record<string, { label: string; icon: React.ComponentProps<typeof Icon>["name"] }> = {
  WINDOWS: { label: "Windows", icon: "monitor" },
  MAC:     { label: "macOS",   icon: "apple" },
  LINUX:   { label: "Linux",   icon: "linux" },
};

export function PlatformDownload({
  productId,
  installers,
}: {
  productId: string;
  installers: InstallerOption[];
}) {
  // Deduplicate to one installer per platform (take first/latest)
  const byPlatform = new Map<string, InstallerOption>();
  for (const inst of installers) {
    if (!byPlatform.has(inst.platform)) byPlatform.set(inst.platform, inst);
  }
  const options = Array.from(byPlatform.values());

  const [selected, setSelected] = useState<string>(options[0]?.platform ?? "");
  const current = byPlatform.get(selected) ?? options[0] ?? null;

  if (options.length === 0) {
    return (
      <button
        type="button"
        disabled
        title="Installer belum tersedia"
        className="mt-4 flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-btn bg-line text-[13px] font-semibold text-fg-muted"
      >
        <Icon name="download" size={15} />
        Installer belum tersedia
      </button>
    );
  }

  const href = current
    ? `/api/download?productId=${productId}&platform=${current.platform.toLowerCase()}`
    : "#";

  return (
    <div className="mt-4 space-y-2">
      {/* Platform tabs — only show if more than one platform */}
      {options.length > 1 && (
        <div className="flex gap-1 rounded-btn border border-line bg-bg p-1">
          {options.map((opt) => {
            const meta = PLATFORM_META[opt.platform];
            return (
              <button
                key={opt.platform}
                type="button"
                onClick={() => setSelected(opt.platform)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-medium transition-colors",
                  selected === opt.platform
                    ? "bg-card text-fg shadow-card"
                    : "text-fg-sub hover:text-fg"
                )}
              >
                {meta && <Icon name={meta.icon} size={12} />}
                {meta?.label ?? opt.platform}
              </button>
            );
          })}
        </div>
      )}

      {/* Download button */}
      <a
        href={href}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
      >
        <Icon name="download" size={15} />
        Install · Free
        {current && current.fileSize > 0 && (
          <span className="text-bg/70">· {formatBytes(current.fileSize)}</span>
        )}
      </a>
    </div>
  );
}
