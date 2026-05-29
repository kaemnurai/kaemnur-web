import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { productAccent } from "@/lib/utils";

export type RecentUpdate = {
  id: string;
  productName: string;
  productSlug: string;
  version: string;
  notes: string;
  releasedAt: Date | string;
};

function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "yesterday";
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentUpdates({ updates }: { updates: RecentUpdate[] }) {
  if (updates.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-card">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="zap" size={14} className="text-accent" />
          <span className="text-[14px] font-semibold text-fg">Recent updates</span>
          <span className="text-[12px] text-fg-sub">· from Kaemnur</span>
        </div>
        <Link
          href="/faq"
          className="text-[12px] font-medium text-accent hover:underline"
        >
          Manage subscriptions
        </Link>
      </header>
      <ul className="divide-y divide-line">
        {updates.map((u) => {
          const accent = productAccent(u.productSlug);
          return (
            <li key={u.id}>
              <Link
                href={`/products/${u.productSlug}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded text-[13px] font-bold text-bg ${accent.solid}`}
                >
                  {u.productName[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-fg">{u.productName}</p>
                  <p className="truncate text-[12px] text-fg-sub">{u.notes}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-right">
                  <span className="font-mono text-[12px] text-accent">v{u.version}</span>
                  <span className="w-24 text-[12px] text-fg-sub">{relativeTime(u.releasedAt)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
