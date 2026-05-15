export type PriceConfidence = "HIGH" | "MEDIUM" | "LOW";

export type TrustChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

export type TrustAssessment = {
  qualityScore: number;
  priceConfidence: PriceConfidence;
  checklist: TrustChecklistItem[];
  completedItems: number;
  totalItems: number;
};

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

export function assessVenueTrust(input: {
  imagesCount?: number;
  hasCoverImage?: boolean;
  hasDescription?: boolean;
  hasCity?: boolean;
  hasArea?: boolean;
  hasCoordinates?: boolean;
  hasCapacityRange?: boolean;
  hasExactPrice?: boolean;
  hasEstimatedRange?: boolean;
  hasPrimePricing?: boolean;
  hasEventPricingCount?: number;
  hasContactDetails?: boolean;
  reviewCount?: number;
  bookingCount?: number;
  viewCount?: number;
  updatedAt?: string | Date | null;
  isVerified?: boolean;
}): TrustAssessment {
  const eventPricingCount = input.hasEventPricingCount ?? 0;

  const checklist: TrustChecklistItem[] = [
    { key: "cover", label: "Cover image", done: Boolean(input.hasCoverImage) },
    { key: "photos", label: "At least 3 photos", done: (input.imagesCount ?? 0) >= 3 },
    { key: "description", label: "Detailed description", done: Boolean(input.hasDescription) },
    { key: "city", label: "City set", done: Boolean(input.hasCity) },
    { key: "area", label: "Area set", done: Boolean(input.hasArea) },
    { key: "coordinates", label: "Map coordinates", done: Boolean(input.hasCoordinates) },
    { key: "capacity", label: "Capacity range", done: Boolean(input.hasCapacityRange) },
    { key: "pricing", label: "Core pricing", done: Boolean(input.hasExactPrice || input.hasEstimatedRange) },
    { key: "event-pricing", label: "Event-wise pricing", done: eventPricingCount > 0 },
    { key: "contact", label: "Contact details", done: Boolean(input.hasContactDetails) },
  ];

  const completedItems = checklist.filter((item) => item.done).length;
  const totalItems = checklist.length;

  let score = Math.round((completedItems / totalItems) * 70);

  // Pricing granularity boosts
  if (input.hasExactPrice) score += 8;
  else if (input.hasEstimatedRange) score += 5;
  if (input.hasPrimePricing) score += 4;
  score += Math.min(8, eventPricingCount * 2);

  // Market activity / freshness boosts
  const reviewCount = input.reviewCount ?? 0;
  const bookingCount = input.bookingCount ?? 0;
  const viewCount = input.viewCount ?? 0;
  if (reviewCount > 0) score += 3;
  if (bookingCount > 0) score += 3;
  if (viewCount >= 100) score += 2;

  const updatedDays = getUpdatedDays(input.updatedAt);
  if (updatedDays !== null && updatedDays <= 30) score += 4;

  // Verification signal
  if (input.isVerified) score += 6;

  const priceConfidence: PriceConfidence = input.hasExactPrice || eventPricingCount >= 2
    ? "HIGH"
    : input.hasEstimatedRange || input.hasPrimePricing || eventPricingCount >= 1
      ? "MEDIUM"
      : "LOW";

  return {
    qualityScore: clampScore(score),
    priceConfidence,
    checklist,
    completedItems,
    totalItems,
  };
}

export function assessCatererTrust(input: {
  imagesCount?: number;
  hasCoverImage?: boolean;
  hasDescription?: boolean;
  hasCity?: boolean;
  hasArea?: boolean;
  hasCoordinates?: boolean;
  hasMinPlatePrice?: boolean;
  hasTierCount?: number;
  hasCuisineData?: boolean;
  hasMinGuests?: boolean;
  hasMenuPackages?: boolean;
  hasContactDetails?: boolean;
  reviewCount?: number;
  bookingCount?: number;
  viewCount?: number;
  updatedAt?: string | Date | null;
  isVerified?: boolean;
}): TrustAssessment {
  const tierCount = input.hasTierCount ?? 0;

  const checklist: TrustChecklistItem[] = [
    { key: "cover", label: "Cover image", done: Boolean(input.hasCoverImage) },
    { key: "photos", label: "At least 3 photos", done: (input.imagesCount ?? 0) >= 3 },
    { key: "description", label: "Detailed description", done: Boolean(input.hasDescription) },
    { key: "city", label: "City set", done: Boolean(input.hasCity) },
    { key: "area", label: "Area set", done: Boolean(input.hasArea) },
    { key: "coordinates", label: "Map coordinates", done: Boolean(input.hasCoordinates) },
    { key: "pricing", label: "Base plate pricing", done: Boolean(input.hasMinPlatePrice) },
    { key: "tiers", label: "Tier pricing", done: tierCount > 0 },
    { key: "cuisines", label: "Cuisine data", done: Boolean(input.hasCuisineData) },
    { key: "packages", label: "Menu packages", done: Boolean(input.hasMenuPackages) },
    { key: "contact", label: "Contact details", done: Boolean(input.hasContactDetails) },
  ];

  const completedItems = checklist.filter((item) => item.done).length;
  const totalItems = checklist.length;

  let score = Math.round((completedItems / totalItems) * 72);

  // Pricing granularity boosts
  score += Math.min(9, tierCount * 3);

  // Market activity / freshness boosts
  const reviewCount = input.reviewCount ?? 0;
  const bookingCount = input.bookingCount ?? 0;
  const viewCount = input.viewCount ?? 0;
  if (reviewCount > 0) score += 3;
  if (bookingCount > 0) score += 3;
  if (viewCount >= 100) score += 2;

  const updatedDays = getUpdatedDays(input.updatedAt);
  if (updatedDays !== null && updatedDays <= 30) score += 4;

  if (input.isVerified) score += 7;

  const priceConfidence: PriceConfidence = tierCount >= 2 || (input.hasMinPlatePrice && tierCount >= 1)
    ? "HIGH"
    : input.hasMinPlatePrice || tierCount >= 1
      ? "MEDIUM"
      : "LOW";

  return {
    qualityScore: clampScore(score),
    priceConfidence,
    checklist,
    completedItems,
    totalItems,
  };
}

export function getPriceConfidenceExplanation(
  confidence: PriceConfidence,
  listingType: "venue" | "caterer"
): string {
  if (confidence === "HIGH") {
    return listingType === "venue"
      ? "High confidence: event-wise or exact pricing is available with strong coverage."
      : "High confidence: multiple menu price tiers are available for better budget fit.";
  }

  if (confidence === "MEDIUM") {
    return listingType === "venue"
      ? "Medium confidence: partial pricing is available. Final quote may vary by date and inclusions."
      : "Medium confidence: base or limited tier pricing is available. Final quote may vary by menu scope.";
  }

  return "Low confidence: limited pricing details are available. Contact the partner for a finalized quote.";
}

export function getQualityLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Basic";
}

export function getLastUpdatedLabel(dateLike?: string | Date | null): string {
  if (!dateLike) return "Updated recently";

  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);

  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 7) return `Updated ${days} days ago`;

  return `Updated ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function getUpdatedDays(dateLike?: string | Date | null): number | null {
  if (!dateLike) return null;
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return null;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  return Math.floor(diffMs / day);
}
