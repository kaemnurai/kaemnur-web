import { prisma } from "@/lib/prisma";
import { Hero, type HeroProduct } from "@/components/sections/Hero";
import { ProductSection } from "@/components/sections/ProductSection";
import { RecentUpdates, type RecentUpdate } from "@/components/sections/RecentUpdates";
import { TopDownloaded, type TopProduct } from "@/components/sections/TopDownloaded";
import type { ProductCardData } from "@/components/product/ProductCard";

// Cache the catalog for 60s (ISR) to cut DB load — Feature 6
export const revalidate = 60;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: {
    q?: string;         // free-text search — Feature 18
    category?: string;
    pricing?: string;   // "free" | "pro"  — Step 11
    platform?: string;  // "windows" | "mac" | "linux"
  };
}) {
  const searchQuery = searchParams.q?.trim() || undefined;
  const categoryFilter = searchParams.category?.trim() || undefined;
  // Multi-select filters: comma-separated lists, e.g. ?pricing=free,pro&platform=windows,mac
  const pricingFilters = (searchParams.pricing ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const platformFilters = (searchParams.platform ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s === "WINDOWS" || s === "MAC" || s === "LINUX");

  // Free-text search across name / category / tagline / description (Feature 18)
  const searchWhere = searchQuery
    ? {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" as const } },
          { category: { contains: searchQuery, mode: "insensitive" as const } },
          { tagline: { contains: searchQuery, mode: "insensitive" as const } },
          { description: { contains: searchQuery, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // Build installer platform filter — any of the selected platforms (Feature 19)
  const installerWhere = platformFilters.length > 0
    ? { some: { platform: { in: platformFilters as ("WINDOWS" | "MAC" | "LINUX")[] } } }
    : undefined;

  // Build pricing filter — OR across selected pricing options (Feature 19)
  const priceConditions: Record<string, unknown>[] = [];
  if (pricingFilters.includes("free")) priceConditions.push({ priceFree: true });
  if (pricingFilters.includes("pro")) priceConditions.push({ priceAmount: { not: null } });
  const priceWhere = priceConditions.length > 0 ? { OR: priceConditions } : undefined;

  const [products, recentChangelogs] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(searchWhere ?? {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(priceWhere ?? {}),
        ...(installerWhere ? { installers: installerWhere } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: {
        screenshots: { orderBy: { order: "asc" } },
        installers: { orderBy: { createdAt: "desc" } },
        ratings: { select: { rating: true } },
      },
    }),
    prisma.changelog.findMany({
      orderBy: { releasedAt: "desc" },
      take: 6,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  // Top 10 most-downloaded — independent of the active filters (Feature 3).
  // downloadCount is the maintained aggregate of DownloadLog rows.
  const topProductsRaw = await prisma.product.findMany({
    orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: { id: true, name: true, slug: true, category: true, downloadCount: true },
  });
  const topProducts: TopProduct[] = topProductsRaw;

  const featuredRaw = products.find((p) => p.isFeatured) ?? products[0] ?? null;

  const featuredRatingAvg = featuredRaw && featuredRaw.ratings.length > 0
    ? featuredRaw.ratings.reduce((s, r) => s + r.rating, 0) / featuredRaw.ratings.length
    : null;

  const heroProduct: HeroProduct | null = featuredRaw
    ? {
        id: featuredRaw.id,
        name: featuredRaw.name,
        slug: featuredRaw.slug,
        category: featuredRaw.category,
        tagline: featuredRaw.tagline,
        description: featuredRaw.description,
        version: featuredRaw.version,
        downloadCount: featuredRaw.downloadCount,
        priceFree: featuredRaw.priceFree,
        priceLabel: featuredRaw.priceLabel,
        ratingDisplay: featuredRaw.ratingOverride ?? featuredRatingAvg,
        ratingCount: featuredRaw.ratings.length,
        screenshots: featuredRaw.screenshots,
        installerPlatforms: Array.from(new Set(featuredRaw.installers.map((i) => i.platform))),
        primaryInstallerId: featuredRaw.installers[0]?.id ?? null,
      }
    : null;

  const cards: ProductCardData[] = products.map((p) => {
    const ratingAvg = p.ratings.length > 0
      ? p.ratings.reduce((s, r) => s + r.rating, 0) / p.ratings.length
      : null;
    return {
      name: p.name,
      slug: p.slug,
      category: p.category,
      tagline: p.tagline,
      downloadCount: p.downloadCount,
      createdAt: p.createdAt,
      isFeatured: p.isFeatured,
      priceFree: p.priceFree,
      priceAmount: p.priceAmount,
      priceLabel: p.priceLabel,
      ratingOverride: p.ratingOverride,
      ratingAvg,
      ratingCount: p.ratings.length,
      platforms: Array.from(new Set(p.installers.map((i) => i.platform))),
      screenshots: p.screenshots,
    };
  });

  const editorialPicks = cards.filter((c) => c.isFeatured);
  const editorialSlugs = new Set(editorialPicks.map((c) => c.slug));
  const otherProducts = cards.filter((c) => !editorialSlugs.has(c.slug));

  const updates: RecentUpdate[] = recentChangelogs.map((c) => ({
    id: c.id,
    productName: c.product.name,
    productSlug: c.product.slug,
    version: c.version,
    notes: c.notes.split("\n")[0].replace(/^[-•]\s*/, ""),
    releasedAt: c.releasedAt,
  }));

  const hasFilters =
    categoryFilter || pricingFilters.length > 0 || platformFilters.length > 0;

  // Build a "/" href that keeps all current filters except one (value removed)
  function hrefWithout(key: "category" | "pricing" | "platform", value: string): string {
    const remaining: Record<string, string[]> = {
      pricing: pricingFilters.filter((v) => v !== value.toLowerCase()),
      platform: platformFilters.filter((v) => v !== value.toUpperCase()),
    };
    const parts: string[] = [];
    if (categoryFilter && key !== "category") parts.push(`category=${encodeURIComponent(categoryFilter)}`);
    if (remaining.pricing.length) parts.push(`pricing=${remaining.pricing.join(",")}`);
    if (remaining.platform.length) parts.push(`platform=${remaining.platform.join(",")}`);
    return parts.length ? `/?${parts.join("&")}` : "/";
  }

  // ── Search-results view (Feature 18) ──────────────────────────────────
  if (searchQuery) {
    return (
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-fg-sub">Hasil pencarian untuk</span>
          <span className="font-semibold text-fg">&ldquo;{searchQuery}&rdquo;</span>
          <span className="text-fg-muted">· {cards.length} produk</span>
          <Chip label="Hapus pencarian" href="/" />
        </div>
        {cards.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-[13px] text-fg-sub">
            Tidak ada produk yang cocok dengan &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <ProductSection
            eyebrow="Search"
            title={`${cards.length} hasil`}
            products={cards}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 px-4 py-6 lg:px-8 lg:py-8">
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-fg-sub">Filtered by:</span>
          {categoryFilter && <Chip label={categoryFilter} href={hrefWithout("category", categoryFilter)} />}
          {pricingFilters.map((v) => (
            <Chip key={`p-${v}`} label={v.toUpperCase()} href={hrefWithout("pricing", v)} />
          ))}
          {platformFilters.map((v) => (
            <Chip key={`pf-${v}`} label={v} href={hrefWithout("platform", v)} />
          ))}
        </div>
      )}

      <Hero product={heroProduct} />

      {editorialPicks.length > 0 && (
        <ProductSection
          eyebrow="Kaemnur Picks"
          title="Featured products"
          subtitle="Curated this month by the Kaemnur team."
          seeAllHref="/download"
          products={editorialPicks}
        />
      )}

      {otherProducts.length > 0 ? (
        <ProductSection
          eyebrow="All products"
          title="Browse the catalog"
          subtitle="Every Kaemnur app is free to download. Upgrade to PRO when you want more."
          products={otherProducts}
        />
      ) : products.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-[13px] text-fg-sub">
          No products match the current filters.
        </div>
      ) : null}

      <RecentUpdates updates={updates} />

      <TopDownloaded products={topProducts} />
    </div>
  );
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded bg-card border border-line px-2 py-0.5 text-fg hover:border-fg-muted"
    >
      {label}
      <span className="text-fg-muted">×</span>
    </a>
  );
}
