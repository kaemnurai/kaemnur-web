import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { isAdminAuthed, sessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminMarker } from "@/components/admin/AdminMarker";
import { AdminOrderNotifier } from "@/components/admin/AdminOrderNotifier";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { Toaster } from "@/components/ui/Toast";

// Sidebar/top-bar badge counts are global (not per-user) and only feed small
// badges, so they're cached briefly. This stops every admin tab switch from
// firing four COUNT queries — the layout reuses the cached values instead.
const getAdminNavCounts = unstable_cache(
  async () => {
    const [products, licenses, unreadCount, pendingOrders] = await Promise.all([
      prisma.product.count(),
      prisma.license.count(),
      // Admin-facing notifications only (user-targeted ones have userId set).
      prisma.notification.count({ where: { isRead: false, userId: null } }),
      prisma.order.count({ where: { status: "MENUNGGU_KONFIRMASI" } }),
    ]);
    return { products, licenses, unreadCount, pendingOrders };
  },
  ["admin-nav-counts"],
  { revalidate: 20 }
);

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }

  const { products, licenses, unreadCount, pendingOrders } = await getAdminNavCounts();

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* Sets localStorage flags for community admin detection */}
      <AdminMarker token={sessionToken()} />
      <AdminOrderNotifier />
      <AdminTopNav unreadCount={unreadCount} />
      <div className="flex flex-1">
        <Sidebar counts={{ products, licenses, unreadCount, pendingOrders }} />
        <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <AdminBottomNav pendingOrders={pendingOrders} />
      <Toaster />
    </div>
  );
}
