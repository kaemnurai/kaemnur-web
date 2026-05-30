"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialAverage: number | null;
  initialCount: number;
  initialRatingOverride: number | null;
};

export function RatingWidget({
  slug,
  initialAverage,
  initialCount,
  initialRatingOverride,
}: Props) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(
    initialRatingOverride ?? initialAverage
  );
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayRating = average;
  const displayStars = hovered ?? userRating ?? 0;

  async function submitRating(rating: number) {
    if (submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/products/${slug}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    if (res.ok) {
      const d = await res.json();
      setUserRating(rating);
      // If override is set server side, trust our local initialRatingOverride
      setAverage(initialRatingOverride ?? d.average);
      setCount(d.count);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-1">
      {/* Display line */}
      <div className="flex items-center gap-1.5 text-[12px]">
        <StarRow value={displayRating ?? 0} size={14} />
        {displayRating !== null ? (
          <span className="font-semibold text-fg">{displayRating.toFixed(1)}</span>
        ) : null}
        <span className="text-fg-muted">
          {count > 0 ? `${count} rating${count !== 1 ? "s" : ""}` : "No ratings yet"}
        </span>
        {initialRatingOverride !== null && (
          <span className="text-[10px] text-fg-muted">(admin)</span>
        )}
      </div>

      {/* Interactive stars for logged-in users */}
      {userId && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => submitRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              disabled={submitting}
              className="text-[20px] leading-none disabled:opacity-60"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <span className={cn(
                "transition-colors",
                star <= displayStars ? "text-accent" : "text-fg-muted/30"
              )}>
                ★
              </span>
            </button>
          ))}
          {userRating && (
            <span className="ml-1 text-[11px] text-fg-sub">Your rating: {userRating}/5</span>
          )}
        </div>
      )}
    </div>
  );
}

// Pure display row of stars
export function StarRow({ value, size = 12 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const frac = value - full;
  return (
    <span className="flex items-center" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full ? 1 : i === full + 1 && frac >= 0.5 ? 0.5 : 0;
        return (
          <span key={i} className={cn("leading-none", filled > 0 ? "text-accent" : "text-fg-muted/30")}>
            {filled === 0.5 ? "½" : "★"}
          </span>
        );
      })}
    </span>
  );
}
