// Domain pricing for the /custom estimator. Sourced from Rumahweb
// (https://order.rumahweb.com/) since that's where Kaemnur buys domains.
// Not scraped live — update this list by hand when Rumahweb's pricing changes.

export interface DomainPrice {
  ext: string;
  firstYear: number;
  renewal?: number;
  promo?: boolean;
}

export const DOMAIN_PRICES: DomainPrice[] = [
  { ext: ".net", firstYear: 80_000, renewal: 223_000, promo: true },
  { ext: ".id", firstYear: 219_000 },
  { ext: ".com", firstYear: 201_000 },
  { ext: ".xyz", firstYear: 32_000, renewal: 268_000, promo: true },
  { ext: ".sbs", firstYear: 34_000, renewal: 257_000, promo: true },
  { ext: ".org", firstYear: 170_000, renewal: 234_000, promo: true },
  { ext: ".online", firstYear: 32_000, renewal: 658_000, promo: true },
  { ext: ".site", firstYear: 32_000, renewal: 658_000, promo: true },
  { ext: ".my.id", firstYear: 9_900, renewal: 25_000, promo: true },
  { ext: ".cloud", firstYear: 31_000, renewal: 461_000, promo: true },
  { ext: ".info", firstYear: 71_000, renewal: 403_000, promo: true },
  { ext: ".click", firstYear: 34_000, renewal: 212_000, promo: true },
  { ext: ".asia", firstYear: 39_500, renewal: 268_000, promo: true },
  { ext: ".art", firstYear: 92_000, renewal: 450_000, promo: true },
  { ext: ".blog", firstYear: 70_000, renewal: 535_000, promo: true },
];
