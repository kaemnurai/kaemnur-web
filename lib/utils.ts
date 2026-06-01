/** Tiny classnames joiner — avoids pulling in clsx/tailwind-merge. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format a Rupiah amount with thousands separators: 149000 → "Rp 149.000". */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Validate an Indonesian mobile number (08…, 62…, or +62…). */
export function isValidIndonesianPhone(input: string): boolean {
  const normalized = normalizeWhatsapp(input);
  return /^628\d{7,11}$/.test(normalized);
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6282111990423";

/** Build the pre-filled wa.me upgrade link used by the PRO funnel. */
export function buildUpgradeWhatsappUrl(name: string, productName: string, waNumber: string): string {
  const message =
    `Halo Admin Kaemnur, saya ${name} ingin upgrade ke PRO.\nProduk: ${productName}\nNo. WhatsApp: ${waNumber}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

/**
 * Normalize an Indonesian phone number to the wa.me international format.
 * "081322118378" → "6281322118378"; "+62 813-2211-8378" → "6281322118378".
 */
export function normalizeWhatsapp(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("620")) digits = "62" + digits.slice(3);
  else if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

/** Build a wa.me link to message a buyer their license key (Bahasa Indonesia). */
export function buildLicenseDeliveryUrl(
  buyerName: string,
  buyerWhatsapp: string,
  key: string
): string {
  const wa = normalizeWhatsapp(buyerWhatsapp);
  const message =
    `Halo ${buyerName}, berikut lisensi KaemDocs PRO Anda: ${key}. ` +
    `Aktifkan di menu Upgrade PRO → Aktifkan Lisensi.`;
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

/**
 * Deterministic per-product accent color used for icon tiles (Steam-style
 * colored identity squares). Falls back to orange. Returns Tailwind classes
 * so they survive the JIT scan — never compute classnames at runtime.
 */
const PRODUCT_PALETTE = [
  { bg: "bg-chip-orange/15", fg: "text-chip-orange", solid: "bg-chip-orange" },
  { bg: "bg-chip-teal/15", fg: "text-chip-teal", solid: "bg-chip-teal" },
  { bg: "bg-chip-emerald/15", fg: "text-chip-emerald", solid: "bg-chip-emerald" },
  { bg: "bg-chip-violet/15", fg: "text-chip-violet", solid: "bg-chip-violet" },
  { bg: "bg-chip-sky/15", fg: "text-chip-sky", solid: "bg-chip-sky" },
  { bg: "bg-chip-rose/15", fg: "text-chip-rose", solid: "bg-chip-rose" },
];

export function productAccent(seed: string): (typeof PRODUCT_PALETTE)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PRODUCT_PALETTE[h % PRODUCT_PALETTE.length];
}
