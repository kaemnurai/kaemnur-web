// Estimation model + pricing logic for the /custom microsite.
// Pure data + pure functions only — no React, no DOM. Shared by the wizard UI
// and the WhatsApp message builder. Base prices are jasa pembuatan saja —
// belum termasuk domain & hosting (those are priced separately below).

import { DOMAIN_PRICES } from "@/lib/custom-domain-prices";

export type Category = "website" | "webapp" | "desktop";

export interface PriceRange {
  min: number;
  max: number;
}

interface Option<K extends string> {
  key: K;
  label: string;
}

interface DetailOption extends Option<string>, PriceRange {}
type FeatureOption = Option<string>;
interface FixedOption extends Option<string> {
  price: number;
}

export interface CategoryConfig {
  key: Category;
  label: string;
  desc: string;
  details: DetailOption[];
}

// ─── Base price tables (jasa pembuatan, belum termasuk domain & hosting) ────

export const CATEGORIES: Record<Category, CategoryConfig> = {
  website: {
    key: "website",
    label: "Website Umum",
    desc: "Untuk landing page, company profile, toko online sederhana, portfolio, event, dan blog.",
    details: [
      { key: "landing", label: "Landing page flat", min: 250_000, max: 500_000 },
      { key: "company", label: "Company profile sederhana", min: 500_000, max: 1_000_000 },
      { key: "katalog", label: "Toko online sederhana", min: 750_000, max: 1_500_000 },
      { key: "portfolio", label: "Blog / portfolio sederhana", min: 350_000, max: 800_000 },
      { key: "event", label: "Event / promo page", min: 350_000, max: 700_000 },
    ],
  },
  webapp: {
    key: "webapp",
    label: "Web Aplikasi / Sistem",
    desc: "Untuk kasir, absensi, admin dashboard, input data, inventaris, dan laporan.",
    details: [
      { key: "dashboard", label: "Dashboard / admin sederhana", min: 1_000_000, max: 2_500_000 },
      { key: "pos", label: "Kasir / POS sederhana", min: 1_500_000, max: 3_500_000 },
      { key: "absensi", label: "Absensi sederhana", min: 1_000_000, max: 2_500_000 },
      { key: "inputdata", label: "Form input data + laporan", min: 1_000_000, max: 3_000_000 },
      { key: "inventaris", label: "Inventaris sederhana", min: 1_500_000, max: 4_000_000 },
      { key: "custom", label: "Sistem custom lain", min: 2_500_000, max: 6_000_000 },
    ],
  },
  desktop: {
    key: "desktop",
    label: "Tools Desktop",
    desc: "Untuk aplikasi Windows, tools Excel/PDF, converter, automation, dan aplikasi offline.",
    details: [
      { key: "simple", label: "Tools kecil / offline sederhana", min: 500_000, max: 1_500_000 },
      { key: "converter", label: "Converter / automation sederhana", min: 750_000, max: 2_000_000 },
      { key: "exceltools", label: "Tools Excel / PDF custom", min: 1_000_000, max: 3_000_000 },
      { key: "offline", label: "Aplikasi desktop custom", min: 2_500_000, max: 5_500_000 },
    ],
  },
};

// Informational only — these do not affect the price estimate. They're passed
// along as extra context in the WhatsApp consultation message.
export const FEATURES: FeatureOption[] = [
  { key: "login", label: "Login admin/user" },
  { key: "database", label: "Database" },
  { key: "upload", label: "Upload file/gambar" },
  { key: "export", label: "Export Excel/PDF" },
  { key: "stats", label: "Dashboard statistik" },
  { key: "adminpanel", label: "Admin panel" },
  { key: "wa", label: "Notifikasi WhatsApp" },
  { key: "payment", label: "Payment/checkout" },
  { key: "multiuser", label: "Multi user/role akses" },
  { key: "autoupdate", label: "Auto update aplikasi" },
  { key: "license", label: "Lisensi aplikasi" },
  { key: "premiumdesign", label: "Desain premium/custom UI" },
];

export interface DomainChoice extends Option<string> {
  firstYear: number;
  renewal?: number;
  promo?: boolean;
}

// Selectable domain extensions, sourced from lib/custom-domain-prices.ts
// (Rumahweb), plus two non-priced fallback choices.
export const DOMAINS: DomainChoice[] = [
  ...DOMAIN_PRICES.map((d) => ({
    key: d.ext,
    label: d.ext,
    firstYear: d.firstYear,
    renewal: d.renewal,
    promo: d.promo,
  })),
  { key: "own", label: "Sudah punya domain", firstYear: 0 },
  { key: "unknown", label: "Belum tahu", firstYear: 0 },
];

// Annualized from the provider's discounted "periode 1 tahun" monthly rate
// (price/bulan × 12), to match domain pricing which is also per tahun.
export const HOSTINGS: FixedOption[] = [
  { key: "entry", label: "Entry Hosting", price: 25_000 * 12 },
  { key: "unlimited-s", label: "Unlimited S", price: 60_000 * 12 },
  { key: "unlimited-m", label: "Unlimited M", price: 110_000 * 12 },
  { key: "unlimited-l", label: "Unlimited L", price: 160_000 * 12 },
  { key: "none", label: "Belum perlu / dibahas nanti", price: 0 },
];

export const DEFAULT_DOMAIN: string = ".my.id";
export const DEFAULT_HOSTING: string = "unlimited-s";

// ─── Form state ──────────────────────────────────────────────────────────────

export interface EstimateForm {
  category: Category;
  detail: string;
  domain: string;
  hosting: string;
  features: string[];
  notes: string;
}

export function defaultForm(category: Category = "website"): EstimateForm {
  return {
    category,
    detail: CATEGORIES[category].details[0].key,
    domain: DEFAULT_DOMAIN,
    hosting: DEFAULT_HOSTING,
    features: [],
    notes: "",
  };
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

function find<T extends { key: string }>(list: T[], key: string): T | undefined {
  return list.find((o) => o.key === key);
}

export function detailOption(form: EstimateForm): DetailOption | undefined {
  return find(CATEGORIES[form.category].details, form.detail);
}

export function domainOption(form: EstimateForm): DomainChoice | undefined {
  return find(DOMAINS, form.domain);
}

export function hostingOption(form: EstimateForm): FixedOption | undefined {
  return find(HOSTINGS, form.hosting);
}

export function featureLabels(keys: string[]): string[] {
  return keys
    .map((k) => find(FEATURES, k)?.label)
    .filter((l): l is string => Boolean(l));
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface EstimateBreakdown {
  service: PriceRange;
  domain: number;
  hosting: number;
  total: PriceRange;
}

/**
 * Total estimasi awal = biaya jasa + biaya domain + biaya hosting.
 * Fitur tambahan tidak memengaruhi harga — hanya informasi yang diteruskan
 * ke pesan konsultasi WhatsApp.
 */
export function computeEstimate(form: EstimateForm): EstimateBreakdown {
  const base = detailOption(form) ?? { min: 0, max: 0 };
  const domain = domainOption(form)?.firstYear ?? 0;
  const hosting = hostingOption(form)?.price ?? 0;

  return {
    service: { min: base.min, max: base.max },
    domain,
    hosting,
    total: { min: base.min + domain + hosting, max: base.max + domain + hosting },
  };
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(n: number): string {
  return idr.format(n);
}

export function formatRange(r: PriceRange): string {
  return `${formatIDR(r.min)} – ${formatIDR(r.max)}`;
}
