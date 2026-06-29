"use client";

import { forwardRef } from "react";
import { CategoryShowcase } from "./CategoryShowcase";
import type { Category } from "./estimate";

export const NeedsSection = forwardRef<
  HTMLElement,
  { category: Category; onSelect: (c: Category) => void }
>(function NeedsSection({ category, onSelect }, ref) {
  return (
    <section
      ref={ref}
      className="scroll-mt-16 border-t border-cw-line bg-gradient-to-b from-[#EEF3FB] to-[#E7EDF6] px-6 py-14 sm:px-10 lg:px-20"
    >
      <div className="mx-auto max-w-[1680px]">
      {/* Heading */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cw-navy-soft text-cw-navy">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-cw-navy">
            Langkah 1
          </span>
          <h2 className="mt-0.5 text-lg font-bold text-cw-fg sm:text-xl">Pilih Kebutuhan Anda</h2>
          <p className="mt-0.5 text-sm text-cw-fg-sub">
            Tentukan jenis layanan yang paling sesuai, lalu lihat contoh tampilannya.
          </p>
        </div>
      </div>

      <CategoryShowcase active={category} onSelect={onSelect} />
      </div>
    </section>
  );
});
