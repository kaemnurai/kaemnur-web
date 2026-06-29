import { buildWhatsappUrl } from "./whatsapp";
import type { EstimateForm } from "./estimate";

export function WhatsappCtaSection({ form }: { form: EstimateForm }) {
  return (
    <section className="border-t border-cw-line bg-gradient-to-br from-[#EAF2FE] via-cw-bg to-[#FDEFE2] px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cw-green/15 text-cw-green">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.6.8-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.3 0-.5.1-.6s.4-.5.6-.7.1-.4 0-.6l-.7-1.6c-.2-.4-.4-.3-.6-.3h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.1c0 1.2 1 2.4 1.1 2.6.2.2 1.7 2.6 4.1 3.6 2 .8 2 .5 2.4.5s1.3-.5 1.5-1 .2-.9.1-1Z" />
          </svg>
        </span>
        <h2 className="text-2xl font-bold text-cw-fg sm:text-3xl">
          Siap Mulai Project Anda?
        </h2>
        <p className="text-sm text-cw-fg-sub sm:text-base">
          Lanjutkan konsultasi langsung dengan owner Kaemnur via WhatsApp.
          Ringkasan estimasi yang sudah Anda pilih akan terkirim otomatis.
        </p>
        <a
          href={buildWhatsappUrl(form)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-btn bg-cw-green px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-cw-green-hover"
        >
          Hubungi Admin via WhatsApp
        </a>
      </div>
    </section>
  );
}
