import {
  CATEGORIES,
  computeEstimate,
  detailOption,
  domainOption,
  featureLabels,
  formatIDR,
  formatRange,
  hostingOption,
  type EstimateForm,
} from "./estimate";
import { buildWhatsappUrl } from "./whatsapp";

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.6.8-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.3 0-.5.1-.6s.4-.5.6-.7.1-.4 0-.6l-.7-1.6c-.2-.4-.4-.3-.6-.3h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.1c0 1.2 1 2.4 1.1 2.6.2.2 1.7 2.6 4.1 3.6 2 .8 2 .5 2.4.5s1.3-.5 1.5-1 .2-.9.1-1Z" />
    </svg>
  );
}

export function SummaryCard({
  form,
  variant = "aside",
}: {
  form: EstimateForm;
  /** "aside" = compact sticky panel; "full" = the final summary step. */
  variant?: "aside" | "full";
}) {
  const cat = CATEGORIES[form.category];
  const breakdown = computeEstimate(form);
  const domain = domainOption(form);
  const hosting = hostingOption(form);
  const features = featureLabels(form.features);

  return (
    <div className="rounded-card border border-cw-line bg-cw-card p-5 shadow-card-lg sm:p-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cw-orange-soft px-3 py-1 text-xs font-semibold text-cw-orange-hover">
        Estimasi Gratis &amp; Tanpa Komitmen
      </span>
      <h3 className="mt-3 text-lg font-bold text-cw-fg">Ringkasan Estimasi</h3>
      <p className="mt-1 text-sm text-cw-fg-sub">
        {cat.label} — {detailOption(form)?.label ?? "Pilih detail kebutuhan"}
      </p>

      <dl className="mt-5 space-y-3 border-t border-cw-line pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-cw-fg-sub">Biaya jasa pembuatan</dt>
          <dd className="text-right font-semibold text-cw-fg">{formatRange(breakdown.service)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-cw-fg-sub">Domain ({domain?.label ?? "-"})</dt>
          <dd className="text-right font-semibold text-cw-fg">
            {breakdown.domain > 0 ? `${formatIDR(breakdown.domain)}/th` : "Sudah punya / nanti"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-cw-fg-sub">Hosting ({hosting?.label ?? "-"})</dt>
          <dd className="text-right font-semibold text-cw-fg">
            {breakdown.hosting > 0 ? `${formatIDR(breakdown.hosting)}/th` : "Belum perlu"}
          </dd>
        </div>
        {features.length > 0 && (
          <div>
            <dt className="text-cw-fg-sub">Fitur tambahan</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {features.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-cw-bg-soft px-2 py-0.5 text-[11px] font-medium text-cw-fg-sub"
                >
                  {f}
                </span>
              ))}
            </dd>
          </div>
        )}
        {variant === "full" && form.notes.trim() && (
          <div>
            <dt className="text-cw-fg-sub">Catatan</dt>
            <dd className="mt-1 whitespace-pre-line text-[13px] text-cw-fg">{form.notes.trim()}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 rounded-card border-2 border-cw-navy bg-cw-navy-soft p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-cw-navy">Total Estimasi Awal</p>
        <p className="mt-1.5 text-2xl font-extrabold leading-tight text-cw-fg sm:text-[26px]">
          {formatRange(breakdown.total)}
        </p>
      </div>

      <a
        href={buildWhatsappUrl(form)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-btn bg-cw-green px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-cw-green-hover"
      >
        <WhatsappIcon />
        Lanjut Konsultasi via WhatsApp
      </a>

      <p className="mt-4 text-[11px] leading-relaxed text-cw-fg-muted">
        Estimasi awal, bisa berubah setelah kebutuhan detail dikonsultasikan. Domain dan hosting
        mengikuti harga provider. Harga belum termasuk fitur custom kompleks jika ada.
      </p>
    </div>
  );
}
