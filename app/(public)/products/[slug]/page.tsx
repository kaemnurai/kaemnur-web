import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { ScreenshotGallery } from "@/components/product/ScreenshotGallery";
import { ChangelogAccordion } from "@/components/product/ChangelogAccordion";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { ProductLogo } from "@/components/product/ProductLogo";
import { UpgradeProButton } from "@/components/product/UpgradeProButton";
import { PlatformDownload } from "@/components/product/PlatformDownload";
import { KaemFormLaunchCard } from "@/components/product/KaemFormLaunchCard";
import { ReviewSection } from "@/components/product/ReviewSection";
import { getDisplayRating } from "@/lib/rating";
import { getKaemformLicenseInfo, type KaemFormLicenseInfo } from "@/lib/kaemform-license";
import { formatBytes, formatCount, productAccent } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Product pages are dynamic for KaemForm (per-user license lookup), and
// `searchParams` (tab/desktop/launch) forces dynamic rendering for every
// product — so `revalidate` never actually applied here. The two catalog
// reads below are memoized directly via unstable_cache instead, which keeps
// the same ~120s freshness window in effect regardless of page dynamism.
const getProductBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.product.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" } },
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
  },
  ["product-by-slug"],
  { revalidate: 120 }
);

const getOtherProducts = unstable_cache(
  async (excludeId: string) => {
    return prisma.product.findMany({
      where: { id: { not: excludeId } },
      take: 4,
      orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
      include: {
        screenshots: { orderBy: { order: "asc" }, take: 1 },
        installers: { select: { platform: true } },
        ratings: { select: { rating: true } },
      },
    });
  },
  ["product-others"],
  { revalidate: 120 }
);

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
  const product = await prisma.product.findFirst({
    where: { slug: { equals: params.slug, mode: "insensitive" } },
  });
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.tagline ?? product.description };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string; desktop?: string; launch?: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const others = await getOtherProducts(product.id);

  const activeTab: TabKey =
    searchParams.tab === "changelog" || searchParams.tab === "requirements"
      ? searchParams.tab
      : "overview";
  const isOverview = activeTab === "overview";

  const accent = productAccent(product.slug);
  const platforms = Array.from(new Set(product.installers.map((i) => i.platform)));
  const hasPro = product.priceAmount != null;
  const totalSize = product.installers.reduce((sum, i) => sum + i.fileSize, 0);
  const { value: ratingDisplay, count: ratingCount } = getDisplayRating(product);
  const minReq = product.requirements.find((r) => r.type === "minimum");
  const recReq = product.requirements.find((r) => r.type === "recommended");

  // KaemForm is a SaaS product — swap the desktop "Install card" for a
  // launch card driven by the signed-in user's KaemForm license.
  const isKaemform = product.slug.toLowerCase() === "kaemform";
  let kaemformLicense: KaemFormLicenseInfo = { type: "free", expiresAt: null, trialClaimed: false };
  let kaemformLoggedIn = false;
  if (isKaemform) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    kaemformLoggedIn = !!user;
    if (user) kaemformLicense = await getKaemformLicenseInfo(product.id, user.id);
  }

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

  const installerOptions = product.installers.map((i) => ({
    id: i.id,
    platform: i.platform as string,
    version: i.version,
    fileSize: i.fileSize,
  }));

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-fg-sub">
        <Link href="/store" className="hover:text-fg">Store</Link>
        <Icon name="chevron-right" size={12} className="text-fg-muted" />
        <span className="text-fg-sub">{product.category}</span>
        <Icon name="chevron-right" size={12} className="text-fg-muted" />
        <span className="text-fg">{product.name}</span>
      </nav>

      {/* Header: logo + name + meta (full width) */}
      <header className="flex items-start gap-4">
        <ProductLogo
          name={product.name}
          slug={product.slug}
          logoUrl={product.logoUrl}
          size="lg"
          className="bg-card"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-fg md:text-[28px]">{product.name}</h1>
            <span className="rounded border border-line bg-card px-2 py-0.5 text-[11px] font-medium text-fg-sub">
              {product.category}
            </span>
            <span className="rounded border border-line bg-card px-2 py-0.5 font-mono text-[11px] text-fg-sub">
              v{product.version}
            </span>
          </div>
          {product.tagline && (
            <p className="mt-1.5 text-[14px] text-fg-sub">{product.tagline}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-sub">
            {ratingDisplay !== null && (
              <a href="#reviews" className="inline-flex items-center gap-1 hover:text-fg">
                <span className="text-accent">★</span>
                <span className="font-medium text-fg">{ratingDisplay.toFixed(1)}</span>
                <span>· {ratingCount} ulasan</span>
              </a>
            )}
            <span className="text-fg-muted">·</span>
            <span>{product.category}</span>
            <span className="text-fg-muted">·</span>
            <span className="rounded bg-success/15 px-1.5 py-0.5 text-[11px] font-medium text-success">Free</span>
            {hasPro && (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">PRO</span>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mt-6 flex gap-6 border-b border-line">
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

      {/* Main two-column grid — left content + right install/features */}
      <div
        className={cn(
          "mt-6 grid gap-6 lg:grid-cols-[1fr_340px]",
          isOverview ? "lg:items-stretch" : "lg:items-start"
        )}
      >
        {/* ── Left column ── */}
        <div className="flex min-w-0 flex-col gap-6">
          {isOverview && (
            <>
              <ScreenshotGallery
                screenshots={product.screenshots}
                productName={product.name}
                accentBg={accent.bg}
                accentFg={accent.fg}
              />
              <section className="flex-1">
                <h2 className="mb-3 text-lg font-bold text-fg">About this product</h2>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-fg-sub">
                  {product.description}
                </p>
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
                  <RequirementsCol label="Minimum" rows={[
                    ["OS", minReq?.os ?? "—"], ["CPU", minReq?.cpu ?? "—"],
                    ["RAM", minReq?.ram ?? "—"], ["Disk", minReq?.disk ?? "—"],
                  ]} />
                  <RequirementsCol label="Recommended" rows={[
                    ["OS", recReq?.os ?? "—"], ["CPU", recReq?.cpu ?? "—"],
                    ["RAM", recReq?.ram ?? "—"], ["Disk", recReq?.disk ?? "—"],
                  ]} />
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Right column: install card + Fitur Utama ── */}
        <aside className="flex flex-col gap-4">
          {/* Install card (or KaemForm launch card for the SaaS product) */}
          {isKaemform ? (
            <KaemFormLaunchCard
              productId={product.id}
              productSlug={product.slug}
              loggedIn={kaemformLoggedIn}
              licenseType={kaemformLicense.type}
              expiresAt={kaemformLicense.expiresAt ? kaemformLicense.expiresAt.toISOString() : null}
              trialClaimed={kaemformLicense.trialClaimed}
              launchMode={
                searchParams.desktop === "1"
                  ? "desktop"
                  : searchParams.launch === "1"
                    ? "web"
                    : null
              }
            />
          ) : (
          <div className="rounded-card border border-line bg-card p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-success">Free</span>
              {product.priceLabel && (
                <span className="text-[12px] text-fg-sub">· PRO <span className="font-semibold text-accent">{product.priceLabel}</span></span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Verified · Offline-first
            </p>

            {ratingDisplay !== null && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-fg-sub hover:text-fg">
                <span className="text-accent">{"★".repeat(Math.round(ratingDisplay))}<span className="text-fg-muted/30">{"★".repeat(5 - Math.round(ratingDisplay))}</span></span>
                <span className="font-semibold text-fg">{ratingDisplay.toFixed(1)}</span>
                <span>· {ratingCount} ulasan</span>
              </a>
            )}

            <PlatformDownload slug={product.slug} installers={installerOptions} />

            {hasPro && (
              <UpgradeProButton
                productId={product.id}
                slug={product.slug}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-line bg-transparent text-[13px] font-medium text-fg-sub transition-colors hover:border-fg-sub hover:text-fg disabled:opacity-60"
              >
                <Icon name="sparkles" size={14} />
                Upgrade to PRO
              </UpgradeProButton>
            )}

            <div className="my-4 border-t border-line" />

            <InfoRow icon="monitor" label="Platform">
              {platforms.length > 0 ? platforms.map((p) => PLATFORM_LABELS[p]).join(" · ") : "—"}
            </InfoRow>
            <InfoRow icon="package" label="Size">
              {totalSize > 0 ? `${formatBytes(totalSize)} download` : "—"}
            </InfoRow>
            <InfoRow icon="shield" label="License">Offline-first · No telemetry</InfoRow>
            <InfoRow icon="wifi-off" label="Works offline">Optional E2E sync</InfoRow>

            <div className="my-4 border-t border-line" />

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              About this product
            </p>
            <dl className="grid grid-cols-2 gap-y-1.5 text-[12px]">
              <dt className="text-fg-sub">Developer</dt>
              <dd className="flex items-center gap-1.5 text-fg">
                <span className={cn("inline-block h-2 w-2 rounded-sm", accent.solid)} />
                Kaemnur
              </dd>
              <dt className="text-fg-sub">Release date</dt>
              <dd className="text-fg">
                {new Date(product.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </dd>
              <dt className="text-fg-sub">Version</dt>
              <dd className="font-mono text-fg">v{product.version}</dd>
              <dt className="text-fg-sub">Installs</dt>
              <dd className="text-fg">{formatCount(product.downloadCount)}+</dd>
            </dl>
          </div>
          )}

          {/* Fitur Utama — stretches to match the left column */}
          <div className="flex-1 rounded-card border border-line bg-card p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Fitur Utama
            </p>
            {product.features.length === 0 ? (
              <p className="text-[12px] text-fg-sub">Belum ada fitur yang dicantumkan.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                    <th className="pb-2 font-medium">Feature</th>
                    <th className="w-10 pb-2 text-center font-medium">Free</th>
                    <th className="w-10 pb-2 text-center font-medium">PRO</th>
                  </tr>
                </thead>
                <tbody>
                  {product.features.map((f) => (
                    <tr key={f.id} className="border-b border-line last:border-b-0">
                      <td className="py-2 pr-2 text-[12px] text-fg">{f.text}</td>
                      <td className="py-2 text-center text-[13px]">
                        {f.isPro ? (
                          <span className="text-fg-muted">—</span>
                        ) : (
                          <span className="font-bold text-accent">✓</span>
                        )}
                      </td>
                      <td className="py-2 text-center text-[13px]">
                        <span className="font-bold text-accent">✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom row — Ulasan Pengguna + Community Discussions (overview only) */}
      {isOverview && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Ulasan Pengguna */}
          <div className="rounded-card border border-line bg-card p-5">
            <ReviewSection slug={product.slug} reviewCount={product.ratings.length} />
          </div>

          {/* Community Discussions */}
          <div className="rounded-card border border-line bg-card p-5">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-bold text-fg">Community Discussions</h2>
              <Link href="/community?category=General" className="text-[12px] font-medium text-accent hover:underline">
                All discussions →
              </Link>
            </div>
            {product.mentionedInTopics.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-bg/40 px-4 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-fg-muted">
                  <Icon name="message-square" size={22} />
                </span>
                <p className="text-[13px] text-fg-sub">No discussions yet. Be the first!</p>
                <Link
                  href="/community"
                  className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-4 text-[12px] font-semibold text-bg hover:bg-accent-hover"
                >
                  <Icon name="plus" size={13} />
                  Start a discussion
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {product.mentionedInTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/community/${topic.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
                  >
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
          </div>
        </div>
      )}

      {otherCards.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-fg">More from Kaemnur</h2>
          {/* Same grid breakpoints as the store/homepage grids so cards stay
              the same compact size everywhere (3–4 per row on desktop). */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherCards.map((c) => (
              <ProductCard key={c.slug} product={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoRow({ icon, label, children }: {
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

function RequirementsCol({ label, rows }: { label: string; rows: [string, string][] }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{label}</p>
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
