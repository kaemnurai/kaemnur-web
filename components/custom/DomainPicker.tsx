"use client";

import { useState } from "react";
import { DOMAINS, formatIDR, type DomainChoice } from "./estimate";

export function DomainPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q ? DOMAINS.filter((d) => d.label.toLowerCase().includes(q)) : DOMAINS;
  const isFallback = (d: DomainChoice) => d.key === "own" || d.key === "unknown";
  const priced = filtered.filter((d) => !isFallback(d));
  const fallback = filtered.filter(isFallback);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.75}
          stroke="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cw-fg-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ekstensi domain, contoh: .com, .id, .my.id"
          className="w-full rounded-btn border border-cw-line bg-cw-bg py-2.5 pl-9 pr-3 text-sm text-cw-fg outline-none placeholder:text-cw-fg-muted focus:border-cw-navy/60"
        />
      </div>

      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {priced.map((d) => (
          <DomainRow key={d.key} domain={d} active={selected === d.key} onSelect={onSelect} />
        ))}
        {priced.length === 0 && (
          <p className="py-3 text-center text-sm text-cw-fg-muted">Tidak ada ekstensi yang cocok.</p>
        )}
      </div>

      {fallback.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-cw-line pt-3">
          {fallback.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelect(d.key)}
              aria-pressed={selected === d.key}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selected === d.key
                  ? "border-cw-navy bg-cw-navy-soft text-cw-navy"
                  : "border-cw-line text-cw-fg-sub hover:border-cw-navy/30"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-cw-fg-muted">
        Harga domain mengikuti estimasi Rumahweb dan dapat berubah sewaktu-waktu.
      </p>
    </div>
  );
}

function DomainRow({
  domain,
  active,
  onSelect,
}: {
  domain: DomainChoice;
  active: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(domain.key)}
      aria-pressed={active}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
        active ? "border-cw-navy bg-cw-navy-soft" : "border-cw-line bg-cw-bg hover:border-cw-navy/30"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-cw-fg">{domain.label}</span>
        {domain.promo && (
          <span className="rounded-full bg-cw-orange-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cw-orange-hover">
            Promo
          </span>
        )}
      </span>
      <span className="text-right">
        <span className="block text-sm font-bold text-cw-navy">{formatIDR(domain.firstYear)}</span>
        {domain.renewal && (
          <span className="block text-[11px] text-cw-fg-muted">
            Perpanjangan {formatIDR(domain.renewal)}/th
          </span>
        )}
      </span>
    </button>
  );
}
