import { prisma } from "@/lib/prisma";
import { Hero, type HeroProduct } from "@/components/sections/Hero";
import { ProductSection } from "@/components/sections/ProductSection";
import { RecentUpdates, type RecentUpdate } from "@/components/sections/RecentUpdates";
import type { ProductCardData } from "@/components/product/ProductCard";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    pricing?: string;   // "free" | "pro"  — Step 11
    platform?: string;  // "windows" | "mac" | "linux"
  };
}) {
  const categoryFilter = searchParams.category?.trim() || undefined;
  const pricingFilter = searchParams.pricing?.toLowerCase();
  const platformFilter = searchParams.platform?.toUpperCase();

  // Build installer platform filter for Step 11
  const installerWhere = platformFilter
    ? { some: { platform: platformFilter as "WINDOWS" | "MAC" | "LINUX" } }
    : undefined;

  // Build pricing filter for Step 11
  let priceWhere: Record<string, unknown> | undefined;
  if (pricingFilter === "free") priceWhere = { priceFree: true };
  else if (pricingFilter === "pro") priceWhere = { priceAmount: { not: null } };

  const [products, recentChangelogs] = await Promise.all([
    prisma.product.findMany({
      where: {
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

  const hasFilters = categoryFilter || pricingFilter || platformFilter;

  return (
    <div className="space-y-10 px-4 py-6 lg:px-8 lg:py-8">
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-fg-sub">Filtered by:</span>
          {categoryFilter && <Chip label={categoryFilter} href="/" />}
          {pricingFilter && <Chip label={pricingFilter.toUpperCase()} href="/" />}
          {platformFilter && <Chip label={platformFilter} href="/" />}
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
