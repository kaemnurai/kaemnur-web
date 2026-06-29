"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Badges = { pendingOrders: number; unreadNotifications: number };
type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  href: string;
  active: boolean;
  dot?: boolean;
};

// Mobile-only bottom navigation for the public site. Desktop is unaffected
// (md:hidden). Login state + badges are fetched client-side.
export function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [badges, setBadges] = useState<Badges>({ pendingOrders: 0, unreadNotifications: 0 });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me/badges");
      if (res.ok) {
        const d = await res.json();
        setLoggedIn(true);
        setBadges({
          pendingOrders: d.pendingOrders ?? 0,
          unreadNotifications: d.unreadNotifications ?? 0,
        });
      } else {
        setLoggedIn(false);
        setBadges({ pendingOrders: 0, unreadNotifications: 0 });
      }
    } catch {
      // ignore network hiccups
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  // Refetch on navigation; opening the account page clears the notification dot.
  useEffect(() => {
    if (pathname.startsWith("/account")) {
      fetch("/api/me/notifications/read", { method: "POST" }).finally(refresh);
    } else {
      refresh();
    }
  }, [pathname, refresh]);

  const items: NavItem[] = [
    {
      key: "store",
      label: "Store",
      icon: "grid",
      href: "/",
      active: pathname === "/" || pathname.startsWith("/store") || pathname.startsWith("/products"),
    },
    {
      key: "library",
      label: "Library",
      icon: "book",
      href: "/download",
      active: pathname.startsWith("/download") || pathname.startsWith("/library"),
    },
    {
      key: "community",
      label: "Community",
      icon: "message-square",
      href: "/community",
      active: pathname.startsWith("/community"),
    },
    {
      key: "transaksi",
      label: "Transaksi",
      icon: "tag",
      href: loggedIn ? "/transaksi" : "/login?redirect=/transaksi",
      active: pathname.startsWith("/transaksi") || pathname.startsWith("/transactions"),
      dot: badges.pendingOrders > 0,
    },
    {
      key: "account",
      label: loggedIn ? "Akun" : "Masuk",
      icon: "user",
      href: loggedIn ? "/account" : "/login",
      active:
        pathname.startsWith("/account") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/login"),
      dot: loggedIn && badges.unreadNotifications > 0,
    },
  ];

  return (
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
            {it.dot && (
              <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-sidebar" />
            )}
          </span>
          <span className="text-[10px] font-medium">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
