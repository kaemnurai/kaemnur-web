import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Notifications" };

function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeIcon(type: string): string {
  if (type === "new_comment") return "💬";
  if (type === "product_mention") return "🏷";
  return "📝";
}

function typeLabel(type: string): string {
  if (type === "new_comment") return "Comment";
  if (type === "product_mention") return "Mention";
  return "New Topic";
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams.filter || "all";

  type NotifWhere = { isRead?: boolean; type?: string };
  const where: NotifWhere = {};
  if (filter === "unread") where.isRead = false;
  else if (filter === "topics") where.type = "new_topic";
  else if (filter === "comments") where.type = "new_comment";
  else if (filter === "mentions") where.type = "product_mention";

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { topic: { select: { id: true, title: true, category: true } } },
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "topics", label: "Topics" },
    { key: "comments", label: "Comments" },
    { key: "mentions", label: "Mentions" },
  ];

  return (
    <AdminShell>
      <AdminTopBar
        eyebrow="Community"
        title="Notifications"
        subtitle={`${notifications.length} notifications${filter !== "all" ? ` · filtered by ${filter}` : ""}`}
        actions={
          unreadCount > 0 ? (
            <form action="/api/admin/notifications/read-all" method="PATCH">
              <button
                type="submit"
                formMethod="dialog" // trick: we'll handle via link since it's PATCH
                className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
                onClick={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/notifications/read-all", { method: "PATCH" });
                  window.location.reload();
                }}
              >
                <Icon name="check" size={13} />
                Mark all as read
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-line pb-px">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/notifications?filter=${f.key}`}
              className={cn(
                "border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                filter === f.key ? "border-accent text-fg" : "border-transparent text-fg-sub hover:text-fg"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-card p-12 text-center">
            <p className="text-[13px] text-fg-sub">No notifications yet.</p>
          </div>
        ) : (
          <div className="rounded-card border border-line bg-card overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  <th className="px-4 py-3 font-medium w-8" />
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Topic</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {notifications.map((n) => (
                  <tr key={n.id} className={cn("hover:bg-card-hover", !n.isRead && "border-l-2 border-accent")}>
                    <td className="px-4 py-3 text-[16px]">{typeIcon(n.type)}</td>
                    <td className="px-4 py-3 text-fg max-w-xs truncate">{n.message}</td>
                    <td className="px-4 py-3 text-fg-sub">
                      <span className="rounded bg-line px-2 py-0.5 text-[10px] font-semibold">{typeLabel(n.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/community/${n.topic.id}`} className="truncate text-accent hover:underline max-w-[150px] block">
                        {n.topic.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-fg-sub">{relativeTime(n.createdAt)}</td>
                    <td className="px-4 py-3">
                      {n.isRead ? (
                        <span className="text-[11px] text-fg-muted">Read</span>
                      ) : (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">Unread</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/community/${n.topic.id}`} className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-accent hover:bg-card-hover">
                        Go →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
