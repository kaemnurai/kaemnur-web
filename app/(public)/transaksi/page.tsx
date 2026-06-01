import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { TransaksiList } from "@/components/transaksi/TransaksiList";
import type { OrderClient } from "@/components/transaksi/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transaksi",
  description: "Riwayat pesanan dan status pembayaran Anda.",
};

export default async function TransaksiPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/transaksi");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { slug: true, logoUrl: true } },
      license: { select: { key: true } },
    },
  });

  const items: OrderClient[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    productName: o.productName,
    productSlug: o.product.slug,
    productLogoUrl: o.product.logoUrl,
    amount: o.amount,
    status: o.status,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    createdAt: o.createdAt.toISOString(),
    licenseKey: o.status === "SUDAH_DIBAYAR" ? o.license?.key ?? null : null,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Akun</p>
        <h1 className="mt-1 text-2xl font-bold text-fg">Transaksi Saya</h1>
        <p className="mt-1.5 text-[13px] text-fg-sub">Riwayat pesanan dan status pembayaran Anda.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card px-4 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-line/50 text-fg-muted">
            <Icon name="tag" size={22} />
          </span>
          <p className="mt-3 text-[13px] font-medium text-fg">Belum ada transaksi</p>
          <Link
            href="/store"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
          >
            Jelajahi produk PRO
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      ) : (
        <TransaksiList orders={items} />
      )}
    </div>
  );
}
