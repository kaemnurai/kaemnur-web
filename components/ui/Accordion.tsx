"use client";

import { useState } from "react";

export type AccordionItem = { q: string; a: string };

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
      {items.map((item, idx) => {
        const open = openIdx === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-hover"
            >
              <span className="text-[14px] font-medium text-fg">{item.q}</span>
              <span className="text-fg-muted">{open ? "−" : "+"}</span>
            </button>
            {open && (
              <div className="border-t border-line px-5 pb-4 pt-3 text-[13px] leading-relaxed text-fg-sub">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
