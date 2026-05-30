import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardChart } from "@/components/admin/DashboardChart";
import { Icon } from "@/components/ui/Icon";
import { formatCount, formatDate, productAccent, PLATFORM_LABELS } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };

// Relative time for activity feed — Step 5
function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Trend % — Step 3
function trendPercent(current: number, previous: number): { direction: "up" | "down"; text: string } | undefined {
  if (previous === 0) return current > 0 ? { direction: "up", text: "+100%" } : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { direction: pct >= 0 ? "up" : "down", text: `${pct >= 0 ? "+" : ""}${pct}%` };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period === "7d" || searchParams.period === "90d" || searchParams.period === "ytd"
    ? searchParams.period
    : "30d";

  const now = new Date();
  const periodMs: Record<string, number> = {
    "7d": 7, "30d": 30, "90d": 90, "ytd": Math.ceil((Date.now() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000),
  };
  const days = periodMs[period];
  const periodStart = new Date(Date.now() - days * 86400000);
  const prevStart = new Date(Date.now() - 2 * days * 86400000);

  const [
    productCount,
    licenseCount,
    activatedCount,
    currentDownloads,
    previousDownloads,
    currentLicenses,
    previousLicenses,
    recentLicenses,
    recentDownloads,
    products,
    allLogs,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.license.count(),
    prisma.license.count({ where: { isActivated: true } }),
    prisma.downloadLog.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.downloadLog.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
    prisma.license.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.license.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.downloadLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { installers: true, licenses: true, downloadLogs: true } } },
    }),
    // All logs in period for chart — Step 4
    prisma.downloadLog.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { createdAt: true },
    }),
  ]);

  const totalDownloads = await prisma.downloadLog.count();

  // Step 4: bin into per-day buckets for the chart
  const chartBins = new Array<number>(days).fill(0);
  for (const log of allLogs) {
    const daysAgo = Math.floor((Date.now() - log.createdAt.getTime()) / 86400000);
    const idx = days - 1 - Math.min(daysAgo, days - 1);
    chartBins[idx]++;
  }
  const hasData = chartBins.some((v) => v > 0);

  // Step 5: merge + sort activity with relative time
  type Activity = {
    id: string;
    name: string;
    action: string;
    time: Date;
    icon: React.ComponentProps<typeof Icon>["name"];
    seed: string;
  };
  const activity: Activity[] = [
    ...recentLicenses.map((l) => ({
      id: `lic-${l.id}`,
      name: l.buyerName,
      action: `Lisensi diterbitkan · ${l.product.name}`,
      time: l.createdAt,
      icon: "key" as const,
      seed: l.product.slug,
    })),
    ...recentDownloads.map((d) => ({
      id: `dl-${d.id}`,
      name: `${d.product.name} diunduh`,
      action: `${PLATFORM_LABELS[d.platform] ?? d.platform} · Indonesia`,
      time: d.createdAt,
      icon: "download" as const,
      seed: d.product.slug,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  const downloadTrend = trendPercent(currentDownloads, previousDownloads);
  const licenseTrend = trendPercent(currentLicenses, previousLicenses);
  const periodLabel = { "7d": "7 hari terakhir", "30d": "30 hari terakhir", "90d": "90 hari terakhir", ytd: "tahun ini" }[period];

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow={`Overview · ${periodLabel}`}
        title="Selamat datang kembali, Admin."
        subtitle={`${productCount} produk · ${formatCount(totalDownloads)} total download · ${activatedCount} lisensi PRO aktif`}
        actions={
          <>
            <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg">
              <Icon name="download" size={13} />
              Export Report
            </button>
            <Link href="/admin/products/new" className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover">
              <Icon name="plus" size={13} />
              Produk Baru
            </Link>
          </>
        }
      />

      <div className="space-y-5 p-6">
        {/* Stat cards with colored icon tiles + real trend % */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Produk" value={String(productCount)} icon="package" tone="orange" note="di katalog" />
          <StatCard
            label="Total Download"
            value={formatCount(totalDownloads)}
            icon="download"
            tone="emerald"
            trend={downloadTrend}
            note={`vs ${periodLabel}`}
          />
          <StatCard
            label="Total Lisensi"
            value={String(licenseCount)}
            icon="key"
            tone="accent"
            trend={licenseTrend}
            note={`${activatedCount} aktif · ${licenseCount - activatedCount} nonaktif`}
          />
          <StatCard
            label="Lisensi PRO Aktif"
            value={String(activatedCount)}
            icon="crown"
            tone="violet"
            note={`dari ${licenseCount} kunci`}
          />
        </div>

        {/* Chart + Activity */}
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Step 4: DashboardChart is a client component handling period tabs */}
          <DashboardChart
            data={chartBins}
            hasData={hasData}
            days={days}
            period={period}
          />

          {/* Activity — Step 5: relative timestamps */}
          <section className="rounded-card border border-line bg-card">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[14px] font-semibold text-fg">Aktivitas Terbaru</p>
              <Link href="/admin/licenses" className="text-[11px] font-medium text-accent hover:underline">
                Lihat semua
              </Link>
            </header>
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-fg-sub">
                Belum ada aktivitas — download dan lisensi akan muncul di sini.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((a) => {
                  const accent = productAccent(a.seed);
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded text-bg ${accent.solid}`}>
                        <Icon name={a.icon} size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-fg">{a.name}</p>
                        <p className="truncate text-[11px] text-fg-sub">{a.action}</p>
                      </div>
                      {/* Step 5: relative time */}
                      <span className="shrink-0 text-[11px] text-fg-sub">{relativeTime(a.time)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Products table */}
        <section className="rounded-card border border-line bg-card">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-[14px] font-semibold text-fg">Produk Anda</p>
            <div className="flex items-center gap-2">
              <Link href="/admin/products/new" className="inline-flex h-8 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover">
                <Icon name="plus" size={12} />
                Produk Baru
              </Link>
            </div>
          </header>
          {products.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-fg-sub">Belum ada produk.</p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Versi</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Downloads</th>
                  <th className="px-4 py-3 font-medium">Lisensi</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const accent = productAccent(p.slug);
                  const status = p._count.installers > 0 ? "Live" : "Draft";
                  return (
                    <tr key={p.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-8 w-8 place-items-center rounded-btn text-[13px] font-bold ${accent.bg} ${accent.fg}`}>
                            {p.name[0]}
                          </span>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}`} className="font-medium text-fg hover:underline">
                              {p.name}
                            </Link>
                            {p.tagline && <p className="truncate text-[11px] text-fg-sub">{p.tagline}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-fg-sub">v{p.version}</td>
                      <td className="px-4 py-3">
                        {status === "Live" ? (
                          <span className="inline-flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
                            <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg">{formatCount(p._count.downloadLogs)}</td>
                      <td className="px-4 py-3 text-fg">{p._count.licenses}</td>
                      <td className="px-4 py-3 text-[12px] text-fg-sub">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/products/${p.id}`} className="inline-grid h-7 w-7 place-items-center rounded text-fg-muted hover:bg-bg hover:text-fg">
                          <Icon name="more-horizontal" size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
