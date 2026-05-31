"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Icon } from "@/components/ui/Icon";
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
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const count = screenshots.length;

  function go(next: number) {
    if (count <= 1) return;
    const idx = ((next % count) + count) % count;
    if (idx === active) return;
    setFading(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 120);
  }

  // Keyboard ← / → when the gallery is focused.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(active + 1);
      }
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count]);

  // Keep the active thumbnail scrolled into view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const el = strip.querySelector<HTMLElement>(`[data-thumb="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  useEffect(
    () => () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    },
    []
  );

  if (count === 0) {
    return (
      <div className={cn("grid aspect-[16/10] w-full place-items-center rounded-xl border border-line", accentBg)}>
        <span className={cn("text-7xl font-extrabold opacity-30", accentFg)}>{productName[0]}</span>
      </div>
    );
  }

  const current = screenshots[Math.min(active, count - 1)];

  return (
    <div ref={rootRef} tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-xl">
      {/* Main image — object-contain, never cropped at any viewport */}
      <ResponsiveImage
        src={current.url}
        alt={`${productName} screenshot ${active + 1}`}
        aspectRatio="16/10"
        transparent={false}
        priority={active === 0}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 720px"
        containerClassName={cn(
          "mx-auto max-h-[280px] transition-opacity duration-200 sm:max-h-[360px] lg:max-h-[480px]",
          fading ? "opacity-0" : "opacity-100"
        )}
      />

      {count > 1 && (
        <div className="mt-3 flex items-center gap-3">
          {/* Thumbnail strip */}
          <div ref={stripRef} className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {screenshots.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-thumb={i}
                onClick={() => go(i)}
                aria-label={`Screenshot ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative aspect-video h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 bg-[#0F1419] transition-all",
                  i === active
                    ? "border-[#F4B400]"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={s.url}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
              </button>
            ))}
          </div>

          {/* Prev / next + counter */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous screenshot"
              className="grid h-8 w-8 place-items-center rounded-md border border-line bg-card text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
            >
              <Icon name="arrow-left" size={14} />
            </button>
            <span className="min-w-[2.5rem] text-center text-[12px] tabular-nums text-fg-sub">
              {active + 1}/{count}
            </span>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next screenshot"
              className="grid h-8 w-8 place-items-center rounded-md border border-line bg-card text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
            >
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
