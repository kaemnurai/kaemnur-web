"use client";

import { useState } from "react";
import Image from "next/image";
import { CATEGORIES, type Category } from "./estimate";
import { PreviewLightbox, type PreviewItem } from "./PreviewLightbox";
import { MockPreview } from "./MockPreview";

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  website: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  ),
  webapp: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  ),
  desktop: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 20h8M12 17v3" />
    </svg>
  ),
};

const ORDER: Category[] = ["website", "webapp", "desktop"];

// Real screenshots where available; coded mockups fill out the spec's full
// item lists for categories that don't have a screenshot asset yet.
const CATEGORY_ITEMS: Record<Category, PreviewItem[]> = {
  website: [
    { key: "toko-online", label: "Toko Online", src: "/custom/website/toko-online.png" },
    { key: "bisnis", label: "Bisnis / Company Profile", src: "/custom/website/bisnis.png" },
    { key: "portofolio", label: "Portfolio", src: "/custom/website/portofolio.png" },
    { key: "event", label: "Event", src: "/custom/website/event.png" },
    { key: "blog", label: "Blog", src: "/custom/website/blog.png" },
  ],
  webapp: [
    { key: "kasir", label: "Kasir / POS", src: "/custom/webapp/kasir.png" },
    { key: "absensi", label: "Absensi", src: "/custom/webapp/absensi.png" },
    { key: "data-master", label: "Data Master", src: "/custom/webapp/data-master.png" },
    { key: "inventaris", label: "Inventaris & Laporan", src: "/custom/webapp/inventaris.png" },
    { key: "dashboard-admin", label: "Dashboard Admin", mock: "dashboard" },
    { key: "form-laporan", label: "Form Input + Laporan", mock: "dashboard" },
  ],
  desktop: [
    { key: "tools-desktop", label: "Tools Desktop", src: "/custom/tools-desktop.png" },
    { key: "tools-excel", label: "Tools Excel", mock: "desktop" },
    { key: "tools-pdf", label: "Tools PDF", mock: "desktop" },
    { key: "converter", label: "Converter", mock: "desktop" },
    { key: "automation", label: "Automation", mock: "desktop" },
    { key: "offline", label: "Offline App", mock: "desktop" },
  ],
};

export function CategoryShowcase({
  active,
  onSelect,
}: {
  active: Category;
  onSelect: (c: Category) => void;
}) {
  // Only surface previews that have a real screenshot asset. Items still on a
  // coded mockup placeholder (no `src`) are hidden until their image exists —
  // the entries stay in CATEGORY_ITEMS so they reappear automatically once an
  // asset is dropped in. The badge count and lightbox both read this filtered
  // list, so they always match what is actually shown.
  const items = CATEGORY_ITEMS[active].filter((item) => Boolean(item.src));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {/* ── Top: category chooser ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {ORDER.map((key) => {
          const cat = CATEGORIES[key];
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-pressed={isActive}
              className={`group flex flex-col items-start rounded-card border p-5 text-left transition-all sm:p-6 ${
                isActive
                  ? "border-cw-navy bg-cw-navy-soft shadow-card-lg ring-1 ring-cw-navy/30"
                  : "border-cw-line bg-cw-card hover:border-cw-navy/30 hover:bg-cw-bg-soft"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                  isActive ? "bg-cw-navy text-white" : "bg-cw-navy-soft text-cw-navy"
                }`}
              >
                {CATEGORY_ICON[key]}
              </span>
              <h3 className="mt-4 text-base font-semibold text-cw-fg sm:text-lg">{cat.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cw-fg-sub">{cat.desc}</p>
              <span
                className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isActive ? "text-cw-navy" : "text-cw-fg-muted group-hover:text-cw-navy"
                }`}
              >
                {isActive ? "✓ Dipilih" : "Pilih kategori ini"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bottom: preview gallery that follows the chosen category ── */}
      <div className="mt-8 rounded-card border border-cw-line bg-cw-bg-soft/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-cw-fg sm:text-lg">
              Contoh Tampilan — {CATEGORIES[active].label}
            </h3>
            <p className="mt-1 text-sm text-cw-fg-sub">
              Klik salah satu untuk lihat lebih detail (fullscreen).
            </p>
          </div>
          <span className="rounded-full border border-cw-line bg-cw-card px-3 py-1 text-xs font-medium text-cw-fg-muted">
            {items.length} contoh
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group overflow-hidden rounded-card border border-cw-line bg-cw-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-cw-bg-soft">
                {item.src ? (
                  <Image
                    src={item.src}
                    alt={`Preview ${item.label}`}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.02]">
                    <MockPreview variant={item.mock ?? "site"} />
                  </div>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  Fullscreen ⤢
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-cw-fg">{item.label}</span>
                <span className="text-xs font-medium text-cw-navy opacity-0 transition-opacity group-hover:opacity-100">
                  Lihat →
                </span>
              </div>
            </button>
          ))}
        </div>

        {active === "desktop" && (
          <p className="mt-5 text-xs text-cw-fg-muted">
            Tools desktop berjalan native di Windows — mencakup tools Excel/PDF, converter,
            automation, dan aplikasi offline. Contoh tampilan lainnya menyusul.
          </p>
        )}
      </div>

      {openIndex !== null && (
        <PreviewLightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNext={() => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length))}
          onPrev={() => setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length))}
        />
      )}
    </div>
  );
}
