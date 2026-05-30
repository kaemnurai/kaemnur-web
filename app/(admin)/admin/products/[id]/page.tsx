import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { formatBytes, formatDate, productAccent } from "@/lib/utils";
import {
  updateProduct,
  deleteProduct,
  addScreenshot,
  deleteScreenshot,
  addFeature,
  deleteFeature,
  addChangelog,
  deleteChangelog,
  addProductInstaller,
  deleteProductInstaller,
  upsertRequirements,
} from "@/app/(admin)/admin/actions";
import { RatingsPanel } from "@/components/admin/RatingsPanel";

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-card p-5">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-fg">{title}</h2>
        {subtitle && <p className="text-[12px] text-fg-sub">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      screenshots: { orderBy: { order: "asc" } },
      features: { orderBy: { isPro: "asc" } },
      changelogs: { orderBy: { releasedAt: "desc" } },
      installers: { orderBy: { createdAt: "desc" } },
      requirements: true,
    },
  });
  if (!product) notFound();

  const accent = productAccent(product.slug);
  const minReq = product.requirements.find((r) => r.type === "minimum");
  const recReq = product.requirements.find((r) => r.type === "recommended");

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace · Products"
        title={product.name}
        subtitle={`v${product.version} · ${product.category}`}
        actions={
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
          >
            <Icon name="external-link" size={13} />
            View on Store
          </Link>
        }
      />

      <div className="grid gap-5 p-6 lg:grid-cols-2">
        {/* Product details */}
        <Panel title="Product details">
          <form action={updateProduct} className="space-y-3">
            <input type="hidden" name="id" value={product.id} />
            <Input id="name" name="name" label="Name" defaultValue={product.name} required />
            <Input id="slug" name="slug" label="Slug" defaultValue={product.slug} required />
            <Input id="category" name="category" label="Category" defaultValue={product.category} />
            <Input id="version" name="version" label="Version" defaultValue={product.version} />
            <Input id="tagline" name="tagline" label="Tagline" defaultValue={product.tagline ?? ""} />
            <Textarea id="description" name="description" label="Description" defaultValue={product.description} required />
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="h-4 w-4 accent-[#F4B400]" />
              Featured on landing page
            </label>
            {/* Pricing */}
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Pricing</p>
              <label className="flex items-center gap-2 text-[13px] text-fg">
                <input type="checkbox" name="priceFree" defaultChecked={product.priceFree} className="h-4 w-4 accent-[#F4B400]" />
                Free tier available
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input id="e-priceAmount" name="priceAmount" type="number" label="PRO price (Rp)" defaultValue={product.priceAmount?.toString() ?? ""} placeholder="99000" />
                <Input id="e-priceLabel" name="priceLabel" label="Display label" defaultValue={product.priceLabel ?? ""} placeholder="Rp 99.000" />
              </div>
              {(product.priceAmount || product.priceLabel) && (
                <p className="mt-1 text-[11px] text-fg-sub">
                  Preview: <span className="text-success font-medium">Free</span>
                  {product.priceLabel && <span className="text-fg-muted"> · PRO from <span className="text-accent font-medium">{product.priceLabel}</span></span>}
                </p>
              )}
            </div>
            <button type="submit" className="flex h-10 w-full items-center justify-center rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover">
              Save changes
            </button>
          </form>
          <form action={deleteProduct} className="mt-4 border-t border-line pt-4">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmit confirm={`Delete "${product.name}" and all its data?`} className="border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15">
              <Icon name="trash" size={13} />
              Delete product
            </ConfirmSubmit>
          </form>
        </Panel>

        {/* Screenshots */}
        <Panel title="Screenshots" subtitle="Paste a public image URL. Order is preserved by insertion.">
          <form action={addScreenshot} className="flex gap-2">
            <input type="hidden" name="productId" value={product.id} />
            <input name="url" type="url" required placeholder="https://image-url..." className="flex-1 rounded-btn border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40" />
            <button type="submit" className="rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover">Add</button>
          </form>
          <ul className="mt-4 space-y-2">
            {product.screenshots.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-btn border border-line bg-bg p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="" className="h-10 w-16 rounded object-cover" />
                <span className="flex-1 truncate text-[12px] text-fg-sub">{s.url}</span>
                <form action={deleteScreenshot}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <ConfirmSubmit className="text-danger hover:bg-danger/10">Remove</ConfirmSubmit>
                </form>
              </li>
            ))}
            {product.screenshots.length === 0 && <li className="text-[12px] text-fg-sub">No screenshots yet.</li>}
          </ul>
        </Panel>

        {/* Installers */}
        <Panel title="Installers" subtitle="Add download binaries per platform. Paste the direct Cloudflare R2 URL.">
          <form action={addProductInstaller} className="space-y-3">
            <input type="hidden" name="productId" value={product.id} />
            <Input id="inst-version" name="version" label="Version" placeholder="1.0.0" defaultValue={product.version} required />
            <Select id="inst-platform" name="platform" label="Platform" required>
              <option value="WINDOWS">Windows</option>
              <option value="MAC">macOS</option>
              <option value="LINUX">Linux</option>
            </Select>
            <Input id="inst-url" name="fileUrl" type="url" label="File URL (R2 or direct)" placeholder="https://..." required />
            <Input id="inst-size" name="fileSize" type="number" label="File size (bytes)" placeholder="e.g. 47185920" />
            <button type="submit" className="flex h-9 w-full items-center justify-center gap-1.5 rounded-btn bg-accent text-[12px] font-semibold text-bg hover:bg-accent-hover">
              <Icon name="plus" size={13} />
              Add installer
            </button>
          </form>
          <ul className="mt-4 divide-y divide-line">
            {product.installers.map((inst) => (
              <li key={inst.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="min-w-0">
                  <span className="font-medium text-fg">{PLATFORM_LABELS[inst.platform] ?? inst.platform}</span>
                  <span className="ml-2 font-mono text-[11px] text-fg-sub">v{inst.version}</span>
                  <span className="ml-2 text-[11px] text-fg-sub">{formatBytes(inst.fileSize)}</span>
                  <p className="truncate text-[11px] text-fg-muted">{inst.fileUrl}</p>
                </div>
                <form action={deleteProductInstaller} className="ml-4 shrink-0">
                  <input type="hidden" name="id" value={inst.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <ConfirmSubmit confirm="Delete this installer?" className="text-danger hover:bg-danger/10">
                    Delete
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
            {product.installers.length === 0 && <li className="pt-2 text-[12px] text-fg-sub">No installers yet.</li>}
          </ul>
        </Panel>

        {/* Key Features */}
        <Panel title="Key features" subtitle="Shown on the product page Overview tab.">
          <form action={addFeature} className="space-y-2">
            <input type="hidden" name="productId" value={product.id} />
            <Input id="feature-text" name="text" placeholder="Feature description" required />
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input type="checkbox" name="isPro" className="h-4 w-4 accent-[#F4B400]" />
              PRO-only feature
            </label>
            <button type="submit" className="flex h-9 w-full items-center justify-center gap-1.5 rounded-btn bg-bg text-[12px] font-semibold text-fg hover:bg-card-hover">
              <Icon name="plus" size={13} />
              Add feature
            </button>
          </form>
          <ul className="mt-4 space-y-2">
            {product.features.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-btn border border-line bg-bg px-3 py-2 text-[13px]">
                <span className="flex items-center gap-2 text-fg">
                  {f.text}
                  {f.isPro && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">PRO</span>}
                </span>
                <form action={deleteFeature}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <ConfirmSubmit className="text-danger hover:bg-danger/10">Remove</ConfirmSubmit>
                </form>
              </li>
            ))}
            {product.features.length === 0 && <li className="text-[12px] text-fg-sub">No features yet.</li>}
          </ul>
        </Panel>

        {/* System Requirements */}
        <Panel title="System requirements" subtitle="Used on the product page Requirements tab.">
          <form action={upsertRequirements} className="space-y-4">
            <input type="hidden" name="productId" value={product.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Minimum</p>
                <div className="space-y-2">
                  <Input id="min-os"   name="minimum_os"   label="OS"   defaultValue={minReq?.os   ?? ""} placeholder="Windows 10 / macOS 12" />
                  <Input id="min-cpu"  name="minimum_cpu"  label="CPU"  defaultValue={minReq?.cpu  ?? ""} placeholder="Dual-core 2 GHz" />
                  <Input id="min-ram"  name="minimum_ram"  label="RAM"  defaultValue={minReq?.ram  ?? ""} placeholder="2 GB" />
                  <Input id="min-disk" name="minimum_disk" label="Disk" defaultValue={minReq?.disk ?? ""} placeholder="200 MB" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Recommended</p>
                <div className="space-y-2">
                  <Input id="rec-os"   name="recommended_os"   label="OS"   defaultValue={recReq?.os   ?? ""} placeholder="Windows 11 / macOS 14+" />
                  <Input id="rec-cpu"  name="recommended_cpu"  label="CPU"  defaultValue={recReq?.cpu  ?? ""} placeholder="Quad-core / M1+" />
                  <Input id="rec-ram"  name="recommended_ram"  label="RAM"  defaultValue={recReq?.ram  ?? ""} placeholder="8 GB" />
                  <Input id="rec-disk" name="recommended_disk" label="Disk" defaultValue={recReq?.disk ?? ""} placeholder="1 GB SSD" />
                </div>
              </div>
            </div>
            <button type="submit" className="flex h-9 w-full items-center justify-center rounded-btn bg-bg text-[12px] font-semibold text-fg hover:bg-card-hover">
              Save requirements
            </button>
          </form>
        </Panel>

        {/* Changelog */}
        <Panel title="Changelog" subtitle="Latest versions appear first on the Changelog tab.">
          <form action={addChangelog} className="space-y-2">
            <input type="hidden" name="productId" value={product.id} />
            <Input id="cl-version" name="version" label="Version" placeholder="1.1.0" required />
            <Textarea id="cl-notes" name="notes" label="Release notes" required />
            <button type="submit" className="flex h-9 w-full items-center justify-center gap-1.5 rounded-btn bg-bg text-[12px] font-semibold text-fg hover:bg-card-hover">
              <Icon name="plus" size={13} />
              Add changelog
            </button>
          </form>
          <ul className="mt-4 space-y-3">
            {product.changelogs.map((c) => (
              <li key={c.id} className="rounded-btn border border-line bg-bg p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-bg ${accent.solid}`}>{product.name[0]}</span>
                    <span className="font-mono text-[12px] text-accent">v{c.version}</span>
                    <span className="text-[11px] text-fg-sub">{formatDate(c.releasedAt)}</span>
                  </span>
                  <form action={deleteChangelog}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <ConfirmSubmit className="text-danger hover:bg-danger/10">Remove</ConfirmSubmit>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-fg-sub">{c.notes}</p>
              </li>
            ))}
            {product.changelogs.length === 0 && <li className="text-[12px] text-fg-sub">No changelog entries yet.</li>}
          </ul>
        </Panel>

        {/* Ratings management — spans full width */}
        <div className="lg:col-span-2">
          <Panel title="Manajemen Rating">
            <RatingsPanel productId={product.id} />
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
