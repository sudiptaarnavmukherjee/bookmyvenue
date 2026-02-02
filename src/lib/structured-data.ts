import { siteConfig } from "./seo";

// Organization schema for the website
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-XXXXXXXXXX",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Telugu"],
    },
    sameAs: [
      "https://www.facebook.com/bookmyvenue",
      "https://www.instagram.com/bookmyvenue",
      "https://twitter.com/bookmyvenue",
    ],
  };
}

// Local business schema for venues
export function generateVenueSchema(venue: {
  name: string;
  description: string;
  address: string;
  city: string;
  area?: string;
  pincode?: string;
  slug: string;
  coverImage?: string;
  images?: string[];
  maxGuests?: number;
  exactPrice?: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  contactNumber?: string;
}) {
  const price = venue.exactPrice || venue.estimatedMinPrice;
  
  return {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: venue.name,
    description: venue.description,
    url: `${siteConfig.url}/venues/${venue.slug}`,
    image: venue.images || (venue.coverImage ? [venue.coverImage] : []),
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: venue.area || venue.city,
      addressRegion: venue.city,
      postalCode: venue.pincode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Add latitude/longitude if available
    },
    telephone: venue.contactNumber,
    maximumAttendeeCapacity: venue.maxGuests,
    ...(price && {
      priceRange: venue.estimatedMaxPrice
        ? `₹${price.toLocaleString("en-IN")} - ₹${venue.estimatedMaxPrice.toLocaleString("en-IN")}`
        : `From ₹${price.toLocaleString("en-IN")}`,
    }),
    ...(venue.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: venue.rating,
        reviewCount: venue.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(venue.amenities && venue.amenities.length > 0 && {
      amenityFeature: venue.amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity,
        value: true,
      })),
    }),
  };
}

// Food establishment schema for caterers
export function generateCatererSchema(caterer: {
  name: string;
  description: string;
  address: string;
  city: string;
  area?: string;
  slug: string;
  coverImage?: string;
  images?: string[];
  isPureVeg?: boolean;
  cuisines?: string[];
  minPlatePrice?: number;
  silverPrice?: number;
  platinumPrice?: number;
  rating?: number;
  reviewCount?: number;
  contactNumber?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: caterer.name,
    description: caterer.description,
    url: `${siteConfig.url}/catering/${caterer.slug}`,
    image: caterer.images || (caterer.coverImage ? [caterer.coverImage] : []),
    address: {
      "@type": "PostalAddress",
      streetAddress: caterer.address,
      addressLocality: caterer.area || caterer.city,
      addressRegion: caterer.city,
      addressCountry: "IN",
    },
    telephone: caterer.contactNumber,
    servesCuisine: caterer.cuisines || [],
    ...(caterer.minPlatePrice && {
      priceRange: caterer.platinumPrice
        ? `₹${caterer.minPlatePrice} - ₹${caterer.platinumPrice} per plate`
        : `From ₹${caterer.minPlatePrice} per plate`,
    }),
    ...(caterer.isPureVeg && {
      menuDescription: "Pure Vegetarian",
    }),
    ...(caterer.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: caterer.rating,
        reviewCount: caterer.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

// Breadcrumb schema for navigation
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

// FAQ schema for FAQ pages
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Search action schema for site search
export function generateSearchActionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteConfig.url,
    name: siteConfig.name,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/venues?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Component to render JSON-LD script
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
