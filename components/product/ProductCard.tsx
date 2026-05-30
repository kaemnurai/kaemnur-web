import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatCount, productAccent } from "@/lib/utils";

export type ProductCardData = {
  name: string;
  slug: string;
  category: string;
  tagline: string | null;
  downloadCount: number;
  createdAt: Date | string;
  isFeatured: boolean;
  priceFree: boolean;
  priceAmount: number | null;
  priceLabel: string | null;
  ratingOverride: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  platforms: string[];
  screenshots: { url: string }[];
};

const PLATFORM_ICONS: Record<string, React.ComponentProps<typeof Icon>["name"]> = {
  WINDOWS: "monitor",
  MAC: "apple",
  LINUX: "linux",
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const cover = product.screenshots[0]?.url;
  const accent = productAccent(product.slug);

  // Use override if set, otherwise real average; null means no ratings → hide stars
  const displayRating = product.ratingOverride ?? product.ratingAvg;
  const displayCount = product.ratingCount;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-card transition-colors hover:border-accent/60"
    >
      {/* Screenshot area */}
      <div className="relative aspect-video w-full bg-bg">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`grid h-full w-full place-items-center ${accent.bg}`}>
            <span className={`text-5xl font-extrabold ${accent.fg}`}>
              {product.name[0]}
            </span>
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute left-3 top-3 rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg">
            Featured
          </span>
        )}
        {/* Developer chip — bottom-left overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-black/40 px-1.5 py-1 backdrop-blur-sm">
          <span
            className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-bg ${accent.solid}`}
          >
            {product.name[0]}
          </span>
          <span className="pr-1 text-[11px] font-medium text-fg">Kaemnur</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-fg">{product.name}</h3>
          <div className="flex shrink-0 items-center gap-0.5 text-fg-muted">
            {product.platforms.map((p) => (
              <Icon
                key={p}
                name={PLATFORM_ICONS[p] ?? "monitor"}
                size={12}
                className="opacity-80"
              />
            ))}
          </div>
        </div>
        {product.tagline && (
          <p className="line-clamp-1 text-[12px] text-fg-sub">{product.tagline}</p>
        )}
        {/* Bottom row */}
        <div className="mt-auto flex items-center justify-between pt-1 text-[12px]">
          <span className="inline-flex items-center gap-1 text-fg-sub">
            {displayRating !== null ? (
              <>
                <Icon name="star" size={11} className="text-accent" />
                <span className="font-medium text-fg">{displayRating.toFixed(1)}</span>
                <span>· {displayCount}</span>
              </>
            ) : (
              <span className="text-fg-muted text-[11px]">{formatCount(product.downloadCount)} downloads</span>
            )}
          </span>
          <span className="font-semibold">
            {product.priceFree && <span className="text-success">Free</span>}
            {product.priceLabel && (
              <span className="ml-1 text-fg-sub">· PRO <span className="text-accent">{product.priceLabel}</span></span>
            )}
            {!product.priceFree && !product.priceLabel && (
              <span className="text-success">Free</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
