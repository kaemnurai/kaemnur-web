"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string; icon: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const open = openIdx === idx;
        return (
          <div
            key={idx}
            className={cn(
              "overflow-hidden rounded-card border transition-colors",
              open ? "border-accent/40 bg-card" : "border-line bg-card/60 hover:bg-card"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                  open ? "bg-accent/15 text-accent" : "bg-line/60 text-fg-sub"
                )}
              >
                <Icon name={item.icon as never} size={16} />
              </span>
              <span className={cn("flex-1 text-[14px] font-medium", open ? "text-fg" : "text-fg")}>
                {item.q}
              </span>
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center text-[18px] leading-none transition-colors",
                  open ? "text-accent" : "text-fg-muted"
                )}
              >
                {open ? "−" : "+"}
              </span>
            </button>
            {open && (
              <div className="px-4 pb-4 pl-16 text-[13px] leading-relaxed text-fg-sub">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
