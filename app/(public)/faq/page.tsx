import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { FaqAccordion, type FaqItem } from "@/components/faq/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Pusat Bantuan",
  description:
    "Informasi seputar download, lisensi, aktivasi, pembaruan, dan penggunaan aplikasi Kaemnur.",
};

const faqs: FaqItem[] = [
  {
    icon: "download",
    q: "Bagaimana cara mengunduh aplikasi dari Kaemnur?",
    a: "Buka halaman aplikasi yang diinginkan, lalu klik tombol Download. File installer akan langsung terunduh ke perangkat Anda.",
  },
  {
    icon: "crown",
    q: "Apa perbedaan versi Gratis dan PRO?",
    a: "Versi Gratis dapat digunakan tanpa biaya dengan fitur dasar yang tersedia. Versi PRO memberikan fitur tambahan, peningkatan produktivitas, pembaruan prioritas, dan dukungan yang lebih lengkap.",
  },
  {
    icon: "arrow-up",
    q: "Bagaimana cara upgrade ke versi PRO?",
    a: "Buka halaman aplikasi yang ingin ditingkatkan, lalu klik tombol Upgrade ke PRO. Setelah pembayaran berhasil, lisensi akan otomatis tersedia pada akun Anda.",
  },
  {
    icon: "key",
    q: "Bagaimana cara kerja lisensi aplikasi?",
    a: "Setiap pembelian PRO akan menghasilkan lisensi unik yang digunakan untuk mengaktifkan fitur premium sesuai ketentuan aplikasi.",
  },
  {
    icon: "user",
    q: "Di mana saya mengaktifkan lisensi?",
    a: "Masuk ke aplikasi yang telah dibeli, buka menu Aktivasi Lisensi, lalu masukkan kode lisensi yang Anda terima setelah pembelian.",
  },
  {
    icon: "globe",
    q: "Apakah aplikasi dapat digunakan tanpa internet?",
    a: "Sebagian besar aplikasi Kaemnur dirancang untuk bekerja secara offline. Internet hanya diperlukan untuk download, aktivasi pertama, dan pembaruan.",
  },
  {
    icon: "refresh-cw",
    q: "Bagaimana cara mendapatkan pembaruan aplikasi?",
    a: "Pembaruan dapat diunduh melalui halaman aplikasi yang sama. Pengguna PRO akan mendapatkan akses ke seluruh pembaruan yang tersedia.",
  },
  {
    icon: "calendar",
    q: "Apakah saya perlu membuat akun untuk mengunduh aplikasi?",
    a: "Tidak. Sebagian aplikasi dapat diunduh langsung tanpa akun. Namun akun diperlukan untuk mengelola lisensi dan riwayat pembelian.",
  },
  {
    icon: "shield",
    q: "Apakah lisensi dapat digunakan di lebih dari satu perangkat?",
    a: "Tergantung kebijakan masing-masing aplikasi. Informasi detail tersedia pada halaman produk masing-masing.",
  },
  {
    icon: "alert-triangle",
    q: "Bagaimana jika saya mengalami kendala saat instalasi?",
    a: "Silakan hubungi tim dukungan kami melalui WhatsApp di 082111990423 dan sertakan detail kendala yang dialami agar kami dapat membantu lebih cepat.",
  },
];

const SUPPORT_FEATURES = [
  { icon: "zap", title: "Respon Cepat", desc: "Balasan kilat di jam kerja." },
  { icon: "user", title: "Bantuan Profesional", desc: "Ditangani tim berpengalaman." },
  { icon: "shield", title: "Aman & Terpercaya", desc: "Data Anda kami jaga." },
];

const WA_URL =
  "https://wa.me/6282111990423?text=Halo+Admin+Kaemnur%2C+saya+butuh+bantuan.";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function FaqPage() {
  return (
    <div className="px-4 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-card border border-line bg-card px-6 py-8 lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">FAQ</p>
          <h1 className="mt-2 text-3xl font-bold text-fg md:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="mt-3 text-[14px] text-fg-sub">
            Temukan jawaban seputar download, lisensi, aktivasi, pembaruan, dan
            penggunaan aplikasi Kaemnur.
          </p>
        </div>

        {/* Decorative illustration — question speech bubbles */}
        <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none lg:block">
          <div className="relative h-40 w-52">
            <div className="absolute right-24 top-2 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-bg/60 text-fg-muted">
              <Icon name="help-circle" size={22} />
            </div>
            <div className="absolute right-2 top-10 grid h-24 w-24 place-items-center rounded-3xl bg-accent text-bg shadow-card-lg">
              <span className="text-5xl font-black leading-none">?</span>
            </div>
            <div className="absolute right-28 bottom-2 grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg/60 text-accent">
              <Icon name="message-circle" size={18} />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Accordion */}
        <FaqAccordion items={faqs} />

        {/* Support card */}
        <aside>
          <div className="sticky top-20 rounded-card border border-line bg-card p-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
              <Icon name="headphones" size={24} />
            </span>
            <p className="mt-4 text-[17px] font-bold text-fg">Masih butuh bantuan?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-sub">
              Tim kami siap membantu Anda secara langsung melalui WhatsApp.
            </p>

            <ul className="mt-5 space-y-3">
              {SUPPORT_FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-line/60 text-accent">
                    <Icon name={f.icon as never} size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-fg">{f.title}</p>
                    <p className="text-[12px] text-fg-sub">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[14px] font-semibold text-bg transition-colors hover:bg-accent-hover"
            >
              <WhatsAppIcon />
              Hubungi Admin Team
            </a>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1 text-[12px] font-medium text-fg-sub transition-colors hover:text-accent"
            >
              Buka WhatsApp
              <Icon name="arrow-right" size={13} />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
