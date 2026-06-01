import { redirect } from "next/navigation";
import { isAdminAuthed, sessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminMarker } from "@/components/admin/AdminMarker";
import { AdminOrderNotifier } from "@/components/admin/AdminOrderNotifier";
import { Toaster } from "@/components/ui/Toast";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }

  const [products, licenses, unreadCount, pendingOrders] = await Promise.all([
    prisma.product.count(),
    prisma.license.count(),
    // Admin-facing notifications only (user-targeted ones have userId set).
    prisma.notification.count({ where: { isRead: false, userId: null } }),
    prisma.order.count({ where: { status: "MENUNGGU_KONFIRMASI" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* Sets localStorage flags for community admin detection */}
      <AdminMarker token={sessionToken()} />
      <AdminOrderNotifier />
      <AdminTopNav unreadCount={unreadCount} />
      <div className="flex flex-1">
        <Sidebar counts={{ products, licenses, unreadCount, pendingOrders }} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
