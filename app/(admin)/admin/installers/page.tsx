import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { CopyButton } from "@/components/admin/CopyButton";
import { InstallerFilters } from "@/components/admin/InstallerFilters";
import { InstallerUploadForm } from "@/components/admin/InstallerUploadForm";
import { formatBytes, formatDate, productAccent } from "@/lib/utils";
import { isR2Configured } from "@/lib/r2";
import { deleteInstaller } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Admin · Releases" };
export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

const SITE_URL = "https://www.kaemnur.com";

export default async function AdminInstallersPage({
  searchParams,
}: {
  searchParams: { product?: string; platform?: string };
}) {
  const productFilter = searchParams.product?.trim() ?? "";
  const platformFilter = searchParams.platform?.trim().toUpperCase() ?? "";

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const installers = await prisma.installer.findMany({
    where: {
      ...(productFilter ? { product: { slug: productFilter } } : {}),
      ...(platformFilter ? { platform: platformFilter as "WINDOWS" | "MAC" | "LINUX" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
  });

  // Latest release per product+platform combo (for the "Latest" badge).
  const latestIds = new Map<string, string>();
  for (const inst of installers) {
    const key = `${inst.productId}:${inst.platform}`;
    if (!latestIds.has(key)) latestIds.set(key, inst.id); // list is createdAt desc, so first wins
  }

  const r2Ready = isR2Configured();

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Releases"
        subtitle={`${installers.length} installer ${installers.length === 1 ? "binary" : "binaries"} published`}
      />

      <div className="grid gap-5 p-6 lg:grid-cols-[340px_1fr]">
        {/* Upload form */}
        <div className="rounded-card border border-line bg-card p-5">
          <h2 className="mb-1 text-[14px] font-semibold text-fg">Publish installer</h2>
          <p className="mb-4 text-[12px] text-fg-sub">
            File diupload langsung dari browser ke Cloudflare R2 (presigned URL) — tidak lewat
            server, jadi file besar tetap aman.
          </p>
          {!r2Ready ? (
            <p className="mb-3 rounded-btn border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
              Cloudflare R2 belum dikonfigurasi (CLOUDFLARE_R2_* env). Upload dinonaktifkan sampai
              env diisi di Vercel.
            </p>
          ) : (
            <InstallerUploadForm products={products} />
          )}
        </div>

        {/* List */}
        <section className="rounded-card border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
            <InstallerFilters products={products} product={productFilter} platform={platformFilter} />
          </div>
          {installers.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              {productFilter || platformFilter ? "Tidak ada release yang cocok dengan filter." : "No installers yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Version</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">sha256</th>
                    <th className="px-4 py-3 font-medium">File URL</th>
                    <th className="px-4 py-3 font-medium">Update-check endpoint</th>
                    <th className="px-4 py-3 font-medium">Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {installers.map((inst) => {
                    const accent = productAccent(inst.product.slug);
                    const isLatest = latestIds.get(`${inst.productId}:${inst.platform}`) === inst.id;
                    const endpoint = `${SITE_URL}/api/updates/${inst.product.slug}?platform=${inst.platform}`;
                    return (
                      <tr key={inst.id} className="hover:bg-card-hover">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded text-[12px] font-bold text-bg ${accent.solid}`}
                            >
                              {inst.product.name[0]}
                            </span>
                            <span className="font-medium text-fg">{inst.product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fg-sub">
                          {PLATFORM_LABELS[inst.platform] ?? inst.platform}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[12px] text-fg-sub">v{inst.version}</span>
                            {isLatest && (
                              <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fg">{formatBytes(inst.fileSize)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] text-fg-muted">
                              {inst.sha256.slice(0, 10)}…
                            </span>
                            <CopyButton value={inst.sha256} title="Copy sha256" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={inst.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-[160px] truncate text-[11px] text-info hover:underline"
                            >
                              {inst.fileUrl}
                            </a>
                            <CopyButton value={inst.fileUrl} title="Copy file URL" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="max-w-[160px] truncate text-[11px] text-fg-muted">{endpoint}</span>
                            <CopyButton value={endpoint} title="Copy endpoint" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-fg-sub">
                          {formatDate(inst.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={deleteInstaller}>
                            <input type="hidden" name="id" value={inst.id} />
                            <ConfirmSubmit
                              confirm="Delete this installer?"
                              className="px-3 py-1.5 text-[12px] font-medium text-danger hover:bg-danger/10"
                            >
                              Delete
                            </ConfirmSubmit>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
