import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { StatCard } from "@/components/admin/StatCard";
import { CopyButton } from "@/components/admin/CopyButton";
import { GenerateLicenseModal } from "@/components/admin/GenerateLicenseModal";
import { LicenseFilters } from "@/components/admin/LicenseFilters";
import { LicenseRowActions } from "@/components/admin/LicenseRowActions";
import { LicenseAssign } from "@/components/admin/LicenseAssign";
import { maskLicenseKey } from "@/lib/license";
import { productAccent } from "@/lib/utils";

export const metadata = { title: "Admin · Lisensi" };

const PAGE_SIZE = 20;

function tanggalID(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type StatusKind = "aktif" | "nonaktif" | "expired";

function statusOf(l: { isActivated: boolean; expiresAt: Date | null }, now: Date): StatusKind {
  if (l.expiresAt && l.expiresAt < now) return "expired";
  if (l.isActivated) return "aktif";
  return "nonaktif";
}

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; product?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "all";
  const productId = (searchParams.product ?? "").trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const now = new Date();

  // not-expired predicate (null expiry = never expires)
  const notExpired: Prisma.LicenseWhereInput = {
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  // Build the Prisma filter as an AND of independent clauses.
  const and: Prisma.LicenseWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { buyerName: { contains: q, mode: "insensitive" } },
        { buyerWhatsapp: { contains: q, mode: "insensitive" } },
        { key: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (productId) and.push({ productId });
  if (status === "active") and.push({ isActivated: true }, notExpired);
  else if (status === "inactive") and.push({ isActivated: false }, notExpired);
  else if (status === "expired") and.push({ expiresAt: { lt: now } });
  const where: Prisma.LicenseWhereInput = and.length ? { AND: and } : {};

  const [products, total, licenses, totalAll, activeCount, inactiveCount, expiredCount] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.license.count({ where }),
    prisma.license.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true, version: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.license.count(),
    prisma.license.count({ where: { AND: [{ isActivated: true }, notExpired] } }),
    prisma.license.count({ where: { AND: [{ isActivated: false }, notExpired] } }),
    prisma.license.count({ where: { expiresAt: { lt: now } } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (productId) params.set("product", productId);
    params.set("page", String(p));
    return `/admin/licenses?${params.toString()}`;
  }

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Manajemen Lisensi"
        subtitle={`${total} lisensi cocok · ${activeCount} aktif · ${expiredCount} expired`}
        actions={<GenerateLicenseModal products={products} />}
      />

      <div className="space-y-4 p-6">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Lisensi" value={String(totalAll)} icon="key" tone="accent" note="semua lisensi" />
          <StatCard label="Aktif" value={String(activeCount)} icon="check" tone="success" note="terpasang & valid" />
          <StatCard label="Nonaktif" value={String(inactiveCount)} icon="clock" tone="warning" note="belum diaktifkan" />
          <StatCard label="Expired" value={String(expiredCount)} icon="alert-triangle" tone="danger" note="kedaluwarsa" />
        </div>

        <LicenseFilters products={products} />

        <section className="overflow-hidden rounded-card border border-line bg-card">
          {licenses.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              {q || status !== "all" || productId
                ? "Tidak ada lisensi yang cocok dengan filter."
                : "Belum ada lisensi. Klik “Generate Lisensi Baru” untuk membuat."}
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">License Key</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {licenses.map((l) => {
                  const kind = statusOf(l, now);
                  const accent = productAccent(l.buyerName || l.id);
                  const expired = kind === "expired";
                  return (
                    <tr key={l.id} className="hover:bg-card-hover">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold ${accent.bg} ${accent.fg}`}>
                            {(l.buyerName || "?")[0].toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-fg">{l.buyerName}</p>
                            <p className="text-[11px] text-fg-sub">{l.buyerWhatsapp}</p>
                            <div className="mt-0.5">
                              <LicenseAssign licenseId={l.id} linkedEmail={l.user?.email ?? null} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <p className="text-fg">{l.product.name}</p>
                        <p className="font-mono text-[11px] text-fg-sub">v{l.product.version}</p>
                      </td>

                      {/* License key */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[12px] text-fg">{maskLicenseKey(l.key)}</span>
                          <CopyButton value={l.key} title="Salin license key" />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {kind === "aktif" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            Aktif
                          </span>
                        )}
                        {kind === "nonaktif" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            Nonaktif
                          </span>
                        )}
                        {kind === "expired" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-[12px] text-fg-sub">{tanggalID(l.createdAt)}</td>

                      {/* Expires */}
                      <td className={`px-4 py-3 text-[12px] ${expired ? "font-medium text-danger" : "text-fg-sub"}`}>
                        {l.expiresAt ? tanggalID(l.expiresAt) : "Selamanya"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <LicenseRowActions
                          licenseId={l.id}
                          fullKey={l.key}
                          maskedKey={maskLicenseKey(l.key)}
                          isActivated={l.isActivated}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[12px] text-fg-sub">
              Menampilkan {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} sampai{" "}
              {Math.min(page * PAGE_SIZE, total)} dari {total} lisensi
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className={
                      p === page
                        ? "grid h-8 min-w-8 place-items-center rounded-btn bg-accent px-2 text-[12px] font-semibold text-bg"
                        : "grid h-8 min-w-8 place-items-center rounded-btn border border-line px-2 text-[12px] text-fg-sub hover:bg-card"
                    }
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
