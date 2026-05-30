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

  const main = product.screenshots[0];
  const accent = productAccent(product.slug);
  const [namePrefix, nameSuffix] = splitName(product.name);
  const features = product.features.slice(0, 6);

  const platformLabels = product.installerPlatforms
    .map((p) => PLATFORM_LABEL[p] ?? p)
    .join(" · ");

  const downloadHref = product.primaryInstallerId
    ? `/api/download?id=${product.primaryInstallerId}`
    : "/download";

  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-[#12161f] via-card to-[#0c0f14]">
      <div className="grid items-center gap-8 p-6 lg:grid-cols-[1fr_minmax(0,52%)] lg:p-8">
        {/* LEFT: copy */}
        <div className="min-w-0">
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

        {/* RIGHT: app mockup screenshot */}
        <Link
          href={`/products/${product.slug}`}
          className="group relative block overflow-hidden rounded-card border border-line bg-bg shadow-card-lg"
        >
          <div className="aspect-[16/10] max-h-[360px] w-full">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={main.url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className={`grid h-full w-full place-items-center ${accent.bg}`}>
                <span className={`text-7xl font-extrabold ${accent.fg}`}>{product.name[0]}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
