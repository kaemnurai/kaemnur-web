"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Notif = { id: string; message: string; link: string | null; isRead: boolean };

// Top-of-page banner showing the newest unread user notification (e.g. order
// approved / request released). Dismissing marks it read.
export function NotificationBanner() {
  const [notif, setNotif] = useState<Notif | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const list = (d.notifications ?? []) as Notif[];
        setNotif(list.find((n) => !n.isRead) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function dismiss() {
    if (!notif) return;
    const id = notif.id;
    setNotif(null);
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  if (!notif) return null;

  return (
    <div className="flex items-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2.5 lg:px-8">
      <Icon name="bell" size={15} className="shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-[13px] text-fg">
        <span className="line-clamp-1">{notif.message}</span>
      </p>
      {notif.link && (
        <Link
          href={notif.link}
          onClick={dismiss}
          className="shrink-0 text-[13px] font-semibold text-accent hover:underline"
        >
          Lihat →
        </Link>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup"
        className="shrink-0 text-fg-sub transition-colors hover:text-fg active:opacity-70"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
