"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ReviewCarousel } from "@/components/product/ReviewCarousel";

type Props = {
  slug: string;
  reviewCount: number;
};

export function ReviewSection({ slug, reviewCount: initialCount }: Props) {
  // Incrementing this key triggers ReviewCarousel to re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  function handleReviewSubmitted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div id="reviews" className="space-y-5">
      <ReviewCarousel
        slug={slug}
        refreshKey={refreshKey}
        initialCount={initialCount}
      />

      <div className="border-t border-line pt-4">
        <h2 className="mb-3 text-lg font-bold text-fg">Beri Ulasan</h2>
        <ReviewForm slug={slug} onReviewSubmitted={handleReviewSubmitted} />
      </div>
    </div>
  );
}
