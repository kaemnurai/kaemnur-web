"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Screenshot = { id: string; url: string };

export function ScreenshotGallery({
  screenshots,
  productName = "Product",
  accentBg = "bg-card",
  accentFg = "text-fg-muted",
}: {
  screenshots: Screenshot[];
  productName?: string;
  accentBg?: string;
  accentFg?: string;
}) {
  const [active, setActive] = useState(0);

  if (screenshots.length === 0) {
    return (
      <div className={cn("grid aspect-video w-full place-items-center rounded-card border border-line", accentBg)}>
        <span className={cn("text-7xl font-extrabold opacity-30", accentFg)}>
          {productName[0]}
        </span>
      </div>
    );
  }

  const current = screenshots[Math.min(active, screenshots.length - 1)];

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-line bg-bg">
        <div className="aspect-video w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={current.url}
            alt="Screenshot"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {screenshots.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {screenshots.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "h-14 w-24 shrink-0 overflow-hidden rounded-btn border bg-bg transition-colors",
                  i === active ? "border-accent" : "border-line hover:border-fg-muted"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.url}
                  alt=""
                  className={cn("h-full w-full object-cover", i !== active && "opacity-60")}
                />
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[12px] text-fg-sub">
            {active + 1} / {screenshots.length}
          </span>
        </div>
      )}
    </div>
  );
}
