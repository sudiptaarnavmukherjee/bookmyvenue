import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/debug/ola-maps
// Tests whether Ola Maps API key is working and checks venue coordinate coverage
export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;
  const clientId = process.env.OLA_MAPS_CLIENT_ID;
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET;

  const results: Record<string, any> = {
    config: {
      apiKeySet: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 6) + "..." : null,
      oauthClientSet: !!clientId && !!clientSecret,
    },
  };

  // 1. Test geocoding
  if (apiKey) {
    try {
      const geoRes = await fetch(
        `https://api.olamaps.io/places/v1/geocode?address=Victoria+Memorial+Kolkata&api_key=${apiKey}`
      );
      const geoJson = await geoRes.json();
      results.geocoding = {
        status: geoRes.status,
        ok: geoRes.ok,
        resultCount: geoJson.geocodingResults?.length ?? 0,
        firstResult: geoJson.geocodingResults?.[0]?.formatted_address ?? null,
        firstCoords: geoJson.geocodingResults?.[0]?.geometry?.location ?? null,
      };
    } catch (e: any) {
      results.geocoding = { error: e.message };
    }

    // 2. Test autocomplete
    try {
      const acRes = await fetch(
        `https://api.olamaps.io/places/v1/autocomplete?input=Rabindra+Sarani&api_key=${apiKey}`
      );
      const acJson = await acRes.json();
      results.autocomplete = {
        status: acRes.status,
        ok: acRes.ok,
        resultCount: acJson.predictions?.length ?? 0,
        firstResult: acJson.predictions?.[0]?.description ?? null,
      };
    } catch (e: any) {
      results.autocomplete = { error: e.message };
    }
  } else {
    results.geocoding = { skipped: "No API key configured" };
    results.autocomplete = { skipped: "No API key configured" };
  }

  // 3. Check venue coordinate coverage in DB
  try {
    const totalVenues = await prisma.venue.count({ where: { isActive: true, deletedAt: null } });
    const venuesWithCoords = await prisma.venue.count({
      where: {
        isActive: true,
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
      },
    });
    const venuesSample = await prisma.venue.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, latitude: true, longitude: true, area: true },
      take: 5,
    });

    results.venueCoordinates = {
      total: totalVenues,
      withCoords: venuesWithCoords,
      withoutCoords: totalVenues - venuesWithCoords,
      coverage: totalVenues > 0 ? `${Math.round((venuesWithCoords / totalVenues) * 100)}%` : "N/A",
      sample: venuesSample.map(v => ({
        name: v.name,
        area: v.area,
        hasCoords: v.latitude !== null && v.longitude !== null,
        lat: v.latitude,
        lng: v.longitude,
      })),
    };
  } catch (e: any) {
    results.venueCoordinates = { error: e.message };
  }

  // 4. Overall diagnosis
  const apiWorks = results.geocoding?.ok === true;
  const hasCoords = results.venueCoordinates?.withCoords > 0;

  results.diagnosis = {
    olaMapsApiWorking: apiWorks,
    venuesHaveCoordinates: hasCoords,
    distancesWillShow: apiWorks || hasCoords,
    message: !apiWorks
      ? "Ola Maps API key is invalid or not configured — check NEXT_PUBLIC_OLA_MAPS_API_KEY"
      : !hasCoords
      ? "API key works BUT venues have no coordinates stored — add lat/lng to venues in admin"
      : "Everything looks good — distances should show when user grants location permission",
  };

  return NextResponse.json(results, { status: 200 });
}
