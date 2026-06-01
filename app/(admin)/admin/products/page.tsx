import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Icon } from "@/components/ui/Icon";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { formatCount, formatDate, productAccent } from "@/lib/utils";
import { deleteProduct } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Admin · Products" };

const PAGE_SIZE = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const category = (searchParams.category ?? "").trim();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const [total, products, categoryRows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { installers: true, licenses: true } } },
    }),
    prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = categoryRows.map((c) => c.category);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    params.set("page", String(p));
    return `/admin/products?${params.toString()}`;
  }

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Products"
        subtitle={`${total} produk dalam katalog`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
          >
            <Icon name="plus" size={13} />
            Produk Baru
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        {/* Search + filter bar */}
        <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex h-9 flex-1 items-center gap-2 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg-sub focus-within:border-accent/60">
            <Icon name="search" size={14} className="shrink-0 text-fg-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari produk berdasarkan nama atau kategori…"
              className="flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted"
            />
          </label>
          <select
            name="category"
            defaultValue={category}
            className="h-9 rounded-btn border border-line bg-bg px-3 text-[12px] text-fg outline-none focus:border-accent/60"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line px-4 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
          >
            <Icon name="filter" size={13} />
            Filter
          </button>
          {(q || category) && (
            <Link href="/admin/products" className="inline-flex h-9 items-center rounded-btn px-3 text-[12px] font-medium text-fg-muted hover:text-fg">
              Reset
            </Link>
          )}
        </form>

        {/* Products table */}
        <section className="overflow-hidden rounded-card border border-line bg-card">
          {products.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              {q || category ? "Tidak ada produk yang cocok dengan filter." : "Belum ada produk — klik “Produk Baru” untuk menambah."}
            </p>
          ) : (
            <>
              {/* Mobile card list */}
              <ul className="divide-y divide-line md:hidden">
                {products.map((p) => {
                  const accent = productAccent(p.slug);
                  const published = p._count.installers > 0;
                  return (
                    <li key={p.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-btn text-[16px] font-bold ${accent.bg} ${accent.fg}`}>
                          {p.name[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/products/${p.id}`} className="block truncate font-medium text-fg">
                            {p.name}
                          </Link>
                          <p className="text-[11px] text-fg-muted">v{p.version} · {p.category}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-fg-sub">
                            <span>{p._count.installers} installer</span>
                            <span>{p._count.licenses} lisensi</span>
                            <span>{formatCount(p.downloadCount)} unduhan</span>
                          </div>
                        </div>
                        {published ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />Published
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />Draft
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-btn border border-line text-[12px] font-medium text-fg-sub active:opacity-70"
                        >
                          <Icon name="edit" size={13} />
                          Edit
                        </Link>
                        <form action={deleteProduct} className="flex-1">
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmit
                            confirm={`Hapus "${p.name}" beserta semua datanya?`}
                            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-btn border border-danger/40 text-[12px] font-medium text-danger active:opacity-70"
                            title="Hapus produk"
                          >
                            <Icon name="trash" size={13} />
                            Hapus
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <table className="hidden w-full text-left text-[13px] md:table">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Installers</th>
                  <th className="px-4 py-3 font-medium">Licenses</th>
                  <th className="px-4 py-3 font-medium">Downloads</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const accent = productAccent(p.slug);
                  const published = p._count.installers > 0;
                  return (
                    <tr key={p.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-btn text-[18px] font-bold ${accent.bg} ${accent.fg}`}>
                            {p.name[0]}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/products/${p.id}`} className="font-medium text-fg hover:underline">
                                {p.name}
                              </Link>
                              {p.isFeatured && (
                                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                                  Featured
                                </span>
                              )}
                            </div>
                            {p.tagline && <p className="truncate text-[11px] text-fg-sub">{p.tagline}</p>}
                            <p className="text-[11px] text-fg-muted">
                              v{p.version} · {formatDate(p.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded bg-line px-2 py-0.5 text-[11px] font-medium text-fg-sub">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg">{p._count.installers}</td>
                      <td className="px-4 py-3 text-fg">{p._count.licenses}</td>
                      <td className="px-4 py-3 text-fg">{formatCount(p.downloadCount)}</td>
                      <td className="px-4 py-3">
                        {published ? (
                          <span className="inline-flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${p.id}`}
                            title="Edit produk"
                            className="inline-grid h-7 w-7 place-items-center rounded text-accent hover:bg-accent/10"
                          >
                            <Icon name="edit" size={13} />
                          </Link>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmit
                              confirm={`Hapus "${p.name}" beserta semua datanya?`}
                              className="h-7 w-7 text-danger hover:bg-danger/10"
                              title="Hapus produk"
                            >
                              <Icon name="trash" size={13} />
                            </ConfirmSubmit>
                          </form>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="inline-grid h-7 w-7 place-items-center rounded text-fg-muted hover:bg-bg hover:text-fg"
                          >
                            <Icon name="more-horizontal" size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </>
          )}
        </section>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[12px] text-fg-sub">
              Menampilkan {from} sampai {to} dari {total} produk
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
