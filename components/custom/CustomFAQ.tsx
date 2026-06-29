import Image from "next/image";

const FAQS = [
  {
    q: "Apakah harga langsung pasti?",
    a: "Belum, harga di halaman ini hanya estimasi awal.",
  },
  {
    q: "Apakah bisa sampai online?",
    a: "Bisa, Kaemnur dapat membantu setup sampai website/aplikasi bisa digunakan.",
  },
  {
    q: "Apakah saya dapat akun admin?",
    a: "Ya, untuk web aplikasi akan diberikan akses admin sesuai kebutuhan.",
  },
  {
    q: "Apakah bisa revisi?",
    a: "Bisa, jumlah revisi mengikuti kesepakatan paket.",
  },
  {
    q: "Apakah bisa request fitur khusus?",
    a: "Bisa, fitur akan dicek dulu dari sisi kebutuhan dan tingkat kesulitan.",
  },
  {
    q: "Apakah tools desktop berjalan di browser?",
    a: "Tidak, tools desktop berjalan sebagai aplikasi Windows/offline jika paket yang dipilih adalah desktop tools.",
  },
];

export function CustomFAQ() {
  return (
    <section className="border-t border-cw-line bg-cw-bg px-6 py-14 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-[1680px]">
      <h2 className="text-2xl font-bold text-cw-fg sm:text-3xl">Pertanyaan Umum &amp; Support</h2>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start lg:gap-16">
        <Image
          src="/custom/support/faq.png"
          alt="Support dan FAQ Kaemnur"
          width={1448}
          height={1086}
          loading="lazy"
          className="w-full rounded-card border border-cw-line shadow-sm"
        />

        <div className="space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-card border border-cw-line bg-cw-card p-4 [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between text-sm font-semibold text-cw-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="ml-3 text-cw-fg-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-cw-fg-sub">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
