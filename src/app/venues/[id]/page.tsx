import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VenueDetailContent, { VenueData } from "@/components/venue/VenueDetailContent";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Generate static params for all venues at build time
export async function generateStaticParams() {
  try {
    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      select: { slug: true, id: true },
      take: 100, // Limit to top 100 venues
    });
    
    return venues.map((venue) => ({
      id: venue.slug || venue.id,
    }));
  } catch {
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const venue = await prisma.venue.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
        isActive: true,
      },
      select: { name: true, city: true, description: true },
    });
    
    if (!venue) return { title: "Venue Not Found" };
    
    return {
      title: `${venue.name} - ${venue.city} | BookMyVenue`,
      description: venue.description?.slice(0, 160) || `Book ${venue.name} for your next event`,
    };
  } catch {
    return { title: "Venue Not Found" };
  }
}

async function getVenue(idOrSlug: string): Promise<VenueData | null> {
  try {
    const venue = await prisma.venue.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, { id: idOrSlug }],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        area: true,
        address: true,
        minGuests: true,
        maxGuests: true,
        exactPrice: true,
        estimatedMinPrice: true,
        estimatedMaxPrice: true,
        primeDayPrice: true,
        nonPrimeDayPrice: true,
        primeDays: true,
        isVerified: true,
        bookingEnabled: true,
        isAdminListed: true,
        contactNumber: true,
        contactName: true,
        description: true,
        images: true,
        amenities: true,
        viewCount: true,
        latitude: true,
        longitude: true,
        googleMapsUrl: true,
        owner: { select: { name: true } },
        _count: { select: { reviews: true, bookings: true } },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { eventDate: true },
        },
      },
    });

    if (!venue) return null;

    // Parse images and amenities
    const images = typeof venue.images === "string"
      ? venue.images.split(",").filter(Boolean)
      : (venue.images as string[]) || [];
    
    const amenities = typeof venue.amenities === "string"
      ? venue.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : (venue.amenities as string[]) || [];

    return {
      id: venue.id,
      slug: venue.slug || venue.id,
      name: venue.name,
      city: venue.city,
      area: venue.area,
      location: venue.area || venue.city,
      address: venue.address,
      capacity: venue.maxGuests || 0,
      minGuests: venue.minGuests,
      maxGuests: venue.maxGuests,
      price: venue.exactPrice || venue.estimatedMinPrice || 0,
      exactPrice: venue.exactPrice,
      estimatedMinPrice: venue.estimatedMinPrice,
      estimatedMaxPrice: venue.estimatedMaxPrice,
      primeDayPrice: venue.primeDayPrice,
      nonPrimeDayPrice: venue.nonPrimeDayPrice,
      primeDays: venue.primeDays,
      isVerified: venue.isVerified,
      bookingEnabled: venue.bookingEnabled ?? false,
      isAdminListed: venue.isAdminListed ?? false,
      contactNumber: venue.contactNumber,
      contactName: venue.contactName,
      description: venue.description || "",
      images,
      amenities,
      viewCount: venue.viewCount || 0,
      latitude: venue.latitude,
      longitude: venue.longitude,
      googleMapsUrl: venue.googleMapsUrl,
      ownerName: venue.owner?.name,
      reviewCount: venue._count.reviews,
      bookingCount: venue._count.bookings,
      bookedDates: venue.bookings.map((b) => b.eventDate.toISOString()),
    };
  } catch (error) {
    console.error("Error fetching venue:", error);
    return null;
  }
}

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await getVenue(id);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Venue not found</h2>
          <Link
            href="/venues"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] px-6 py-2 font-semibold text-white"
          >
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  return <VenueDetailContent venue={venue} />;
}

