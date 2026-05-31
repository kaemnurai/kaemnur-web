import Image from "next/image";
import Link from "next/link";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";

// Global admin top navbar: brand on the left, primary actions + notifications
// + user menu on the right. Spans the full width above the sidebar.
export function AdminTopNav({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-sidebar px-4">
      {/* Brand */}
      <Link href="/admin" className="flex items-center gap-2">
        <Image src="/logo-dark.png" alt="" width={26} height={26} className="h-6 w-6 object-contain" />
        <span className="text-[15px] font-bold tracking-tight text-fg">Kaemnur</span>
        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
          Admin
        </span>
      </Link>

      {/* Actions — notifications + user menu only */}
      <div className="flex items-center gap-2">
        <NotificationBell initialUnread={unreadCount} />
        <AdminUserMenu name="Admin" />
      </div>
    </header>
  );
}
