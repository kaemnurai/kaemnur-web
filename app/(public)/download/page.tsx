import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { SortDropdown } from "@/components/library/SortDropdown";
import { getDisplayRating } from "@/lib/rating";
import { formatBytes, formatCount, productAccent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Library",
  description: "Download the latest Kaemnur apps — free, offline-first installers.",
};

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

const PLATFORM_ICONS: Record<string, React.ComponentProps<typeof Icon>["name"]> = {
  WINDOWS: "monitor",
  MAC: "apple",
  LINUX: "linux",
};

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort ?? "az";
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "za"
      ? { name: "desc" }
      : sort === "downloads"
      ? { downloadCount: "desc" }
      : { name: "asc" };

  const products = await prisma.product.findMany({
    orderBy,
    include: {
      installers: { orderBy: { createdAt: "desc" } },
      ratings: { select: { rating: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Your Library
          </p>
          <h1 className="mt-1 text-2xl font-bold text-fg">All products</h1>
          <p className="mt-1 text-[13px] text-fg-sub">
            Semua aplikasi yang tersedia di Kaemnur. Unduh gratis dan upgrade ke versi offline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-fg-sub">{products.length} products</span>
          <SortDropdown current={sort} />
        </div>
      </header>

      {products.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-fg-sub">
          No products available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const accent = productAccent(product.slug);
            const totalSize = product.installers.reduce((s, i) => s + i.fileSize, 0);
            const { value: rating, count: ratingCount } = getDisplayRating(product);
            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-card border border-line bg-card p-4 transition-colors hover:border-fg-muted hover:bg-card-hover lg:flex-row lg:items-center"
              >
                {/* Logo */}
                <Link href={`/products/${product.slug}`} className="shrink-0">
                  <span
                    className={`grid h-16 w-16 place-items-center rounded-card border border-line bg-bg text-[26px] font-extrabold ${accent.fg}`}
                  >
                    {product.name[0]}
                  </span>
                </Link>

                {/* Middle */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-[15px] font-semibold text-fg hover:text-accent"
                    >
                      {product.name}
                    </Link>
                    <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-fg-sub">
                      {product.category}
                    </span>
                    <span className="font-mono text-[11px] text-fg-muted">v{product.version}</span>
                  </div>
                  {product.tagline && (
                    <p className="mt-1 line-clamp-1 text-[12px] text-fg-sub">{product.tagline}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-sub">
                    {rating !== null && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-accent">★</span>
                        <span className="font-medium text-fg">{rating.toFixed(1)}</span>
                        {ratingCount > 0 && <span>({ratingCount})</span>}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Icon name="download" size={11} />
                      {formatCount(product.downloadCount)} installs
                    </span>
                    {totalSize > 0 && <span>{formatBytes(totalSize)}</span>}
                  </div>
                </div>

                {/* Right: outlined platform buttons */}
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {product.installers.length === 0 ? (
                    <span className="text-[12px] text-fg-muted">Installer belum tersedia</span>
                  ) : (
                    product.installers.map((inst) => (
                      <a
                        key={inst.id}
                        href={`/api/download?id=${inst.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-accent px-3 text-[12px] font-semibold text-accent transition-colors hover:bg-accent hover:text-bg"
                      >
                        <Icon name={PLATFORM_ICONS[inst.platform] ?? "download"} size={13} />
                        {PLATFORM_LABELS[inst.platform] ?? inst.platform}
                        <span className="opacity-70">· {formatBytes(inst.fileSize)}</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
