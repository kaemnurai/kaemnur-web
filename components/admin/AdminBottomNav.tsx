"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  href: string;
  active: boolean;
  badge?: number;
};

// Mobile-only bottom navigation for the admin panel (md:hidden). "More" opens a
// slide-up drawer with the remaining destinations.
export function AdminBottomNav({ pendingOrders = 0 }: { pendingOrders?: number }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items: NavItem[] = [
    { key: "overview", label: "Overview", icon: "layout-dashboard", href: "/admin", active: pathname === "/admin" },
    {
      key: "orders",
      label: "Transaksi",
      icon: "tag",
      href: "/admin/orders",
      active: pathname.startsWith("/admin/orders"),
      badge: pendingOrders,
    },
    { key: "products", label: "Products", icon: "package", href: "/admin/products", active: pathname.startsWith("/admin/products") },
    { key: "licenses", label: "Licenses", icon: "key", href: "/admin/licenses", active: pathname.startsWith("/admin/licenses") },
  ];

  const drawerLinks: { label: string; icon: NavItem["icon"]; href: string }[] = [
    { label: "Community", icon: "message-square", href: "/community" },
    { label: "Notifications", icon: "bell", href: "/admin/notifications" },
    { label: "Settings", icon: "tool", href: "/admin/settings" },
    { label: "Back to Site", icon: "arrow-left", href: "/" },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-line bg-sidebar md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className={cn(
              "relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors active:opacity-70",
              it.active ? "text-accent" : "text-fg-sub"
            )}
          >
            <span className="relative">
              <Icon name={it.icon} size={20} />
              {it.badge ? (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg ring-2 ring-sidebar">
                  {it.badge > 9 ? "9+" : it.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-medium">{it.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors active:opacity-70",
            drawerOpen ? "text-accent" : "text-fg-sub"
          )}
        >
          <Icon name="menu" size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-sidebar p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <ul className="space-y-1">
              {drawerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-btn px-3 text-[14px] text-fg-sub transition-colors hover:bg-card hover:text-fg active:opacity-70"
                  >
                    <Icon name={l.icon} size={18} />
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-line pt-1">
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-btn px-3 text-left text-[14px] text-danger transition-colors hover:bg-danger/10 active:opacity-70"
                  >
                    <Icon name="log-out" size={18} />
                    Log out
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
