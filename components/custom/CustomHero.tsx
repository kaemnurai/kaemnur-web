import Image from "next/image";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TRUST = [
  "Konsultasi langsung dengan owner",
  "Estimasi gratis & tanpa komitmen",
  "Website, sistem, & tools desktop",
];

export function CustomHero({
  onStart,
  onPreview,
}: {
  onStart: () => void;
  onPreview: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-cw-bg">
      {/* ── Coded background: layered gradient + glow + dot grid (no banner image) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cw-bg-soft via-cw-bg to-cw-bg"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:radial-gradient(circle,theme(colors.cw.line)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-cw-navy/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-[-8%] h-80 w-80 rounded-full bg-cw-orange/[0.10] blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cw-navy/[0.06] blur-[100px]"
      />

      <div className="relative mx-auto grid max-w-[1680px] items-center gap-12 px-6 pb-16 pt-24 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:pb-20 md:pt-28 lg:gap-16 lg:px-20">
        {/* Wide soft-blue atmosphere bleeding from behind the photo into the text column on
            desktop, so the visual reaches all the way across instead of reading as a separate
            box stuck around the image. Plain radial-gradient fade — no hard edges, no border.
            Hidden on mobile, where the layout stacks instead of sitting side-by-side. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 right-[-10%] hidden md:block [background:radial-gradient(ellipse_82%_82%_at_72%_46%,#EAF2FE_0%,rgba(238,243,252,0.55)_45%,transparent_82%)]"
        />

        {/* ── Left: copy + CTA + trust (kept above the decorative background) ── */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-cw-line bg-cw-card px-3.5 py-1.5 text-xs font-semibold text-cw-navy shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cw-orange/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cw-orange" />
            </span>
            Layanan Buat Website Kaemnur
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-cw-fg sm:text-5xl lg:text-[3.4rem]">
            Buat Website, Sistem, dan{" "}
            <span className="whitespace-nowrap text-cw-navy">Tools Siap Pakai</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-cw-fg-sub sm:text-lg">
            Mulai dari website bisnis, web aplikasi, sampai tools desktop. Pilih
            kebutuhan Anda, lihat contoh tampilan, lalu dapatkan estimasi biaya
            awal — tanpa komitmen.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onStart}
              className="group inline-flex items-center justify-center gap-2 rounded-btn bg-cw-navy px-6 py-3.5 text-sm font-semibold text-white shadow-card-lg transition-all hover:bg-cw-navy-hover hover:shadow-lg"
            >
              Mulai Hitung Estimasi
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={onPreview}
              className="inline-flex items-center justify-center gap-2 rounded-btn border border-cw-line bg-cw-card px-6 py-3.5 text-sm font-semibold text-cw-fg shadow-sm transition-colors hover:border-cw-navy/50 hover:bg-cw-bg-soft"
            >
              Lihat Contoh Tampilan
            </button>
          </div>

          {/* Trust pills */}
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {TRUST.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-cw-line bg-cw-card/70 px-3 py-1.5 text-xs font-medium text-cw-fg-sub backdrop-blur"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cw-green-soft text-cw-green">
                  <CheckIcon />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: photo fused with large circle decorations sitting directly behind
            the body, plus smaller supporting accents kept inside the frame — scoped to
            the photo wrapper so it stays correctly placed whether stacked (mobile) or
            side-by-side (desktop) ── */}
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          {/* Two large circles anchored behind the torso, sized and overlapped so they
              read as part of the photo composition rather than separate decoration. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* big navy circle, centered behind the chest/shoulders */}
            <div className="absolute left-1/2 top-[42%] aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cw-navy to-cw-navy-hover shadow-[0_30px_70px_-18px_rgba(29,58,138,0.5)] sm:w-[64%]" />
            {/* large soft blue-gray circle, overlapping the navy circle lower-right for
                depth — a navy-tinted tone (not white) so it separates cleanly from the
                white shirt while staying in the same blue family */}
            <div className="absolute right-[3%] top-[62%] aspect-square w-[44%] -translate-y-1/2 rounded-full bg-[#C7D5EE] ring-1 ring-cw-navy/10 sm:w-[46%]" />
            {/* orange accent circle, upper-right, overlapping the navy circle's edge */}
            <div className="absolute right-[8%] top-[9%] aspect-square w-[20%] rounded-full bg-cw-orange shadow-lg shadow-cw-orange/40 sm:w-[21%]" />

            {/* small supporting dots, kept well inside the frame */}
            <div className="absolute left-[6%] bottom-[12%] h-3 w-3 rounded-full bg-cw-navy/40 sm:h-3.5 sm:w-3.5" />
            <div className="absolute left-[12%] top-[8%] h-2.5 w-2.5 rounded-full bg-cw-orange/60" />
          </div>

          <Image
            src="/custom/hero-person.png"
            alt="Owner Kaemnur — layanan pembuatan website, web aplikasi, dan tools"
            width={1086}
            height={1448}
            priority
            className="relative z-10 mx-auto h-auto w-full max-w-[19rem] object-contain drop-shadow-2xl sm:max-w-sm md:max-w-md"
          />
        </div>
      </div>
    </section>
  );
}
