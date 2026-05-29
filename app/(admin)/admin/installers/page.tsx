import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Input, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { formatBytes, formatDate, productAccent } from "@/lib/utils";
import { isR2Configured } from "@/lib/r2";
import { addInstaller, deleteInstaller } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Admin · Releases" };

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

export default async function AdminInstallersPage() {
  const [products, installers] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.installer.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  const r2Ready = isR2Configured();

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Releases"
        subtitle={`${installers.length} installer ${installers.length === 1 ? "binary" : "binaries"} published`}
      />

      <div className="grid gap-5 p-6 lg:grid-cols-[320px_1fr]">
        {/* Upload form */}
        <div className="rounded-card border border-line bg-card p-5">
          <h2 className="mb-1 text-[14px] font-semibold text-fg">Publish installer</h2>
          <p className="mb-4 text-[12px] text-fg-sub">
            Pick a product, version and platform. The installer link appears on the
            Library + product page.
          </p>
          {!r2Ready && (
            <p className="mb-3 rounded-btn border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
              Cloudflare R2 is not configured. Paste a direct file URL + size for now.
            </p>
          )}
          <form
            action={addInstaller}
            className="space-y-3"
            encType="multipart/form-data"
          >
            <Select id="productId" name="productId" label="Product" required>
              {products.length === 0 && <option value="">No products</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input id="version" name="version" label="Version" placeholder="1.0.0" required />
            <Select id="platform" name="platform" label="Platform" required>
              <option value="WINDOWS">Windows</option>
              <option value="MAC">macOS</option>
              <option value="LINUX">Linux</option>
            </Select>

            {r2Ready ? (
              <div className="space-y-1.5">
                <label htmlFor="file" className="block text-[12px] font-medium text-fg">
                  Installer file
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  className="block w-full text-[12px] text-fg-sub file:mr-3 file:rounded-btn file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-bg hover:file:bg-accent-hover"
                />
              </div>
            ) : (
              <>
                <Input id="fileUrl" name="fileUrl" type="url" label="File URL" required />
                <Input
                  id="fileSize"
                  name="fileSize"
                  type="number"
                  label="File size (bytes)"
                  placeholder="e.g. 5242880"
                />
              </>
            )}

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
            >
              <Icon name="plus" size={13} />
              Publish installer
            </button>
          </form>
        </div>

        {/* List */}
        <section className="rounded-card border border-line bg-card">
          {installers.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              No installers yet.
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {installers.map((inst) => {
                  const accent = productAccent(inst.product.slug);
                  return (
                    <tr key={inst.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded text-[12px] font-bold text-bg ${accent.solid}`}
                          >
                            {inst.product.name[0]}
                          </span>
                          <span className="font-medium text-fg">{inst.product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-sub">
                        {PLATFORM_LABELS[inst.platform] ?? inst.platform}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-fg-sub">
                        v{inst.version}
                      </td>
                      <td className="px-4 py-3 text-fg">{formatBytes(inst.fileSize)}</td>
                      <td className="px-4 py-3 text-[12px] text-fg-sub">
                        {formatDate(inst.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteInstaller}>
                          <input type="hidden" name="id" value={inst.id} />
                          <ConfirmSubmit
                            confirm="Delete this installer?"
                            className="text-danger hover:bg-danger/10"
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
          )}
        </section>
      </div>
    </AdminShell>
  );
}
