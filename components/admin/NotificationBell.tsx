"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  topic: { id: string; title: string };
};

function relativeTime(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeIcon(type: string): string {
  if (type === "new_comment") return "💬";
  if (type === "product_mention") return "🏷";
  return "📝";
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnread(data.filter((n: Notification) => !n.isRead).length);
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch on open
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Poll every 30 seconds for unread count
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.filter((n: Notification) => !n.isRead).length);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    await fetch("/api/admin/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      await fetch(`/api/admin/notifications/${n.id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
      setUnread((v) => Math.max(0, v - 1));
    }
    setOpen(false);
    router.push(`/community/${n.topic.id}`);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-8 w-8 place-items-center rounded-btn text-fg-sub hover:bg-card hover:text-fg"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Icon name="bell" size={16} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 animate-pulse place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-card border border-line bg-card shadow-card-lg">
          <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <span className="text-[13px] font-semibold text-fg">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11px] font-medium text-accent hover:underline">
                Mark all read
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 text-center text-[12px] text-fg-sub">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-fg-sub">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {notifications.slice(0, 20).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "relative flex w-full gap-3 px-3 py-3 text-left hover:bg-card-hover",
                        !n.isRead && "border-l-2 border-accent bg-card-hover"
                      )}
                    >
                      <span className="mt-0.5 text-[16px]">{typeIcon(n.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-fg">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-fg-sub">{relativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="border-t border-line px-3 py-2.5">
            <Link href="/admin/notifications" onClick={() => setOpen(false)} className="text-[12px] font-medium text-accent hover:underline">
              View all notifications →
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}
