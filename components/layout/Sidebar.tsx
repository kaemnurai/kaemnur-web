"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  badge?: string;
};

export type AdminNavCounts = {
  products?: number;
  releases?: number;
  licenses?: number;
  unreadCount?: number;
};

export function Sidebar({ counts }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();

  const workspaceItems: AdminNavItem[] = [
    { href: "/admin", label: "Overview", icon: "layout-dashboard" },
    {
      href: "/admin/products",
      label: "Products",
      icon: "package",
      badge: counts?.products ? String(counts.products) : undefined,
    },
    {
      href: "/admin/installers",
      label: "Releases",
      icon: "download",
      badge: counts?.releases ? String(counts.releases) : undefined,
    },
    {
      href: "/admin/licenses",
      label: "Licenses",
      icon: "key",
      badge: counts?.licenses ? String(counts.licenses) : undefined,
    },
  ];

  const communityItems: AdminNavItem[] = [
    { href: "/community", label: "Community", icon: "message-square" },
    {
      href: "/admin/notifications",
      label: "Notifications",
      icon: "bell",
      badge: counts?.unreadCount ? String(counts.unreadCount) : undefined,
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-[200px] shrink-0 flex-col border-r border-line bg-sidebar lg:flex">
      {/* Top: logo + ADMIN label + notification bell */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Image src="/logo-dark.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        <span className="text-[13px] font-bold tracking-tight text-fg">Kaemnur</span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Admin</span>
        <NotificationBell initialUnread={counts?.unreadCount ?? 0} />
      </div>

      {/* User card */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-3">
        <span className="grid h-8 w-8 place-items-center rounded bg-accent text-[13px] font-bold text-bg">K</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-fg">Kaemnur</p>
          <p className="truncate text-[11px] text-fg-sub">Admin</p>
        </div>
        <Icon name="chevron-down" size={14} className="text-fg-muted" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <NavSection label="Workspace" items={workspaceItems} isActive={isActive} />
        <NavSection label="Community" items={communityItems} isActive={isActive} />
      </nav>

      {/* Bottom links */}
      <div className="border-t border-line px-3 py-3 text-[13px]">
        <Link href="/" className="flex items-center gap-2 rounded-btn px-3 py-1.5 text-fg-sub hover:bg-card hover:text-fg">
          <Icon name="arrow-left" size={14} />
          Back to site
        </Link>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="flex w-full items-center gap-2 rounded-btn px-3 py-1.5 text-left text-fg-sub hover:bg-card hover:text-fg">
            <Icon name="log-out" size={14} />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: AdminNavItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("relative flex items-center gap-2.5 rounded-btn px-3 py-1.5 text-[13px] transition-colors", active ? "bg-card text-fg" : "text-fg-sub hover:bg-card/60 hover:text-fg")}
              >
                {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-accent" />}
                <Icon name={item.icon} size={14} className={active ? "text-fg" : "text-fg-sub"} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{item.badge}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
