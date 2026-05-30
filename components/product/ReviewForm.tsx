"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

type ExistingReview = {
  rating: number;
  reviewText: string | null;
};

type Props = {
  slug: string;
  onReviewSubmitted?: () => void;
};

export function ReviewForm({ slug, onReviewSubmitted }: Props) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [existing, setExisting] = useState<ExistingReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setDisplayName(
          user.user_metadata?.display_name ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User"
        );
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      }
      setAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch existing review from the reviews list endpoint
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/products/${slug}/reviews?userId=${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.rating) {
          setExisting({ rating: d.rating, reviewText: d.reviewText ?? null });
          setSelected(d.rating);
          setReview(d.reviewText ?? "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (selected === 0) { setError("Pilih bintang terlebih dahulu."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${slug}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selected, reviewText: review || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Gagal mengirim ulasan.");
        return;
      }
      setExisting({ rating: selected, reviewText: review || null });
      setIsEditing(false);
      setToast("Ulasan berhasil dikirim!");
      setTimeout(() => setToast(null), 3000);
      onReviewSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return null;

  if (!userId) {
    return (
      <div className="rounded-card border border-line bg-card p-5 text-center">
        <Icon name="star" size={22} className="mx-auto text-fg-muted" />
        <p className="mt-2 text-[14px] font-semibold text-fg">Masuk untuk memberikan ulasan</p>
        <p className="mt-1 text-[12px] text-fg-sub">Ulasan Anda membantu pengguna lain menentukan pilihan.</p>
        <a
          href={`/login?redirect=/products/${slug}`}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover"
        >
          <Icon name="lock" size={13} />
          Sign in
        </a>
      </div>
    );
  }

  const avatarBg = getAvatarColor(userId);
  const avatarFg = getAvatarTextColor(avatarBg);
  const displayStars = hovered ?? selected;

  // Show existing review (non-editing state)
  if (existing && !isEditing) {
    return (
      <>
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-btn border border-success/30 bg-success/15 px-4 py-2.5 text-[13px] font-medium text-success shadow-card-lg">
            {toast}
          </div>
        )}
        <div className="rounded-card border border-line bg-card p-4">
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
                {displayName ? getInitial(displayName) : "?"}
              </span>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-fg">{displayName}</span>
                  <span className="text-accent">{"★".repeat(existing.rating)}<span className="text-fg-muted/30">{"★".repeat(5 - existing.rating)}</span></span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Edit Ulasan
                </button>
              </div>
              {existing.reviewText && (
                <p className="mt-1.5 text-[13px] italic leading-relaxed text-fg-sub">
                  &ldquo;{existing.reviewText}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-btn border border-success/30 bg-success/15 px-4 py-2.5 text-[13px] font-medium text-success shadow-card-lg">
          {toast}
        </div>
      )}
      <div className="rounded-card border border-line bg-card p-4">
        <div className="mb-3 flex items-center gap-2.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
              {displayName ? getInitial(displayName) : "?"}
            </span>
          )}
          <span className="text-[13px] font-semibold text-fg">{displayName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Star selector */}
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelected(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  disabled={submitting}
                  className="text-[28px] leading-none transition-transform hover:scale-110 disabled:opacity-60"
                  aria-label={`${star} bintang`}
                >
                  <span className={cn("transition-colors", star <= displayStars ? "text-accent" : "text-fg-muted/30")}>★</span>
                </button>
              ))}
              {selected > 0 && (
                <span className="ml-2 text-[12px] font-medium text-fg-sub">
                  {["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"][selected]}
                </span>
              )}
            </div>
          </div>

          {/* Review textarea */}
          <div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, 500))}
              placeholder="Tulis ulasan Anda... (opsional)"
              rows={3}
              disabled={submitting}
              className="w-full resize-none rounded-btn border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            />
            <div className="mt-0.5 flex justify-end">
              <span className={cn("text-[11px]", review.length >= 480 ? "text-warning" : "text-fg-muted")}>
                {review.length}/500
              </span>
            </div>
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || selected === 0}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting ? (
                <><Icon name="send" size={13} className="animate-pulse" /> Mengirim…</>
              ) : (
                <><Icon name="send" size={13} /> Kirim Ulasan</>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-9 rounded-btn border border-line px-3 text-[12px] text-fg-sub hover:bg-card-hover"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
