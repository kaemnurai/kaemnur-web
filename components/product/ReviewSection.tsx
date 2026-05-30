"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ReviewList } from "@/components/product/ReviewList";

type Props = {
  slug: string;
  reviewCount: number;
};

export function ReviewSection({ slug, reviewCount: initialCount }: Props) {
  // Incrementing this key triggers ReviewList to re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  const [count, setCount] = useState(initialCount);

  function handleReviewSubmitted() {
    setRefreshKey((k) => k + 1);
    setCount((c) => c + 1);
  }

  return (
    <div id="reviews" className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-fg">Beri Ulasan</h2>
      </div>
      <ReviewForm slug={slug} onReviewSubmitted={handleReviewSubmitted} />

      <div className="flex items-center gap-2 pt-2">
        <h2 className="text-lg font-bold text-fg">Ulasan Pengguna</h2>
        {count > 0 && (
          <span className="rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
            {count}
          </span>
        )}
      </div>
      <ReviewList slug={slug} refreshKey={refreshKey} />
    </div>
  );
}
