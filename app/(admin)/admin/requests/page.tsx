import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { RequestsManager } from "@/components/admin/RequestsManager";

export const metadata = { title: "Admin · Requests" };

export default async function AdminRequestsPage() {
  const [requests, products] = await Promise.all([
    prisma.appRequest.findMany({
      orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { displayName: true } } },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const items = requests.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    voteCount: r.voteCount,
    authorName: r.user.displayName ?? "User",
    createdAt: r.createdAt.toISOString(),
    releasedProductId: r.releasedProductId,
  }));

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Community"
        title="Request Aplikasi"
        subtitle={`${requests.length} request dari pengguna`}
      />
      <div className="p-6">
        <RequestsManager requests={items} products={products} />
      </div>
    </AdminShell>
  );
}
