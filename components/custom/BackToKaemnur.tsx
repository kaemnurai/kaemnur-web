import Link from "next/link";

// The ONLY navigation on /custom: a single floating link back to the main
// site. No global navbar/footer here — this route deliberately stands alone.
export function BackToKaemnur() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-6 pt-3 sm:px-10 lg:px-16">
      <div className="pointer-events-auto mx-auto flex max-w-[1600px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-cw-orange/40 bg-cw-card/95 px-4 py-2 text-sm font-semibold text-cw-fg shadow-[0_4px_14px_-4px_rgba(245,135,31,0.35)] backdrop-blur transition-all hover:border-cw-orange hover:bg-cw-orange-soft hover:shadow-[0_6px_18px_-4px_rgba(245,135,31,0.5)]"
        >
          <span
            aria-hidden
            className="flex h-5 w-5 items-center justify-center rounded-full bg-cw-orange-soft text-cw-orange transition-transform group-hover:-translate-x-0.5"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
              <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Kembali ke Kaemnur
        </Link>
      </div>
    </div>
  );
}
