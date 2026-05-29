import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Input, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { formatCount, formatDate, productAccent } from "@/lib/utils";
import { createProduct } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { installers: true, licenses: true } } },
  });

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Products"
        subtitle={`${products.length} ${products.length === 1 ? "product" : "products"} in the catalog`}
      />

      <div className="grid gap-5 p-6 lg:grid-cols-[320px_1fr]">
        {/* Create form */}
        <div className="rounded-card border border-line bg-card p-5">
          <h2 className="mb-1 text-[14px] font-semibold text-fg">New product</h2>
          <p className="mb-4 text-[12px] text-fg-sub">
            You can edit screenshots, features and changelogs after creating.
          </p>
          <form action={createProduct} className="space-y-3">
            <Input id="name" name="name" label="Name" required />
            <Input id="slug" name="slug" label="Slug (optional)" placeholder="auto from name" />
            <Input id="category" name="category" label="Category" defaultValue="Productivity" />
            <Input id="version" name="version" label="Version" defaultValue="1.0.0" />
            <Input id="tagline" name="tagline" label="Tagline" />
            <Textarea id="description" name="description" label="Description" required />
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input type="checkbox" name="isFeatured" className="h-4 w-4 accent-[#F4B400]" />
              Featured on landing page
            </label>
            {/* Pricing */}
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Pricing</p>
              <label className="flex items-center gap-2 text-[13px] text-fg">
                <input type="checkbox" name="priceFree" defaultChecked className="h-4 w-4 accent-[#F4B400]" />
                Free tier available
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input id="c-priceAmount" name="priceAmount" type="number" label="PRO price (Rp)" placeholder="99000" />
                <Input id="c-priceLabel" name="priceLabel" label="Display label" placeholder="Rp 99.000" />
              </div>
            </div>
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
            >
              <Icon name="plus" size={13} />
              Create product
            </button>
          </form>
        </div>

        {/* Products table */}
        <section className="rounded-card border border-line bg-card">
          {products.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-fg-sub">
              No products yet — use the form to add your first one.
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
                  <th className="px-4 py-3" />
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
                      <td className="px-4 py-3 text-fg">
                        {formatCount(p.downloadCount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-accent hover:underline"
                        >
                          Edit
                          <Icon name="arrow-right" size={11} />
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
