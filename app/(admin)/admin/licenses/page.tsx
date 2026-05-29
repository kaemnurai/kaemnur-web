import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { GenerateLicenseModal } from "@/components/admin/GenerateLicenseModal";
import { LicenseFilters } from "@/components/admin/LicenseFilters";
import { LicenseRowActions } from "@/components/admin/LicenseRowActions";
import { maskLicenseKey } from "@/lib/license";
import { PLATFORM_LABELS } from "@/lib/utils";

export const metadata = { title: "Admin · Lisensi" };

const PAGE_SIZE = 20;

function tanggalID(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type StatusKind = "aktif" | "direset" | "belum";

function statusOf(l: { isActivated: boolean; resetAt: Date | null }): StatusKind {
  if (l.isActivated) return "aktif";
  if (l.resetAt) return "direset";
  return "belum";
}

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "all";
  const page = Math.max(1, Number(searchParams.page) || 1);

  // Build the Prisma filter
  const where: Prisma.LicenseWhereInput = {};
  if (q) {
    where.OR = [
      { buyerName: { contains: q, mode: "insensitive" } },
      { buyerWhatsapp: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status === "active") where.isActivated = true;
  else if (status === "inactive") where.isActivated = false;

  const [products, total, licenses, activeCount] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.license.count({ where }),
    prisma.license.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { name: true } } },
    }),
    prisma.license.count({ where: { isActivated: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Helper to build pagination links preserving filters
  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    params.set("page", String(p));
    return `/admin/licenses?${params.toString()}`;
  }

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Manajemen Lisensi"
        subtitle={`${total} lisensi cocok · ${activeCount} aktif`}
        actions={<GenerateLicenseModal products={products} />}
      />

      <div className="space-y-4 p-6">
        <LicenseFilters />

        <section className="overflow-hidden rounded-card border border-line bg-card">
          {licenses.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              {q || status !== "all"
                ? "Tidak ada lisensi yang cocok dengan filter."
                : "Belum ada lisensi. Klik “Generate Lisensi Baru” untuk membuat."}
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Kunci Lisensi</th>
                  <th className="px-4 py-3 font-medium">Pembeli</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">ID Perangkat</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3 font-medium">Aktivasi</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {licenses.map((l) => {
                  const kind = statusOf(l);
                  return (
                    <tr key={l.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-fg">{maskLicenseKey(l.key)}</span>
                      </td>
                      <td className="px-4 py-3 text-fg">{l.buyerName}</td>
                      <td className="px-4 py-3 text-fg-sub">{l.buyerWhatsapp}</td>
                      <td className="px-4 py-3">
                        {kind === "aktif" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            Aktif
                          </span>
                        )}
                        {kind === "direset" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            Direset
                          </span>
                        )}
                        {kind === "belum" && (
                          <span className="inline-flex items-center gap-1.5 rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
                            <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />
                            Belum Diaktifkan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.deviceId ? (
                          <span className="font-mono text-[12px] text-fg-sub">
                            {l.deviceId.slice(0, 8).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-fg-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-sub">
                        {l.activatedPlatform ? (PLATFORM_LABELS[l.activatedPlatform] ?? l.activatedPlatform) : "-"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-fg-sub">{tanggalID(l.createdAt)}</td>
                      <td className="px-4 py-3 text-[12px] text-fg-sub">{tanggalID(l.activatedAt)}</td>
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
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="h-8 rounded-btn border border-line px-3 text-[12px] leading-8 text-fg-sub hover:bg-card">
                ← Sebelumnya
              </Link>
            ) : (
              <span className="h-8 rounded-btn border border-line px-3 text-[12px] leading-8 text-fg-muted opacity-40">← Sebelumnya</span>
            )}
            <span className="text-[12px] text-fg-sub">Halaman {page} dari {pageCount}</span>
            {page < pageCount ? (
              <Link href={pageHref(page + 1)} className="h-8 rounded-btn border border-line px-3 text-[12px] leading-8 text-fg-sub hover:bg-card">
                Berikutnya →
              </Link>
            ) : (
              <span className="h-8 rounded-btn border border-line px-3 text-[12px] leading-8 text-fg-muted opacity-40">Berikutnya →</span>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
