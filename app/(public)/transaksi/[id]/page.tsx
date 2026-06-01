import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAppSettings, adminWhatsappOrFallback } from "@/lib/settings";
import { TransaksiDetail } from "@/components/transaksi/TransaksiDetail";
import type { OrderClient } from "@/components/transaksi/shared";

export const dynamic = "force-dynamic";

export default async function TransaksiDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/transaksi/${params.id}`);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { slug: true, logoUrl: true } },
      license: { select: { key: true } },
    },
  });
  if (!order || order.userId !== user.id) notFound();

  const settings = await getAppSettings();

  const orderClient: OrderClient = {
    id: order.id,
    orderNumber: order.orderNumber,
    productName: order.productName,
    productSlug: order.product.slug,
    productLogoUrl: order.product.logoUrl,
    amount: order.amount,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt.toISOString(),
    licenseKey: order.status === "SUDAH_DIBAYAR" ? order.license?.key ?? null : null,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:py-8">
      <TransaksiDetail
        order={orderClient}
        qrisImageUrl={settings.qrisImageUrl}
        adminWhatsapp={adminWhatsappOrFallback(settings.adminWhatsapp)}
      />
    </div>
  );
}
