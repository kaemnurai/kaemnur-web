import { redirect } from "next/navigation";
import { isAdminAuthed, sessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminMarker } from "@/components/admin/AdminMarker";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }

  const [products, releases, licenses, unreadCount] = await Promise.all([
    prisma.product.count(),
    prisma.installer.count(),
    prisma.license.count(),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* Sets localStorage flags for community admin detection */}
      <AdminMarker token={sessionToken()} />
      <AdminTopNav unreadCount={unreadCount} />
      <div className="flex flex-1">
        <Sidebar counts={{ products, releases, licenses, unreadCount }} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
