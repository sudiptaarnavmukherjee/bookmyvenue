import { Metadata } from "next";

// Base metadata for the site
export const siteConfig = {
  name: "BookMyVenue",
  description: "Find and book the perfect wedding venue and catering in Hyderabad. Browse verified venues, compare prices, and book with confidence.",
  url: "https://bookmyvenue.in",
  ogImage: "https://bookmyvenue.in/og-image.jpg",
  keywords: [
    "wedding venue",
    "wedding hall",
    "banquet hall",
    "function hall",
    "catering services",
    "wedding catering",
    "Hyderabad venues",
    "marriage hall",
    "event venue",
    "party venue",
  ],
  creator: "BookMyVenue Team",
};

// Generate base metadata
export function generateBaseMetadata(): Metadata {
  return {
    title: {
      default: `${siteConfig.name} - Find Perfect Wedding Venues & Catering`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // google: "your-google-verification-code",
    },
  };
}

// Generate venue page metadata
export function generateVenueMetadata(venue: {
  name: string;
  description: string;
  city: string;
  area?: string;
  slug: string;
  coverImage?: string;
  maxGuests?: number;
  exactPrice?: number;
  estimatedMinPrice?: number;
}): Metadata {
  const title = `${venue.name} - Wedding Venue in ${venue.area || venue.city}`;
  const description = venue.description.slice(0, 160) + (venue.description.length > 160 ? "..." : "");
  const url = `${siteConfig.url}/venues/${venue.slug}`;
  
  return {
    title,
    description,
    keywords: [
      venue.name,
      `wedding venue ${venue.city}`,
      `${venue.area || venue.city} wedding hall`,
      `banquet hall ${venue.city}`,
      "marriage venue",
    ],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: venue.coverImage
        ? [{ url: venue.coverImage, width: 1200, height: 630, alt: venue.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: venue.coverImage ? [venue.coverImage] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate caterer page metadata
export function generateCatererMetadata(caterer: {
  name: string;
  description: string;
  city: string;
  area?: string;
  slug: string;
  coverImage?: string;
  isPureVeg?: boolean;
  minPlatePrice?: number;
}): Metadata {
  const vegLabel = caterer.isPureVeg ? "Pure Veg " : "";
  const title = `${caterer.name} - ${vegLabel}Wedding Catering in ${caterer.area || caterer.city}`;
  const description = caterer.description.slice(0, 160) + (caterer.description.length > 160 ? "..." : "");
  const url = `${siteConfig.url}/catering/${caterer.slug}`;
  
  return {
    title,
    description,
    keywords: [
      caterer.name,
      `wedding catering ${caterer.city}`,
      `${caterer.area || caterer.city} caterers`,
      caterer.isPureVeg ? "pure veg catering" : "non-veg catering",
      "wedding food",
    ],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: caterer.coverImage
        ? [{ url: caterer.coverImage, width: 1200, height: 630, alt: caterer.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: caterer.coverImage ? [caterer.coverImage] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate listing page metadata
export function generateListingMetadata(
  type: "venues" | "catering",
  city?: string,
  area?: string
): Metadata {
  const location = area ? `${area}, ${city}` : city || "Hyderabad";
  const title =
    type === "venues"
      ? `Wedding Venues in ${location} - Book Now`
      : `Wedding Catering in ${location} - Book Now`;
  const description =
    type === "venues"
      ? `Discover ${location}'s best wedding venues. Compare prices, capacity, amenities and book your perfect wedding hall online.`
      : `Find top wedding caterers in ${location}. Compare menus, prices, and book quality catering for your wedding.`;

  return {
    title,
    description,
    keywords:
      type === "venues"
        ? [`wedding venues ${location}`, `banquet halls ${location}`, `marriage halls`, `function halls`]
        : [`wedding catering ${location}`, `wedding caterers`, `event catering`, `party catering`],
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}
