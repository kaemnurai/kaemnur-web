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

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  const where: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { installers: true, licenses: true } } },
  });

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Products"
        subtitle={`${products.length} ${products.length === 1 ? "product" : "products"} in the catalog`}
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
        {/* Search */}
        <form method="GET" className="flex gap-2">
          <label className="flex h-9 flex-1 items-center gap-2 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg-sub focus-within:border-accent/60">
            <Icon name="search" size={14} className="shrink-0 text-fg-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari produk berdasarkan nama atau kategori…"
              className="flex-1 bg-transparent outline-none placeholder:text-fg-muted"
            />
          </label>
          <button type="submit" className="h-9 rounded-btn border border-line px-4 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg">
            Cari
          </button>
          {q && (
            <Link href="/admin/products" className="inline-flex h-9 items-center rounded-btn px-3 text-[12px] font-medium text-fg-muted hover:text-fg">
              Reset
            </Link>
          )}
        </form>

        {/* Products table */}
        <section className="rounded-card border border-line bg-card">
          {products.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              {q ? `Tidak ada produk yang cocok dengan “${q}”.` : "Belum ada produk — klik “Produk Baru” untuk menambah."}
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Installers</th>
                  <th className="px-4 py-3 font-medium">Licenses</th>
                  <th className="px-4 py-3 font-medium">Downloads</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const accent = productAccent(p.slug);
                  return (
                    <tr key={p.id} className="hover:bg-card-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded text-[12px] font-bold text-bg ${accent.solid}`}
                          >
                            {p.name[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-fg">{p.name}</p>
                            <p className="text-[11px] text-fg-sub">
                              v{p.version} · {formatDate(p.createdAt)}
                            </p>
                          </div>
                          {p.isFeatured && (
                            <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-sub">{p.category}</td>
                      <td className="px-4 py-3 text-fg">{p._count.installers}</td>
                      <td className="px-4 py-3 text-fg">{p._count.licenses}</td>
                      <td className="px-4 py-3 text-fg">{formatCount(p.downloadCount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-accent hover:bg-accent/10"
                          >
                            <Icon name="edit" size={11} />
                            Edit
                          </Link>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmit
                              confirm={`Hapus "${p.name}" beserta semua datanya?`}
                              className="text-danger hover:bg-danger/10"
                            >
                              <Icon name="trash" size={11} />
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        </div>
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
