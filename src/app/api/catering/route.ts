import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAreaCoordinates } from "@/lib/ola-maps";
import { assessCatererTrust } from "@/lib/listing-trust";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 60;

function buildCacheHeaders(search: string | null, lat: string | null, lng: string | null) {
  if (search) {
    return { "Cache-Control": "public, s-maxage=12, stale-while-revalidate=60" };
  }
  if (lat && lng) {
    return { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=90" };
  }
  return { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180" };
}

function clampInt(value: string | null, min: number, max: number, fallback: number) {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeSearch(value: string | null) {
  return (value || "").trim().toLowerCase();
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

function buildCatererRelevanceScore(
  caterer: {
    name: string;
    city: string;
    area: string | null;
    description: string | null;
    cuisines: string | null;
    isPureVeg: boolean;
    isVerified: boolean;
    viewCount: number | null;
    _count: { reviews: number; bookings: number };
  },
  query: string,
  distanceKm: number | null
) {
  if (!query) return 0;

  let score = 0;
  const name = caterer.name.toLowerCase();
  const city = caterer.city.toLowerCase();
  const area = (caterer.area || "").toLowerCase();
  const description = (caterer.description || "").toLowerCase();
  const cuisines = (caterer.cuisines || "").toLowerCase();

  if (name === query) score += 120;
  else if (name.startsWith(query)) score += 80;
  else if (name.includes(query)) score += 55;

  if (city === query || area === query) score += 38;
  else if (city.startsWith(query) || area.startsWith(query)) score += 28;
  else if (city.includes(query) || area.includes(query)) score += 18;

  if (description.includes(query)) score += 10;
  if (cuisines.includes(query)) score += 26;

  if (caterer.isVerified) score += 8;
  if (caterer.isPureVeg && (query.includes("veg") || query.includes("vegetarian"))) score += 20;
  score += Math.min(14, Math.log10((caterer.viewCount || 0) + 1) * 6);
  score += Math.min(14, caterer._count.reviews * 1.4);
  score += Math.min(8, caterer._count.bookings * 0.8);

  if (distanceKm !== null) {
    score += Math.max(0, 20 - distanceKm);
  }

  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const isPureVeg = searchParams.get("isPureVeg");
    const sortBy = searchParams.get("sortBy") || searchParams.get("sort") || "newest";
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const minGuests = searchParams.get("minGuests"); // For plate count filtering
    const page = clampInt(searchParams.get("page"), 1, 500, 1);
    const pageSize = clampInt(limit, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
    const searchQuery = normalizeSearch(search);
    const effectiveSortBy = sortBy === "newest" && searchQuery ? "relevance" : sortBy;
    const cacheHeaders = buildCacheHeaders(search, lat, lng);

    const where: any = {
      isActive: true,
      // Show both verified caterers AND admin-listed fishbowl caterers
      OR: [
        { isVerified: true },
        { isAdminListed: true },
      ],
    };

    if (city) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { city: { contains: city, mode: "insensitive" } },
            { area: { contains: city, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (area) {
      where.area = {
        contains: area,
        mode: "insensitive",
      };
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { area: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { cuisines: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (isPureVeg !== null && isPureVeg !== undefined && isPureVeg !== "") {
      where.isPureVeg = isPureVeg === "true";
    }

    // Fetch areas for sorting
    let areas: any[] = [];
    try {
      areas = await prisma.area.findMany({
        select: { name: true, priority: true },
        orderBy: { priority: "desc" },
      });
    } catch {
      // Area table might not exist, continue without it
    }
    const areaPriorityMap = new Map(areas.map(a => [a.name.toLowerCase(), a.priority]));

    const caterers = await prisma.caterer.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        packages: {
          orderBy: {
            pricePerPlate: "asc",
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    // Apply sorting
    let sortedCaterers = [...caterers];
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    
    // Calculate distances if lat/lng provided
    const caterersWithDistance = sortedCaterers.map(caterer => {
      let distanceKm: number | null = null;
      let distanceText: string | null = null;
      
      if (userLat && userLng) {
        let cLat: number | null = caterer.latitude;
        let cLng: number | null = caterer.longitude;
        if (!cLat || !cLng) {
          const fallback = getAreaCoordinates(caterer.area || caterer.city || "");
          if (fallback) { cLat = fallback.lat; cLng = fallback.lng; }
        }
        if (cLat && cLng) {
          distanceKm = calculateDistance(userLat, userLng, cLat, cLng);
          distanceText = formatDistance(distanceKm);
        }
      }
      
      return {
        ...caterer,
        taggedToOwnerId: caterer.taggedToOwnerId,
        distanceKm,
        distanceText,
      };
    });

    // Apply radius filter (only keep caterers that have coords AND are within radius)
    const radius = searchParams.get("radius");
    const radiusFiltered = (radius && userLat && userLng)
      ? caterersWithDistance.filter(c => c.distanceKm !== null && c.distanceKm <= parseFloat(radius))
      : caterersWithDistance;
    
    switch (effectiveSortBy) {
      case "nearby":
        radiusFiltered.sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        break;
      case "area":
        radiusFiltered.sort((a, b) => {
          const aPriority = areaPriorityMap.get(a.area?.toLowerCase() || "") || 0;
          const bPriority = areaPriorityMap.get(b.area?.toLowerCase() || "") || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "price-low":
        radiusFiltered.sort((a, b) => {
          const aPrice = a.silverPrice || a.minPlatePrice || 0;
          const bPrice = b.silverPrice || b.minPlatePrice || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        radiusFiltered.sort((a, b) => {
          const aPrice = a.platinumPrice || a.minPlatePrice || 0;
          const bPrice = b.platinumPrice || b.minPlatePrice || 0;
          return bPrice - aPrice;
        });
        break;
      case "popular":
        radiusFiltered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "rating":
        radiusFiltered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "relevance":
        radiusFiltered.sort((a, b) => {
          const aScore = buildCatererRelevanceScore(a, searchQuery, a.distanceKm ?? null);
          const bScore = buildCatererRelevanceScore(b, searchQuery, b.distanceKm ?? null);
          if (bScore !== aScore) return bScore - aScore;
          return (b.viewCount || 0) - (a.viewCount || 0);
        });
        break;
      case "newest":
      default:
        radiusFiltered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    const enriched = radiusFiltered.map((caterer) => {
      const imageCount = caterer.images
        ? caterer.images.split(",").filter(Boolean).length
        : caterer.coverImage
        ? 1
        : 0;
      const trust = assessCatererTrust({
        hasCoverImage: Boolean(caterer.coverImage),
        imagesCount: imageCount,
        hasDescription: Boolean(caterer.description && caterer.description.trim().length >= 40),
        hasCity: Boolean(caterer.city),
        hasArea: Boolean(caterer.area),
        hasCoordinates: Boolean(caterer.latitude && caterer.longitude),
        hasMinPlatePrice: Boolean(caterer.minPlatePrice),
        hasTierCount: [caterer.silverPrice, caterer.goldPrice, caterer.platinumPrice].filter(Boolean).length,
        hasCuisineData: Boolean(caterer.cuisines && caterer.cuisines.trim()),
        hasMinGuests: Boolean(caterer.minGuests),
        hasMenuPackages: caterer.packages && caterer.packages.length > 0,
        hasContactDetails: Boolean(caterer.contactNumber || caterer.contactName),
        reviewCount: caterer._count.reviews,
        bookingCount: caterer._count.bookings,
        viewCount: caterer.viewCount ?? 0,
        updatedAt: caterer.updatedAt?.toISOString(),
        isVerified: caterer.isVerified,
      });
      return {
        ...caterer,
        qualityScore: trust.qualityScore,
        priceConfidence: trust.priceConfidence,
        relevanceScore: searchQuery
          ? buildCatererRelevanceScore(caterer, searchQuery, caterer.distanceKm ?? null)
          : undefined,
      };
    });

    const total = enriched.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pagedCaterers = enriched.slice(start, start + pageSize);

    return NextResponse.json({ 
      caterers: pagedCaterers,
      areas,
      total,
      pagination: {
        page: safePage,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
      sorting: {
        requested: sortBy,
        effective: effectiveSortBy,
      },
    }, { headers: cacheHeaders });
  } catch (error: any) {
    console.error("Error fetching caterers:", error?.message || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch caterers",
        details: error?.message,
        caterers: [],
        areas: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      city,
      address,
      phone,
      minPlatePrice,
      isPureVeg,
      isMultiCuisine,
      cuisines,
      images,
      coverImage,
      ownerId,
      packages,
    } = body;

    // Validation
    if (!name || !city || !address || !phone || !minPlatePrice || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + city.toLowerCase();

    const caterer = await prisma.caterer.create({
      data: {
        name,
        slug,
        description: description || "",
        city,
        address,
        phone,
        minPlatePrice: parseFloat(minPlatePrice),
        isPureVeg: isPureVeg || false,
        isMultiCuisine: isMultiCuisine || true,
        cuisines: Array.isArray(cuisines) ? cuisines.join(',') : (cuisines || ''),
        images: Array.isArray(images) ? images.join(',') : (images || ''),
        coverImage: coverImage || (Array.isArray(images) ? images[0] : '') || "",
        owner: {
          connect: { id: ownerId }
        },
        isVerified: false, // Admin needs to verify
        isActive: true,
        packages: packages
          ? {
              create: packages.map((pkg: any) => ({
                tier: pkg.tier,
                name: pkg.name,
                description: pkg.description,
                pricePerPlate: parseFloat(pkg.pricePerPlate),
                itemCount: parseInt(pkg.itemCount),
                items: pkg.items,
              })),
            }
          : undefined,
      },
      include: {
        packages: true,
      },
    });

    return NextResponse.json({ caterer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating caterer:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A caterer with this name already exists in this city" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create caterer" },
      { status: 500 }
    );
  }
}
