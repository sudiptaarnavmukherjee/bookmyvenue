import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CateringDetailContent, { CatererData, MenuPackageData } from "@/components/catering/CateringDetailContent";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// Always fetch fresh data so admin menu changes appear immediately
export const dynamic = "force-dynamic";

// Generate static params for all caterers at build time
export async function generateStaticParams() {
  try {
    const caterers = await prisma.caterer.findMany({
      where: { isActive: true },
      select: { slug: true, id: true },
      take: 100,
    });
    
    return caterers.map((caterer) => ({
      id: caterer.slug || caterer.id,
    }));
  } catch {
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const caterer = await prisma.caterer.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
        isActive: true,
      },
      select: { name: true, city: true, description: true },
    });
    
    if (!caterer) return { title: "Caterer Not Found" };
    
    return {
      title: `${caterer.name} - ${caterer.city} Catering | BookMyVenue`,
      description: caterer.description?.slice(0, 160) || `Book ${caterer.name} for your next event`,
    };
  } catch {
    return { title: "Caterer Not Found" };
  }
}

async function getCaterer(idOrSlug: string): Promise<CatererData | null> {
  try {
    const caterer = await prisma.caterer.findFirst({
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
        isPureVeg: true,
        description: true,
        images: true,
        minPlatePrice: true,
        minGuests: true,
        cuisines: true,
        silverPrice: true,
        goldPrice: true,
        platinumPrice: true,
        isVerified: true,
        isAdminListed: true,
        taggedToOwnerId: true,
        bookingEnabled: true,
        contactNumber: true,
        contactName: true,
        viewCount: true,
        latitude: true,
        longitude: true,
        googleMapsUrl: true,
        address: true,
        updatedAt: true,
        owner: { select: { name: true } },
        packages: {
          where: { isTemplate: false },
          select: {
            id: true,
            tier: true,
            name: true,
            variant: true,
            pricePerPlate: true,
            itemCount: true,
            items: true,
            description: true,
          },
          orderBy: [{ tier: "asc" }, { variant: "asc" }],
        },
        _count: { select: { reviews: true, bookings: true } },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { eventDate: true },
        },
      },
    });

    if (!caterer) return null;

    // Parse images
    const images = typeof caterer.images === "string"
      ? caterer.images.split(",").filter(Boolean)
      : (caterer.images as string[]) || [];

    // Parse cuisines
    const cuisines = typeof caterer.cuisines === "string"
      ? caterer.cuisines.split(",").map((c) => c.trim()).filter(Boolean)
      : (caterer.cuisines as string[]) || [];

    // Transform packages — items field is Json (string[], Record<string,string[]>, or CSV)
    const menuPackages: MenuPackageData[] = caterer.packages.map((pkg) => {
      const raw = pkg.items;
      let items: Record<string, string[]> | string[];
      if (typeof raw === "string") {
        items = raw.split(",").map((i) => i.trim()).filter(Boolean);
      } else if (Array.isArray(raw)) {
        items = raw as string[];
      } else if (raw && typeof raw === "object") {
        items = raw as Record<string, string[]>;
      } else {
        items = [];
      }
      return {
        id: pkg.id,
        tier: pkg.tier as "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM",
        name: pkg.name,
        variant: (pkg.variant ?? null) as "NON_VEG" | "VEG" | "JAIN" | null,
        pricePerPlate: pkg.pricePerPlate,
        itemCount: pkg.itemCount ?? null,
        items,
        description: pkg.description,
      };
    });

    return {
      id: caterer.id,
      slug: caterer.slug || caterer.id,
      name: caterer.name,
      city: caterer.city,
      area: caterer.area,
      isPureVeg: caterer.isPureVeg,
      description: caterer.description || "",
      images,
      pricePerPlate: caterer.minPlatePrice || 0,
      minGuests: caterer.minGuests || 50,
      cuisines,
      silverPrice: caterer.silverPrice,
      goldPrice: caterer.goldPrice,
      platinumPrice: caterer.platinumPrice,
      isVerified: caterer.isVerified,
      isAdminListed: caterer.isAdminListed ?? false,
      taggedToOwnerId: caterer.taggedToOwnerId,
      bookingEnabled: caterer.bookingEnabled ?? false,
      contactNumber: caterer.contactNumber,
      contactName: caterer.contactName,
      viewCount: caterer.viewCount || 0,
      menuPackages,
      latitude: caterer.latitude,
      longitude: caterer.longitude,
      googleMapsUrl: caterer.googleMapsUrl,
      address: caterer.address,
      updatedAt: caterer.updatedAt.toISOString(),
      ownerName: caterer.owner?.name,
      reviewCount: caterer._count.reviews,
      bookingCount: caterer._count.bookings,
      bookedDates: caterer.bookings.map((b) => b.eventDate.toISOString()),
    };
  } catch (error) {
    console.error("Error fetching caterer:", error);
    return null;
  }
}

export default async function CatererDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caterer = await getCaterer(id);

  if (!caterer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Caterer not found</h2>
          <Link
            href="/catering"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#0b5fab] to-[#1f86d9] px-6 py-2 font-semibold text-white"
          >
            Back to Catering
          </Link>
        </div>
      </div>
    );
  }

  return <CateringDetailContent caterer={caterer} />;
}

