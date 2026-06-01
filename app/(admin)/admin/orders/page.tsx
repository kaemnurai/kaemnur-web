import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { OrdersTable, type AdminOrder } from "@/components/admin/OrdersTable";

export const metadata = { title: "Admin · Transaksi" };

const STATUS_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "BELUM_BAYAR", label: "Belum Bayar" },
  { key: "MENUNGGU_KONFIRMASI", label: "Menunggu Konfirmasi" },
  { key: "SUDAH_DIBAYAR", label: "Sudah Dibayar" },
  { key: "DIBATALKAN", label: "Dibatalkan" },
];

function StatBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Icon>["name"];
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3.5">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-btn", tone)}>
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[18px] font-bold leading-none text-fg">{value}</p>
        <p className="mt-1 truncate text-[11px] text-fg-sub">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusParam = searchParams.status;
  const where: Prisma.OrderWhereInput = {};
  if (
    statusParam === "BELUM_BAYAR" ||
    statusParam === "MENUNGGU_KONFIRMASI" ||
    statusParam === "SUDAH_DIBAYAR" ||
    statusParam === "DIBATALKAN"
  ) {
    where.status = statusParam;
  }
  const activeFilter = where.status ? String(where.status) : "all";

  const [grouped, orders] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { slug: true, logoUrl: true } },
        license: { select: { key: true } },
      },
    }),
  ]);

  const countOf = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  const items: AdminOrder[] = orders.map((o) => ({
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
    paidClickedAt: o.paidClickedAt ? o.paidClickedAt.toISOString() : null,
    approvedBy: o.approvedBy,
    licenseKey: o.license?.key ?? null,
  }));

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Workspace"
        title="Manajemen Transaksi"
        subtitle={`${total} pesanan · ${countOf("MENUNGGU_KONFIRMASI")} menunggu konfirmasi`}
      />

      <div className="space-y-4 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatBox label="Total" value={total} icon="tag" tone="bg-accent/15 text-accent" />
          <StatBox label="Belum Bayar" value={countOf("BELUM_BAYAR")} icon="clock" tone="bg-line text-fg-sub" />
          <StatBox label="Menunggu Konfirmasi" value={countOf("MENUNGGU_KONFIRMASI")} icon="bell" tone="bg-warning/15 text-warning" />
          <StatBox label="Sudah Dibayar" value={countOf("SUDAH_DIBAYAR")} icon="check" tone="bg-success/15 text-success" />
          <StatBox label="Dibatalkan" value={countOf("DIBATALKAN")} icon="x" tone="bg-danger/15 text-danger" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-line">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/orders" : `/admin/orders?status=${f.key}`}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                activeFilter === f.key
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-sub hover:text-fg"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <OrdersTable orders={items} />
      </div>
    </AdminShell>
  );
}
