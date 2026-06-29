"use client";

import { useState } from "react";

export type ChangelogEntry = {
  id: string;
  version: string;
  notes: string;
  releasedAt: Date | string;
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ChangelogAccordion({ entries }: { entries: ChangelogEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(entries[0]?.id ?? null);

  if (entries.length === 0) {
    return <p className="text-[13px] text-fg-sub">No changelog entries yet.</p>;
  }

  return (
    <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
      {entries.map((entry, i) => {
        const open = openId === entry.id;
        // Entries are ordered newest-first: only the first is the live release;
        // the rest are history and are intentionally NOT downloadable.
        const isLatest = i === 0;
        return (
          <div key={entry.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : entry.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-card-hover"
            >
              <span className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[12px] text-accent">v{entry.version}</span>
                <span className="text-[12px] text-fg-sub">{formatDate(entry.releasedAt)}</span>
                {isLatest ? (
                  <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                    Versi terbaru
                  </span>
                ) : (
                  <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                    Versi lama
                  </span>
                )}
              </span>
              <span className="text-[14px] text-fg-sub">{open ? "−" : "+"}</span>
            </button>
            {open && (
              <div className="whitespace-pre-line border-t border-line px-4 pb-4 pt-3 text-[13px] leading-relaxed text-fg-sub">
                {entry.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
