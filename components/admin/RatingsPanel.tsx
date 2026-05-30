"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Rating = {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  user: { displayName: string | null; email: string | null };
};

function formatDateID(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? "text-accent" : "text-fg-muted/30"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function RatingsPanel({ productId }: { productId: string }) {
  const router = useRouter();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}/ratings`);
    if (res.ok) {
      const d = await res.json();
      setRatings(d.ratings);
      setAverage(d.average);
      setCount(d.count);
      setRatingOverride(d.ratingOverride);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const display = ratingOverride ?? average ?? 0;

  const dist = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        n: ratings.filter((r) => r.rating === star).length,
      })),
    [ratings]
  );

  async function saveOverride(value: number | null) {
    setSaving(true);
    const res = await fetch(`/api/admin/products/${productId}/rating-override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ override: value }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setRatingOverride(d.ratingOverride);
      router.refresh();
    }
  }

  async function deleteRating(id: string) {
    if (!confirm("Hapus ulasan ini?")) return;
    const res = await fetch(`/api/admin/ratings/${id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = ratings.filter((r) => r.id !== id);
      setRatings(remaining);
      setCount(remaining.length);
      setAverage(
        remaining.length ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : null
      );
      router.refresh();
    }
  }

  function exportCsv() {
    const rows = [
      ["User", "Email", "Rating", "Review", "Date"],
      ...ratings.map((r) => [
        r.user.displayName ?? "",
        r.user.email ?? "",
        String(r.rating),
        (r.reviewText ?? "").replace(/"/g, '""'),
        formatDateID(r.createdAt),
      ]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews-${productId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filter === "all" ? ratings : ratings.filter((r) => r.rating === filter);

  if (loading) return <p className="text-[13px] text-fg-sub">Memuat data rating…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-fg">Reviews</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
          >
            <Icon name="filter" size={13} />
            Filter
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line bg-card px-3 text-[12px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg"
          >
            <Icon name="download" size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Rating overview */}
      <div className="grid gap-6 rounded-card border border-line bg-card p-5 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[44px] font-bold leading-none text-fg">{display.toFixed(1)}</span>
          <Stars value={display} className="mt-2 text-[18px]" />
          <span className="mt-1 text-[12px] text-fg-sub">{count} review{count !== 1 ? "s" : ""}</span>
        </div>

        <div className="space-y-2 self-center">
          {dist.map(({ star, n }) => (
            <div key={star} className="flex items-center gap-2 text-[12px] text-fg-sub">
              <span className="w-6 shrink-0">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${count ? (n / count) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right">{n}</span>
            </div>
          ))}
        </div>

        <div className="rounded-btn border border-line bg-bg p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            Rating Override (opsional)
          </p>
          <select
            value={ratingOverride ?? ""}
            disabled={saving}
            onChange={(e) => saveOverride(e.target.value === "" ? null : Number(e.target.value))}
            className="mt-2 w-full rounded-btn border border-line bg-card px-3 py-2 text-[13px] text-fg focus:border-accent focus:outline-none"
          >
            <option value="">Auto ({(average ?? 0).toFixed(1)})</option>
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => (
              <option key={v} value={v}>
                {v.toFixed(1)}
              </option>
            ))}
          </select>
          <p className="mt-3 text-[22px] font-bold text-fg">
            {display.toFixed(1)}
            <span className="text-[13px] font-normal text-fg-sub">/5.0</span>
          </p>
          {ratingOverride !== null && (
            <button
              type="button"
              onClick={() => saveOverride(null)}
              className="mt-1 text-[12px] font-medium text-accent hover:underline"
            >
              Reset to auto
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", 5, 4, 3, 2, 1] as const).map((f) => {
          const n = f === "all" ? count : ratings.filter((r) => r.rating === f).length;
          const on = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-btn px-3 py-1.5 text-[12px] font-medium transition-colors",
                on
                  ? "bg-accent text-bg"
                  : "border border-line text-fg-sub hover:border-fg-muted hover:text-fg"
              )}
            >
              {f === "all" ? "All" : `${f}★`} ({n})
            </button>
          );
        })}
        <span className="ml-auto rounded-btn border border-line px-3 py-1.5 text-[12px] text-fg-sub">
          Newest
        </span>
      </div>

      {/* Review rows */}
      <div className="overflow-hidden rounded-card border border-line bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-fg-sub">Belum ada ulasan.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => {
              const name = r.user.displayName ?? r.user.email?.split("@")[0] ?? "User";
              return (
                <li key={r.id} className="flex items-start gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-line text-[13px] font-semibold text-fg">
                    {name[0]?.toUpperCase() ?? "U"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-fg">{name}</span>
                      {r.user.email && (
                        <span className="text-[11px] text-fg-muted">@{r.user.email.split("@")[0]}</span>
                      )}
                      <Stars value={r.rating} className="text-[12px]" />
                      <span className="ml-auto text-[11px] text-fg-sub">{formatDateID(r.createdAt)}</span>
                    </div>
                    {r.reviewText && <p className="mt-1 text-[13px] text-fg-sub">{r.reviewText}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteRating(r.id)}
                    title="Hapus"
                    className="shrink-0 rounded p-1.5 text-fg-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
