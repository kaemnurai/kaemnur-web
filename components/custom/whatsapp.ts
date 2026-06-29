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

// Reuses the project-wide WhatsApp number; falls back to the known prod number
// so the button always works even without the env var at build time.
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6282111990423";

/** Build the pre-filled consultation message from the estimate form. */
export function buildRequestMessage(form: EstimateForm): string {
  const breakdown = computeEstimate(form);
  const features = featureLabels(form.features);

  return [
    "Halo Kaemnur, saya ingin request layanan Buat Website.",
    "",
    "Jenis layanan:",
    CATEGORIES[form.category].label,
    "",
    "Detail kebutuhan:",
    detailOption(form)?.label ?? "-",
    "",
    "Domain:",
    domainOption(form)?.label ?? "-",
    "",
    "Hosting:",
    hostingOption(form)?.label ?? "-",
    "",
    "Fitur tambahan:",
    features.length ? features.map((f) => `- ${f}`).join("\n") : "Tidak ada",
    "",
    "Estimasi biaya jasa:",
    formatRange(breakdown.service),
    "",
    "Estimasi domain + hosting:",
    formatIDR(breakdown.domain + breakdown.hosting),
    "",
    "Total estimasi awal:",
    formatRange(breakdown.total),
    "",
    "Catatan:",
    form.notes.trim() || "-",
    "",
    "Saya ingin konsultasi lebih lanjut.",
  ].join("\n");
}

export function buildWhatsappUrl(form: EstimateForm): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildRequestMessage(form)
  )}`;
}
