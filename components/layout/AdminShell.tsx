import { redirect } from "next/navigation";
import { isAdminAuthed, sessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
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
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Sets localStorage flags for community admin detection */}
      <AdminMarker token={sessionToken()} />
      <Sidebar counts={{ products, releases, licenses, unreadCount }} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
