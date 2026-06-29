import Image from "next/image";

const STEPS = [
  { title: "Brief Kebutuhan", desc: "Ceritakan kebutuhan website, aplikasi, atau tools Anda." },
  { title: "Desain Tampilan", desc: "Kaemnur rancang tampilan sesuai kebutuhan dan brand Anda." },
  { title: "Development", desc: "Proses pembuatan dan pengembangan fitur dijalankan." },
  { title: "Revisi", desc: "Penyesuaian dilakukan sesuai kesepakatan paket." },
  { title: "Launching", desc: "Website/aplikasi siap digunakan dan dipublikasikan." },
];

export function ProcessSection() {
  return (
    <section className="border-t border-cw-line bg-gradient-to-b from-cw-bg-soft to-[#E7EDF6] px-6 py-14 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-[1680px]">
        <h2 className="text-2xl font-bold text-cw-fg sm:text-3xl">Proses Pengerjaan yang Jelas</h2>
        <p className="mt-1.5 text-sm text-cw-fg-sub sm:text-base">
          Lima langkah sederhana dari ide sampai siap digunakan.
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center lg:gap-16">
          <Image
            src="/custom/support/proses-5-langkah.png"
            alt="Proses pengerjaan 5 langkah Kaemnur"
            width={1672}
            height={941}
            loading="lazy"
            className="w-full rounded-card border border-cw-line shadow-sm"
          />

          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cw-navy text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-cw-fg">{s.title}</h3>
                  <p className="mt-1 text-xs text-cw-fg-sub">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
