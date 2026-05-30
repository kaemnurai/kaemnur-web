"use client";

import { useCallback, useEffect, useState } from "react";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

type Review = {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  user: { displayName: string | null; avatarUrl: string | null };
};

const PREVIEW_COUNT = 10;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[15px]">
      {"★".repeat(value)}<span className="text-fg-muted/30">{"★".repeat(5 - value)}</span>
    </span>
  );
}

type Props = {
  slug: string;
  refreshKey?: number;
};

export function ReviewList({ slug, refreshKey = 0 }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`);
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshKey]);

  const displayed = showAll ? reviews : reviews.slice(0, PREVIEW_COUNT);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card border border-line bg-card" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line bg-card px-5 py-8 text-center text-[13px] text-fg-sub">
        Belum ada ulasan. Jadilah yang pertama!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {displayed.map((r) => {
        const seed = r.user.displayName ?? r.id;
        const bg = getAvatarColor(seed);
        const fg = getAvatarTextColor(bg);
        const name = r.user.displayName ?? "Pengguna";
        return (
          <div key={r.id} className="rounded-card border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              {r.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.user.avatarUrl}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold"
                  style={{ backgroundColor: bg, color: fg }}
                >
                  {getInitial(name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-semibold text-fg">{name}</span>
                  <Stars value={r.rating} />
                  <span className="text-[11px] text-fg-muted">{formatDate(r.createdAt)}</span>
                </div>
                {r.reviewText && (
                  <p className="mt-1.5 text-[13px] italic leading-relaxed text-fg-sub">
                    &ldquo;{r.reviewText}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {reviews.length > PREVIEW_COUNT && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-card border border-line bg-card py-2.5 text-center text-[13px] font-medium text-accent hover:bg-card-hover"
        >
          Lihat semua {reviews.length} ulasan
        </button>
      )}
    </div>
  );
}
