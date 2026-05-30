import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { ScreenshotGallery } from "@/components/product/ScreenshotGallery";
import { ChangelogAccordion } from "@/components/product/ChangelogAccordion";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { UpgradeButton } from "@/components/sections/UpgradeButton";
import { PlatformDownload } from "@/components/product/PlatformDownload";
import { RatingWidget } from "@/components/product/RatingWidget";
import { formatBytes, formatCount, productAccent } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "changelog" | "requirements";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "changelog", label: "Changelog" },
  { key: "requirements", label: "Requirements" },
];

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.tagline ?? product.description };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      screenshots: { orderBy: { order: "asc" } },
      features: { orderBy: { isPro: "asc" } },
      changelogs: { orderBy: { releasedAt: "desc" } },
      installers: { orderBy: { createdAt: "desc" } },
      requirements: true,
      mentionedInTopics: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { comments: true } } },
      },
      ratings: true,
    },
  });
  if (!product) notFound();

  const others = await prisma.product.findMany({
    where: { id: { not: product.id } },
    take: 3,
    orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
    include: {
      screenshots: { orderBy: { order: "asc" }, take: 1 },
      installers: { select: { platform: true } },
      ratings: { select: { rating: true } },
    },
  });

  const activeTab: TabKey =
    searchParams.tab === "changelog" || searchParams.tab === "requirements"
      ? searchParams.tab
      : "overview";

  const accent = productAccent(product.slug);
  const platforms = Array.from(new Set(product.installers.map((i) => i.platform)));
  const hasPro = product.priceAmount != null;
  const totalSize = product.installers.reduce((sum, i) => sum + i.fileSize, 0);
  const ratingAvg = product.ratings.length > 0
    ? product.ratings.reduce((s, r) => s + r.rating, 0) / product.ratings.length
    : null;
  const ratingDisplay = product.ratingOverride ?? ratingAvg;
  const minReq = product.requirements.find((r) => r.type === "minimum");
  const recReq = product.requirements.find((r) => r.type === "recommended");

  const otherCards: ProductCardData[] = others.map((o) => {
    const avg = o.ratings.length > 0
      ? o.ratings.reduce((s, r) => s + r.rating, 0) / o.ratings.length
      : null;
    return {
      name: o.name,
      slug: o.slug,
      category: o.category,
      tagline: o.tagline,
      downloadCount: o.downloadCount,
      createdAt: o.createdAt,
      isFeatured: o.isFeatured,
      priceFree: o.priceFree,
      priceAmount: o.priceAmount,
      priceLabel: o.priceLabel,
      ratingOverride: o.ratingOverride,
      ratingAvg: avg,
      ratingCount: o.ratings.length,
      platforms: Array.from(new Set(o.installers.map((i) => i.platform))),
      screenshots: o.screenshots,
    };
  });

  // Pass only what the client component needs (no full Prisma objects)
  const installerOptions = product.installers.map((i) => ({
    id: i.id,
    platform: i.platform as string,
    version: i.version,
    fileSize: i.fileSize,
  }));

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-[13px] text-fg-sub">
        <Link href="/" className="hover:text-fg">Store</Link>
        <Icon name="chevron-right" size={12} className="text-fg-muted" />
        <span className="text-fg">{product.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-fg md:text-[28px]">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-fg-sub">
          <span className="inline-flex items-center gap-1">
            <Icon name="star" size={12} className="text-accent" />
            {ratingDisplay !== null ? (
              <><span className="font-medium text-fg">{ratingDisplay.toFixed(1)}</span><span>· {product.ratings.length} rating{product.ratings.length !== 1 ? "s" : ""}</span></>
            ) : (
              <span className="text-fg-muted">No ratings yet</span>
            )}
          </span>
          <span className="rounded border border-line bg-card px-2 py-0.5">{product.category}</span>
          <span className="rounded border border-line bg-card px-2 py-0.5">Offline-first</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-line">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const href = t.key === "overview" ? "" : `?tab=${t.key}`;
          return (
            <Link
              key={t.key}
              href={`/products/${product.slug}${href}`}
              className={cn(
                "relative -mb-px border-b-2 px-1 pb-3 text-[14px] font-medium transition-colors",
                active ? "border-accent text-fg" : "border-transparent text-fg-sub hover:text-fg"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-8">
          {activeTab === "overview" && (
            <>
              {/* Screenshots — Steps 7: real DB screenshots, placeholder if empty */}
              <ScreenshotGallery
                screenshots={product.screenshots}
                productName={product.name}
                accentBg={productAccent(product.slug).bg}
                accentFg={productAccent(product.slug).fg}
              />

              <section>
                <h2 className="mb-3 text-lg font-bold text-fg">About this product</h2>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-fg-sub">
                  {product.description}
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-fg">Key features</h2>
                {product.features.length === 0 ? (
                  <p className="text-[13px] text-fg-sub">No features listed yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {product.features.map((f) => (
                      <div key={f.id} className="rounded-btn border border-line bg-card p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <Icon name="zap" size={18} className="text-accent" />
                          {f.isPro && (
                            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">PRO</span>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-fg">{f.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "changelog" && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-fg">Version history</h2>
              <ChangelogAccordion entries={product.changelogs} />
            </section>
          )}

          {activeTab === "requirements" && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-fg">System requirements</h2>
              {!minReq && !recReq ? (
                <div className="rounded-card border border-dashed border-line bg-card p-6 text-center text-[13px] text-fg-sub">
                  System requirements not yet specified for this product.
                </div>
              ) : (
                <div className="grid gap-4 rounded-card border border-line bg-card p-5 sm:grid-cols-2">
                  <RequirementsCol
                    label="Minimum"
                    rows={[
                      ["OS",   minReq?.os   ?? "—"],
                      ["CPU",  minReq?.cpu  ?? "—"],
                      ["RAM",  minReq?.ram  ?? "—"],
                      ["Disk", minReq?.disk ?? "—"],
                    ]}
                  />
                  <RequirementsCol
                    label="Recommended"
                    rows={[
                      ["OS",   recReq?.os   ?? "—"],
                      ["CPU",  recReq?.cpu  ?? "—"],
                      ["RAM",  recReq?.ram  ?? "—"],
                      ["Disk", recReq?.disk ?? "—"],
                    ]}
                  />
                </div>
              )}
            </section>
          )}

          {/* More from Kaemnur */}
          {otherCards.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-fg">More from Kaemnur</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherCards.map((c) => (
                  <ProductCard key={c.slug} product={c} />
                ))}
              </div>
            </section>
          )}

          {/* Step 8: Community discussions mentioning this product */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-bold text-fg">Community Discussions</h2>
              <Link
                href={`/community?category=General`}
                className="text-[12px] font-medium text-accent hover:underline"
              >
                All discussions →
              </Link>
            </div>
            {product.mentionedInTopics.length === 0 ? (
              <div className="rounded-card border border-dashed border-line bg-card p-6 text-center">
                <p className="text-[13px] text-fg-sub">No discussions yet. Be the first!</p>
                <Link href="/community" className="mt-2 inline-block text-[13px] font-medium text-accent hover:underline">
                  Start a discussion →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line rounded-card border border-line bg-card">
                {product.mentionedInTopics.map((topic) => (
                  <Link key={topic.id} href={`/community/${topic.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-card-hover">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-fg">{topic.title}</p>
                      <p className="text-[11px] text-fg-sub">{topic.category} · {topic.authorName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-fg-sub">
                      <Icon name="message-square" size={11} />
                      {topic._count.comments}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: install panel */}
        <aside className="self-start">
          <div className="sticky top-16 space-y-3">
            <div className="rounded-card border border-line bg-card p-4">
              <div className="flex items-baseline gap-2">
                {product.priceFree && <span className="text-xl font-bold text-success">Free</span>}
                {product.priceLabel && (
                  <span className="text-[12px] text-fg-sub">· PRO <span className="text-accent font-semibold">{product.priceLabel}</span></span>
                )}
                {!product.priceFree && !product.priceLabel && (
                  <span className="text-xl font-bold text-success">Free</span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Verified · Offline-first
              </p>

              {/* Real ratings widget */}
              <div className="mt-2">
                <RatingWidget
                  slug={product.slug}
                  initialAverage={ratingAvg}
                  initialCount={product.ratings.length}
                  initialRatingOverride={product.ratingOverride}
                />
              </div>

              {/* Step 6: platform selector + download button */}
              <PlatformDownload
                productId={product.id}
                installers={installerOptions}
              />

              {hasPro && (
                <UpgradeButton
                  productName={product.name}
                  className="mt-2 !h-10 w-full !rounded-btn !border !border-line !bg-transparent !text-[13px] !font-medium !text-fg-sub hover:!border-fg-sub hover:!text-fg"
                >
                  <Icon name="sparkles" size={14} />
                  Upgrade to PRO
                </UpgradeButton>
              )}

              <div className="my-4 border-t border-line" />

              <InfoRow icon="monitor" label="Platform">
                {platforms.length > 0
                  ? platforms.map((p) => PLATFORM_LABELS[p]).join(" · ")
                  : "—"}
              </InfoRow>
              <InfoRow icon="package" label="Size">
                {totalSize > 0 ? `${formatBytes(totalSize)} download` : "—"}
              </InfoRow>
              <InfoRow icon="shield" label="License">
                Offline-first · No telemetry
              </InfoRow>
              <InfoRow icon="wifi-off" label="Works offline">
                Optional E2E sync
              </InfoRow>

              <div className="my-4 border-t border-line" />

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                About this product
              </p>
              <dl className="grid grid-cols-2 gap-y-1.5 text-[12px]">
                <dt className="text-fg-sub">Developer</dt>
                <dd className="flex items-center gap-1.5 text-fg">
                  <span className={`inline-block h-2 w-2 rounded-sm ${accent.solid}`} />
                  Kaemnur
                </dd>
                <dt className="text-fg-sub">Release</dt>
                <dd className="text-fg">
                  {new Date(product.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
                <dt className="text-fg-sub">Version</dt>
                <dd className="font-mono text-fg">v{product.version}</dd>
                <dt className="text-fg-sub">Installs</dt>
                <dd className="text-fg">{formatCount(product.downloadCount)}+</dd>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-[12px]">
      <Icon name={icon} size={14} className="mt-0.5 text-fg-muted" />
      <div className="flex-1">
        <span className="text-fg-sub">{label}: </span>
        <span className="text-fg">{children}</span>
      </div>
    </div>
  );
}

function RequirementsCol({
  label,
  rows,
}: {
  label: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
        {label}
      </p>
      <dl className="grid grid-cols-[60px_1fr] gap-y-1.5 text-[12px]">
        {rows.map(([k, v]) => (
          <span key={k} className="contents">
            <dt className="text-fg-sub">{k}</dt>
            <dd className="font-mono text-fg">{v}</dd>
          </span>
        ))}
      </dl>
    </div>
  );
}
