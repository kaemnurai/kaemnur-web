export type RatingDisplay = {
  value: number | null;
  count: number;
  isOverride: boolean;
};

/**
 * Derives the display rating for a product.
 * – If ratingOverride is set by admin, use it (and mark isOverride=true).
 * – Otherwise compute the average from ratings[].
 * – If no ratings exist at all, return null so the UI hides stars entirely.
 */
export function getDisplayRating(product: {
  ratingOverride: number | null | undefined;
  ratings: { rating: number }[];
}): RatingDisplay {
  if (product.ratingOverride != null) {
    return {
      value: product.ratingOverride,
      count: product.ratings.length,
      isOverride: true,
    };
  }

  if (product.ratings.length === 0) {
    return { value: null, count: 0, isOverride: false };
  }

  const avg =
    product.ratings.reduce((sum, r) => sum + r.rating, 0) /
    product.ratings.length;

  return { value: avg, count: product.ratings.length, isOverride: false };
}
