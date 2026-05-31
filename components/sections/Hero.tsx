import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { productAccent } from "@/lib/utils";

export type HeroProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string | null;
  description: string;
  version: string;
  downloadCount: number;
  priceFree: boolean;
  priceLabel: string | null;
  ratingDisplay: number | null;
  ratingCount: number;
  heroImageUrl: string | null;
  screenshots: { id: string; url: string }[];
  features: { text: string }[];
  installerPlatforms: string[];
  primaryInstallerId: string | null;
};

const PLATFORM_LABEL: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

// Split "KaemDocs" → ["Kaem", "Docs"] for the white/orange wordmark.
function splitName(name: string): [string, string] {
  if (name.toLowerCase().startsWith("kaem") && name.length > 4) {
    return [name.slice(0, 4), name.slice(4)];
  }
  return [name, ""];
}

export function Hero({ product }: { product: HeroProduct | null }) {
  if (!product) {
    return (
      <section className="rounded-card border border-line bg-card p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Kaemnur Store
        </p>
        <h1 className="mt-3 text-3xl font-bold text-fg">No featured product yet</h1>
        <p className="mt-2 text-fg-sub">Add a product in the admin panel to feature it here.</p>
      </section>
    );
  }

  const accent = productAccent(product.slug);
  const [namePrefix, nameSuffix] = splitName(product.name);
  const features = product.features.slice(0, 6);
  // Transparent hero PNG/WEBP preferred; fall back to the first screenshot.
  const heroSrc = product.heroImageUrl || product.screenshots[0]?.url || null;

  const platformLabels = product.installerPlatforms
    .map((p) => PLATFORM_LABEL[p] ?? p)
    .join(" · ");

  const downloadHref = product.primaryInstallerId
    ? `/api/download?id=${product.primaryInstallerId}`
    : "/download";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1F2E] via-[#1A1F2E] to-[#0F1419]">
      {/* Subtle orange glow behind the image — painted under the content */}
      <div className="pointer-events-none absolute right-0 top-1/2 z-0 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
        {/* LEFT: copy */}
        <div className="relative z-10 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            <Icon name="sparkles" size={11} />
            New on Kaemnur
          </span>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="text-fg">{namePrefix}</span>
            <span className="text-accent">{nameSuffix}</span>
          </h1>

          {product.tagline && (
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-fg-sub">
              {product.tagline}
            </p>
          )}

          {/* Feature checklist — two columns */}
          {features.length > 0 && (
            <ul className="mt-5 grid max-w-xl gap-x-6 gap-y-2 sm:grid-cols-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-fg-sub">
                  <Icon name="check" size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">{f.text}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={downloadHref}
              className="inline-flex h-11 items-center gap-2 rounded-btn bg-accent px-5 text-[14px] font-semibold text-bg hover:bg-accent-hover"
            >
              <Icon name="download" size={16} />
              Install Gratis
            </Link>
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-btn border border-line bg-card/60 px-5 text-[14px] font-medium text-fg hover:border-fg-muted"
            >
              Lihat Detail
            </Link>
          </div>

          {/* Info row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-sub">
            {product.priceFree && <span className="font-semibold text-success">Free</span>}
            {product.priceLabel && (
              <>
                <span className="text-fg-muted">·</span>
                <span>PRO from <span className="font-semibold text-accent">{product.priceLabel}</span></span>
              </>
            )}
            {platformLabels && (
              <>
                <span className="text-fg-muted">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="monitor" size={12} />
                  {platformLabels}
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: transparent hero PNG — no card wrapper, blends with background.
            object-contain + centered → never cropped at any viewport. */}
        <div className="relative flex h-[300px] w-full items-center justify-center sm:h-[400px] lg:h-[500px]">
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt={product.name}
              fill
              style={{ objectFit: "contain", objectPosition: "center" }}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="pointer-events-none select-none"
            />
          ) : (
            <div className={`grid h-40 w-40 place-items-center rounded-3xl ${accent.bg}`}>
              <span className={`text-7xl font-extrabold ${accent.fg}`}>{product.name[0]}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
