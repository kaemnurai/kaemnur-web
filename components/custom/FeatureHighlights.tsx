import Image from "next/image";

export function FeatureHighlights() {
  return (
    <section className="border-t border-cw-line bg-gradient-to-b from-cw-bg via-cw-bg to-[#EEF3FB] px-6 py-14 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-[1680px]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cw-line bg-cw-card px-3 py-1 text-xs font-semibold text-cw-navy">
            Apa yang bisa Kaemnur bantu
          </span>
          <h2 className="mt-3 text-2xl font-bold text-cw-fg sm:text-3xl">
            Solusi lengkap, dari ide sampai siap pakai
          </h2>
          <p className="mt-1.5 text-sm text-cw-fg-sub sm:text-base">
            Website, web aplikasi, dan tools desktop — lengkap dengan estimasi, domain &amp; hosting, serta support.
          </p>
        </div>

        <div className="mt-10">
          <div className="w-full rounded-card border border-cw-line bg-cw-card p-4 shadow-sm sm:p-6 lg:p-7">
            <Image
              src="/custom/support/feature-cards.png"
              alt="Layanan Kaemnur: website, web aplikasi, tools desktop, estimasi harga, domain & hosting, support"
              width={1448}
              height={1086}
              loading="lazy"
              className="h-auto w-full rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
