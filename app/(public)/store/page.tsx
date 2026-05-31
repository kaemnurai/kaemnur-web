import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductSection } from "@/components/sections/ProductSection";
import type { ProductCardData } from "@/components/product/ProductCard";

// Store catalog (ISR 60s). Same grid components as the homepage, sorted by the
// `sort` param from the BROWSE menu and narrowed by the FILTERS sidebar.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Store",
  description: "Browse all Kaemnur apps — top sellers, new releases, and everything else.",
};

type SortKey = "top-seller" | "new" | "all";

const SORT_TITLE: Record<SortKey, string> = {
  "top-seller": "Top Seller",
  new: "New Releases",
  all: "All Products",
};

type Platform = "WINDOWS" | "MAC" | "LINUX";

export default async function StorePage({
  searchParams,
}: {
  searchParams: {
    sort?: string;
    q?: string;
    category?: string;
    pricing?: string;
    platform?: string;
  };
}) {
  const sort: SortKey =
    searchParams.sort === "top-seller" || searchParams.sort === "new"
      ? searchParams.sort
      : "all";

  const searchQuery = searchParams.q?.trim() || undefined;
  const categoryFilter = searchParams.category?.trim() || undefined;
  const pricingFilters = (searchParams.pricing ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const platformFilters = (searchParams.platform ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is Platform => s === "WINDOWS" || s === "MAC" || s === "LINUX");

  // Each multi-select group is its own OR; AND them so search + pricing combine
  // correctly instead of one OR overwriting the other.
  const and: Prisma.ProductWhereInput[] = [];
  if (searchQuery) {
    and.push({
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { category: { contains: searchQuery, mode: "insensitive" } },
        { tagline: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ],
    });
  }
  const priceConditions: Prisma.ProductWhereInput[] = [];
  if (pricingFilters.includes("free")) priceConditions.push({ priceFree: true });
  if (pricingFilters.includes("pro")) priceConditions.push({ priceAmount: { not: null } });
  if (priceConditions.length > 0) and.push({ OR: priceConditions });

  const where: Prisma.ProductWhereInput = {
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(platformFilters.length > 0
      ? { installers: { some: { platform: { in: platformFilters } } } }
      : {}),
    ...(and.length > 0 ? { AND: and } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "top-seller"
      ? [{ downloadCount: "desc" }, { createdAt: "desc" }]
      : sort === "new"
      ? [{ createdAt: "desc" }]
      : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      screenshots: { orderBy: { order: "asc" }, take: 1 },
      installers: { select: { platform: true } },
      ratings: { select: { rating: true } },
    },
  });

  const cards: ProductCardData[] = products.map((p) => {
    const ratingAvg =
      p.ratings.length > 0
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

  const title = SORT_TITLE[sort];
  const hasFilters =
    Boolean(categoryFilter) ||
    Boolean(searchQuery) ||
    pricingFilters.length > 0 ||
    platformFilters.length > 0;

  return (
    <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      {cards.length === 0 ? (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Browse</p>
            <h1 className="mt-1 text-[22px] font-bold text-fg">{title}</h1>
          </div>
          <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-[13px] text-fg-sub">
            {hasFilters ? "Tidak ada produk yang cocok dengan filter." : "Belum ada produk."}
          </div>
        </div>
      ) : (
        <ProductSection
          eyebrow="Browse"
          title={title}
          subtitle={`${cards.length} produk`}
          products={cards}
        />
      )}
    </div>
  );
}
