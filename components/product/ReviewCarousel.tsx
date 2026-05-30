"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

type Review = {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  user: { displayName: string | null; avatarUrl: string | null };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[14px] text-accent">
      {"★".repeat(value)}
      <span className="text-fg-muted/30">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function ReviewCard({ r, className }: { r: Review; className?: string }) {
  const name = r.user.displayName ?? "Pengguna";
  const bg = getAvatarColor(r.user.displayName ?? r.id);
  const fg = getAvatarTextColor(bg);
  return (
    <article
      className={cn(
        "flex flex-col rounded-card border border-line bg-card p-4",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {r.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.user.avatarUrl}
            alt=""
            loading="lazy"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold"
            style={{ backgroundColor: bg, color: fg }}
          >
            {getInitial(name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-fg">{name}</p>
          <p className="text-[11px] text-fg-muted">{formatDate(r.createdAt)}</p>
        </div>
      </div>
      <div className="mt-2.5">
        <Stars value={r.rating} />
      </div>
      {r.reviewText && (
        <p className="mt-2 text-[13px] italic leading-relaxed text-fg-sub">
          &ldquo;{r.reviewText}&rdquo;
        </p>
      )}
    </article>
  );
}

type Props = {
  slug: string;
  refreshKey?: number;
  initialCount?: number;
};

export function ReviewCarousel({ slug, refreshKey = 0, initialCount = 0 }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

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

  function scrollByDir(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const count = reviews.length || initialCount;

  return (
    <section>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-fg">Ulasan Pengguna</h2>
          {count > 0 && (
            <span className="rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!viewAll && reviews.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollByDir(-1)}
                aria-label="Sebelumnya"
                className="grid h-7 w-7 place-items-center rounded-btn border border-line text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
              >
                <Icon name="arrow-left" size={14} />
              </button>
              <button
                type="button"
                onClick={() => scrollByDir(1)}
                aria-label="Berikutnya"
                className="grid h-7 w-7 place-items-center rounded-btn border border-line text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
              >
                <Icon name="arrow-right" size={14} />
              </button>
            </>
          )}
          {reviews.length > 0 && (
            <button
              type="button"
              onClick={() => setViewAll((v) => !v)}
              className="text-[12px] font-medium text-accent hover:underline"
            >
              {viewAll ? "Tampilkan ringkas" : "Lihat semua"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 w-[300px] shrink-0 animate-pulse rounded-card border border-line bg-card"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-card px-5 py-8 text-center text-[13px] text-fg-sub">
          Belum ada ulasan. Jadilah yang pertama!
        </p>
      ) : viewAll ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        >
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              r={r}
              className="w-[300px] shrink-0 snap-start"
            />
          ))}
        </div>
      )}
    </section>
  );
}
