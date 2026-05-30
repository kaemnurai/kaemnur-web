import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatCount, productAccent } from "@/lib/utils";

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
  installerPlatforms: string[];
  primaryInstallerId: string | null;
};

const PLATFORM_LABEL: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

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
  const thumbs = product.screenshots.slice(1, 5);
  const accent = productAccent(product.slug);
  const platformLabels = product.installerPlatforms
    .map((p) => PLATFORM_LABEL[p] ?? p)
    .join(" · ");

  const downloadHref = product.primaryInstallerId
    ? `/api/download?id=${product.primaryInstallerId}`
    : "/download";

  return (
    <section className="rounded-card border border-line bg-card p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* LEFT: screenshot + title + stats */}
        <div className="min-w-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            New on Kaemnur
          </p>

          {/* Main screenshot */}
          <Link
            href={`/products/${product.slug}`}
            className="group relative block overflow-hidden rounded-btn border border-line bg-bg"
          >
            <div className="aspect-video max-h-[420px] w-full">
              {main ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={main.url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`grid h-full w-full place-items-center ${accent.bg}`}>
                  <span className={`text-7xl font-extrabold ${accent.fg}`}>
                    {product.name[0]}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Title + tagline */}
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-fg md:text-5xl">
            {product.name}
          </h1>
          {product.tagline && (
            <p className="mt-2 text-[15px] text-fg">{product.tagline}</p>
          )}
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-sub">
            {product.description}
          </p>

          {/* Stat row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-fg-sub">
            <span className="inline-flex items-center gap-1.5">
              {product.ratingDisplay !== null ? (
                <>
                  <Icon name="star" size={13} className="text-accent" />
                  <span className="font-medium text-fg">{product.ratingDisplay.toFixed(1)}</span>
                  <span>· {product.ratingCount} rating{product.ratingCount !== 1 ? "s" : ""}</span>
                </>
              ) : (
                <span className="text-fg-muted">No ratings yet</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="download" size={13} />
              <span className="font-medium text-fg">
                {formatCount(product.downloadCount)}+
              </span>
              <span>installs</span>
            </span>
            {platformLabels && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="monitor" size={13} />
                <span>{platformLabels}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-fg-sub">
              <span className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-fg">
                v{product.version}
              </span>
              <span>today</span>
            </span>
          </div>

          {/* Thumbnail strip */}
          {thumbs.length > 0 && (
            <div className="mt-5 flex gap-2">
              {thumbs.map((t) => (
                <div
                  key={t.id}
                  className="h-14 w-24 shrink-0 overflow-hidden rounded-btn border border-line bg-bg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.url} alt="" className="h-full w-full object-cover opacity-80" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: install panel */}
        <aside className="self-start rounded-btn border border-line bg-bg p-4">
          <div className="flex items-baseline gap-2">
            {product.priceFree && <span className="text-xl font-bold text-success">Free</span>}
            {product.priceLabel && (
              <span className="text-[12px] text-fg-sub">· PRO from <span className="text-accent font-semibold">{product.priceLabel}</span></span>
            )}
            {!product.priceFree && !product.priceLabel && (
              <span className="text-xl font-bold text-success">Free</span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-fg-sub">
            {product.category} · Offline-first
          </p>

          <Link
            href={downloadHref}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
          >
            <Icon name="download" size={15} />
            Install
          </Link>

          <Link
            href={`/products/${product.slug}`}
            className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-btn border border-line text-[12px] font-medium text-fg-sub hover:border-fg-sub hover:text-fg"
          >
            View details
          </Link>
        </aside>
      </div>
    </section>
  );
}
