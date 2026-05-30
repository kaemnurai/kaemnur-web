import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="hidden h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg sm:inline-flex"
        >
          <Icon name="external-link" size={13} />
          View to Store
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
        >
          <Icon name="plus" size={13} />
          Produk Baru
        </Link>
        <NotificationBell initialUnread={unreadCount} />
        <AdminUserMenu name="Admin" />
      </div>
    </header>
  );
}
