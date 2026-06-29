"use client";

import { useEffect } from "react";
import Image from "next/image";
import { MockPreview, type MockVariant } from "./MockPreview";

export interface PreviewItem {
  key: string;
  label: string;
  /** Real screenshot asset. Omit when using a coded mockup instead. */
  src?: string;
  /** Coded placeholder mockup, used when no screenshot asset exists. */
  mock?: MockVariant;
}

export function PreviewLightbox({
  items,
  index,
  onClose,
  onNext,
  onPrev,
}: {
  items: PreviewItem[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev]);

  const item = items[index];
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${item.label}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white sm:px-8">
        <span className="text-sm font-semibold">
          {item.label}
          <span className="ml-2 text-white/50">
            {index + 1} / {items.length}
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup preview"
          className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-16" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Sebelumnya"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:left-4"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {item.src ? (
          <Image
            key={item.key}
            src={item.src}
            alt={`Preview ${item.label}`}
            width={1448}
            height={1086}
            className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-card-lg"
          />
        ) : (
          <div
            key={item.key}
            className="aspect-[4/3] max-h-[78vh] w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 shadow-card-lg"
          >
            <MockPreview variant={item.mock ?? "site"} />
          </div>
        )}

        {items.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Selanjutnya"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:right-4"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {!item.src && (
        <p className="px-6 pb-5 text-center text-xs text-white/50">
          Mockup tampilan — contoh ilustrasi UI untuk kategori ini.
        </p>
      )}
    </div>
  );
}
