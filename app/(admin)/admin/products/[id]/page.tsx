import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { formatBytes, formatDate } from "@/lib/utils";
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
import { ProductTabs, type ProductTab } from "./ProductTabs";
import { LogoUploader } from "./LogoUploader";
import { DescriptionField } from "./DescriptionField";

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

const CATEGORIES = ["PDF", "Productivity", "Design", "Developer", "Utility", "Security", "AI"];

const btnYellow =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover";
const btnOutline =
  "inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg";

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-card p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold text-fg">{title}</h2>}
            {subtitle && <p className="text-[12px] text-fg-sub">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-accent/20 bg-accent/5 p-4">
      <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-accent" />
      <div className="text-[12px] text-fg-sub">
        <p className="font-semibold text-accent">Tips</p>
        <p className="mt-0.5">{children}</p>
      </div>
    </div>
  );
}

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

  const minReq = product.requirements.find((r) => r.type === "minimum");
  const recReq = product.requirements.find((r) => r.type === "recommended");
  const categories = Array.from(new Set([product.category, ...CATEGORIES]));

  /* ───────────── General ───────────── */
  const generalTab = (
    <form id="general-form" action={updateProduct} className="grid gap-5 lg:grid-cols-3">
      <input type="hidden" name="id" value={product.id} />
      <div className="lg:col-span-2">
        <Card title="Product Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="name" name="name" label="Name" defaultValue={product.name} required />
            <Input id="slug" name="slug" label="Slug" defaultValue={product.slug} required />
            <Select id="category" name="category" label="Category" defaultValue={product.category}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input id="version" name="version" label="Version" defaultValue={product.version} />
          </div>
          <div className="mt-4">
            <Textarea
              id="tagline"
              name="tagline"
              label="Tagline"
              defaultValue={product.tagline ?? ""}
            />
          </div>
          <div className="mt-4">
            <DescriptionField defaultValue={product.description} />
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Pricing" subtitle="Atur harga produk Anda.">
          <label className="flex items-center gap-2 text-[13px] text-fg">
            <input
              type="checkbox"
              name="priceFree"
              defaultChecked={product.priceFree}
              className="h-4 w-4 accent-[#F4B400]"
            />
            Free tier available
          </label>
          <div className="mt-3 space-y-3">
            <Input
              id="priceAmount"
              name="priceAmount"
              type="number"
              label="PRO price (Rp)"
              defaultValue={product.priceAmount?.toString() ?? ""}
              placeholder="99000"
            />
            <Input
              id="priceLabel"
              name="priceLabel"
              label="Display label"
              defaultValue={product.priceLabel ?? ""}
              placeholder="Rp 99.000"
            />
          </div>
          <p className="mt-3 text-[11px] text-fg-sub">
            Preview:{" "}
            <span className="font-medium text-success">{product.priceFree ? "Free tier" : "Paid"}</span>
            {product.priceLabel && (
              <span className="text-fg-muted">
                {" "}
                · PRO from <span className="font-medium text-accent">{product.priceLabel}</span>
              </span>
            )}
          </p>
        </Card>

        <Card title="Featured">
          <label className="flex items-center gap-2 text-[13px] text-fg">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product.isFeatured}
              className="h-4 w-4 accent-[#F4B400]"
            />
            Featured on landing page
          </label>
        </Card>
      </div>
    </form>
  );

  /* ───────────── Media ───────────── */
  const mediaTab = (
    <Card
      title="Screenshots"
      subtitle="PNG, JPG or WEBP. Maks 5MB per file."
      action={
        <form action={addScreenshot} className="flex items-center gap-2">
          <input type="hidden" name="productId" value={product.id} />
          <input
            name="url"
            type="url"
            required
            placeholder="https://image-url…"
            className="h-9 w-56 rounded-btn border border-line bg-bg px-3 text-[12px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button type="submit" className={btnYellow}>
            <Icon name="plus" size={13} />
            Add screenshot
          </button>
        </form>
      }
    >
      <p className="mb-4 text-[13px] text-fg-sub">
        {product.screenshots.length} screenshot{product.screenshots.length !== 1 ? "s" : ""}
      </p>
      {product.screenshots.length === 0 ? (
        <div className="grid place-items-center rounded-btn border border-dashed border-line py-12 text-[13px] text-fg-sub">
          Belum ada screenshot. Tempel URL gambar di atas untuk menambah.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.screenshots.map((s, i) => (
            <div
              key={s.id}
              className="group relative overflow-hidden rounded-btn border border-line bg-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" className="aspect-video w-full object-cover" />
              <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded bg-bg/80 text-[11px] font-semibold text-fg">
                {i + 1}
              </span>
              <span className="absolute bottom-2 left-2 grid h-6 w-6 place-items-center rounded bg-bg/80 text-fg-sub">
                <Icon name="more-horizontal" size={14} />
              </span>
              <form action={deleteScreenshot} className="absolute right-2 top-2">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="productId" value={product.id} />
                <ConfirmSubmit
                  className="grid h-6 w-6 place-items-center rounded bg-danger/80 p-0 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                  title="Hapus screenshot"
                >
                  <Icon name="trash" size={13} />
                </ConfirmSubmit>
              </form>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  /* ───────────── Downloads ───────────── */
  const downloadsTab = (
    <div className="space-y-5">
      <Card title="Add installer" subtitle="Tambah binary per platform. Tempel URL langsung (Cloudflare R2 / direct).">
        <form
          action={addProductInstaller}
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input type="hidden" name="productId" value={product.id} />
          <Select id="inst-platform" name="platform" label="Platform" required>
            <option value="WINDOWS">Windows</option>
            <option value="MAC">macOS</option>
            <option value="LINUX">Linux</option>
          </Select>
          <Input id="inst-version" name="version" label="Version" defaultValue={product.version} required />
          <Input id="inst-url" name="fileUrl" type="url" label="File URL" placeholder="https://…" required />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input id="inst-size" name="fileSize" type="number" label="File size (bytes)" placeholder="47185920" />
            </div>
            <button type="submit" className={btnYellow}>
              <Icon name="plus" size={13} />
              Add
            </button>
          </div>
        </form>
      </Card>

      {product.installers.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-[13px] text-fg-sub">Belum ada installer.</p>
        </Card>
      ) : (
        product.installers.map((inst) => (
          <div
            key={inst.id}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-btn bg-bg text-fg-sub">
                <Icon name="package" size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-fg">
                    {PLATFORM_LABELS[inst.platform] ?? inst.platform}
                  </span>
                  <span className="font-mono text-[11px] text-fg-sub">v{inst.version}</span>
                  <span className="text-[11px] text-fg-sub">· {formatBytes(inst.fileSize)}</span>
                </div>
                <p className="truncate text-[11px] text-fg-muted">{inst.fileUrl}</p>
              </div>
            </div>
            <form action={deleteProductInstaller} className="shrink-0">
              <input type="hidden" name="id" value={inst.id} />
              <input type="hidden" name="productId" value={product.id} />
              <ConfirmSubmit
                confirm="Delete this installer?"
                className="text-[12px] text-danger hover:bg-danger/10"
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        ))
      )}

      <Tip>
        Gunakan URL langsung ke installer atau bucket Cloudflare R2. File size (bytes) membantu pengguna
        sebelum mengunduh.
      </Tip>
    </div>
  );

  /* ───────────── Features ───────────── */
  const featuresTab = (
    <div className="space-y-5">
      <Card title="Add feature" subtitle="Fitur yang ditampilkan di halaman produk.">
        <form action={addFeature} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <div className="min-w-[240px] flex-1">
            <Input id="feature-text" name="text" label="Feature name" placeholder="Feature description" required />
          </div>
          <label className="flex h-9 items-center gap-2 text-[13px] text-fg">
            <input type="checkbox" name="isPro" className="h-4 w-4 accent-[#F4B400]" />
            PRO-only
          </label>
          <button type="submit" className={btnYellow}>
            <Icon name="plus" size={13} />
            Add feature
          </button>
        </form>
      </Card>

      <div className="overflow-hidden rounded-card border border-line bg-card">
        {product.features.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-fg-sub">Belum ada fitur.</p>
        ) : (
          product.features.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="text-fg-muted/50">
                <Icon name="more-horizontal" size={16} />
              </span>
              <span className="flex-1 text-[13px] text-fg">{f.text}</span>
              <span
                className={
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                  (f.isPro ? "bg-accent/15 text-accent" : "bg-success/15 text-success")
                }
              >
                {f.isPro ? "PRO" : "FREE"}
              </span>
              <form action={deleteFeature}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="productId" value={product.id} />
                <ConfirmSubmit
                  className="grid h-7 w-7 place-items-center text-fg-muted hover:bg-danger/10 hover:text-danger"
                  title="Hapus fitur"
                >
                  <Icon name="trash" size={14} />
                </ConfirmSubmit>
              </form>
            </div>
          ))
        )}
      </div>

      <Tip>Tandai fitur sebagai PRO untuk membatasi akses pada tier berbayar.</Tip>
    </div>
  );

  /* ───────────── Requirements ───────────── */
  const reqRow = (label: string, prefix: "minimum" | "recommended", field: string, value: string) => (
    <Input
      id={`${prefix}-${field}`}
      name={`${prefix}_${field}`}
      label={label}
      defaultValue={value}
    />
  );
  const requirementsTab = (
    <form action={upsertRequirements} className="space-y-5">
      <input type="hidden" name="productId" value={product.id} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-fg">System Requirements</h2>
          <p className="text-[12px] text-fg-sub">Spesifikasi minimum & rekomendasi.</p>
        </div>
        <button type="submit" className={btnOutline}>
          <Icon name="check" size={13} />
          Save requirements
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Minimum
          </p>
          <div className="space-y-3">
            {reqRow("OS", "minimum", "os", minReq?.os ?? "")}
            {reqRow("CPU", "minimum", "cpu", minReq?.cpu ?? "")}
            {reqRow("RAM", "minimum", "ram", minReq?.ram ?? "")}
            {reqRow("Disk Space", "minimum", "disk", minReq?.disk ?? "")}
          </div>
        </Card>
        <Card>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Recommended
          </p>
          <div className="space-y-3">
            {reqRow("OS", "recommended", "os", recReq?.os ?? "")}
            {reqRow("CPU", "recommended", "cpu", recReq?.cpu ?? "")}
            {reqRow("RAM", "recommended", "ram", recReq?.ram ?? "")}
            {reqRow("Disk Space", "recommended", "disk", recReq?.disk ?? "")}
          </div>
        </Card>
      </div>
      <Tip>Isi spesifikasi agar pengguna tahu apakah perangkat mereka kompatibel.</Tip>
    </form>
  );

  /* ───────────── Changelog ───────────── */
  const changelogTab = (
    <div className="space-y-5">
      <Card title="Add changelog" subtitle="Versi terbaru muncul paling atas.">
        <form action={addChangelog} className="space-y-3">
          <input type="hidden" name="productId" value={product.id} />
          <Input id="cl-version" name="version" label="Version" placeholder="1.1.0" required />
          <Textarea id="cl-notes" name="notes" label="Release notes (satu poin per baris)" />
          <button type="submit" className={btnYellow}>
            <Icon name="plus" size={13} />
            Add changelog
          </button>
        </form>
      </Card>

      {product.changelogs.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-[13px] text-fg-sub">Belum ada changelog.</p>
        </Card>
      ) : (
        <div className="relative space-y-4 pl-6">
          <span className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
          {product.changelogs.map((c, i) => (
            <div key={c.id} className="relative">
              <span className="absolute -left-[22px] top-2 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-bg" />
              <div className="rounded-card border border-line bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-bg px-2 py-0.5 font-mono text-[12px] font-semibold text-accent">
                      v{c.version}
                    </span>
                    {i === 0 && (
                      <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Latest
                      </span>
                    )}
                    <span className="text-[11px] text-fg-sub">{formatDate(c.releasedAt)}</span>
                  </div>
                  <form action={deleteChangelog}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <ConfirmSubmit
                      className="grid h-7 w-7 place-items-center text-fg-muted hover:bg-danger/10 hover:text-danger"
                      title="Hapus changelog"
                    >
                      <Icon name="trash" size={14} />
                    </ConfirmSubmit>
                  </form>
                </div>
                <ul className="mt-3 space-y-1">
                  {c.notes
                    .split("\n")
                    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
                    .filter(Boolean)
                    .map((line, k) => (
                      <li key={k} className="flex gap-2 text-[13px] text-fg-sub">
                        <span className="text-accent">•</span>
                        {line}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tip>Catat perubahan tiap versi agar pengguna tahu apa yang baru.</Tip>
    </div>
  );

  /* ───────────── Reviews ───────────── */
  const reviewsTab = <RatingsPanel productId={product.id} />;

  const tabs: ProductTab[] = [
    { key: "general", label: "General", icon: "file-text", content: generalTab },
    { key: "media", label: "Media", icon: "grid", content: mediaTab },
    { key: "downloads", label: "Downloads", icon: "download", content: downloadsTab },
    { key: "features", label: "Features", icon: "check", content: featuresTab },
    { key: "requirements", label: "Requirements", icon: "monitor", content: requirementsTab },
    { key: "changelog", label: "Changelog", icon: "clock", content: changelogTab },
    { key: "reviews", label: "Reviews", icon: "star", content: reviewsTab },
  ];

  return (
    <AdminShell>
      {/* Header */}
      <div className="border-b border-line bg-bg/60 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
          Workspace <span className="text-fg-muted/50">›</span> Products{" "}
          <span className="text-fg-muted/50">›</span> Edit product
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <LogoUploader
              productId={product.id}
              initialLogoUrl={product.logoUrl}
              initial={product.name[0]?.toUpperCase() ?? "P"}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-fg">{product.name}</h1>
                <span className="rounded bg-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg-sub">
                  {product.category}
                </span>
                <span className="text-[13px] text-fg-sub">v{product.version}</span>
              </div>
              {product.tagline && (
                <p className="mt-1 max-w-xl text-[13px] text-fg-sub">{product.tagline}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/products/${product.slug}`} target="_blank" className={btnOutline}>
              <Icon name="external-link" size={13} />
              View on Store
            </Link>
            <Link href="/admin/products" className={btnOutline}>
              Cancel
            </Link>
            <button type="submit" form="general-form" className={btnYellow}>
              Save changes
            </button>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmSubmit
                confirm={`Delete "${product.name}" and all its data?`}
                className="grid h-9 w-9 place-items-center rounded-btn border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15"
                title="Delete product"
              >
                <Icon name="trash" size={14} />
              </ConfirmSubmit>
            </form>
          </div>
        </div>
      </div>

      <ProductTabs tabs={tabs} />
    </AdminShell>
  );
}
