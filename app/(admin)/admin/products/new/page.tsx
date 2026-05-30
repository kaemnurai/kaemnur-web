import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Input, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { createProduct } from "@/app/(admin)/admin/actions";

export const metadata = { title: "Admin · New Product" };

function Section({ title, subtitle, children }: {
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

export default function NewProductPage() {
  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace · Products"
        title="Produk Baru"
        subtitle="Isi info dasar dulu — media, installer, fitur, dan changelog ditambahkan setelah produk dibuat."
        actions={
          <Link
            href="/admin/products"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
          >
            <Icon name="arrow-left" size={13} />
            Kembali ke daftar
          </Link>
        }
      />

      <form action={createProduct} className="mx-auto max-w-2xl space-y-5 p-6">
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="space-y-3">
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
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <label className="flex items-center gap-2 text-[13px] text-fg">
            <input type="checkbox" name="priceFree" defaultChecked className="h-4 w-4 accent-[#F4B400]" />
            Free tier available
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Input id="c-priceAmount" name="priceAmount" type="number" label="PRO price (Rp)" placeholder="99000" />
            <Input id="c-priceLabel" name="priceLabel" label="Display label" placeholder="Rp 99.000" />
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-1.5 rounded-btn bg-accent px-5 text-[13px] font-semibold text-bg hover:bg-accent-hover"
          >
            <Icon name="plus" size={13} />
            Buat produk & lanjut edit
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
