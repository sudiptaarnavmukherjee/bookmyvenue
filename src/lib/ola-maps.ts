/**
 * Ola Maps Integration Service
 * 
 * Ola Maps API is free for the first year
 * Get your API key from: https://maps.olacabs.com/
 * 
 * Features:
 * - Geocoding (address to coordinates)
 * - Reverse Geocoding (coordinates to address)
 * - Places Search
 * - Distance Matrix
 * - Directions
 */

// Ola Maps API Configuration
const OLA_MAPS_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || "";
const OLA_MAPS_BASE_URL = "https://api.olamaps.io";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  distance?: number; // in meters
}

export interface DistanceResult {
  origin: Coordinates;
  destination: Coordinates;
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
}

/**
 * Get user's current location using browser's Geolocation API
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation not available');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Geocode an address to coordinates using Ola Maps
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!OLA_MAPS_API_KEY) {
    console.warn('Ola Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${OLA_MAPS_BASE_URL}/places/v1/geocode?address=${encodeURIComponent(address)}&api_key=${OLA_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.geocodingResults && data.geocodingResults.length > 0) {
      const result = data.geocodingResults[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address using Ola Maps
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  if (!OLA_MAPS_API_KEY) {
    console.warn('Ola Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${OLA_MAPS_BASE_URL}/places/v1/reverse-geocode?latlng=${coords.lat},${coords.lng}&api_key=${OLA_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Search for places using Ola Maps
 */
export async function searchPlaces(
  query: string, 
  nearCoords?: Coordinates
): Promise<PlaceResult[]> {
  if (!OLA_MAPS_API_KEY) {
    console.warn('Ola Maps API key not configured');
    return [];
  }

  try {
    let url = `${OLA_MAPS_BASE_URL}/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_MAPS_API_KEY}`;
    
    if (nearCoords) {
      url += `&location=${nearCoords.lat},${nearCoords.lng}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Places search failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.predictions) {
      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        name: p.structured_formatting?.main_text || p.description,
        address: p.description,
        coordinates: p.geometry?.location || { lat: 0, lng: 0 },
      }));
    }

    return [];
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

/**
 * Get exact coordinates and full details for a place using its place_id.
 * Use after autocomplete to get precise lat/lng instead of geocoding by address text.
 */
export async function getPlaceDetails(placeId: string): Promise<{ coordinates: Coordinates; address: string } | null> {
  if (!OLA_MAPS_API_KEY || !placeId) return null;

  try {
    const response = await fetch(
      `${OLA_MAPS_BASE_URL}/places/v1/details?place_id=${encodeURIComponent(placeId)}&api_key=${OLA_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Place details failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.result;

    if (result?.geometry?.location) {
      return {
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        address: result.formatted_address || result.name || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

/**
 * Calculate distance between two points using Ola Maps Distance Matrix
 */
export async function getDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceResult | null> {
  if (!OLA_MAPS_API_KEY) {
    console.warn('Ola Maps API key not configured');
    // Fallback to Haversine formula
    return {
      origin,
      destination,
      distanceMeters: calculateHaversineDistance(origin, destination),
      distanceText: formatDistance(calculateHaversineDistance(origin, destination)),
      durationSeconds: 0,
      durationText: "N/A",
    };
  }

  try {
    const response = await fetch(
      `${OLA_MAPS_BASE_URL}/routing/v1/distanceMatrix?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&api_key=${OLA_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Distance matrix failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.rows && data.rows[0]?.elements?.[0]) {
      const element = data.rows[0].elements[0];
      return {
        origin,
        destination,
        distanceMeters: element.distance.value,
        distanceText: element.distance.text,
        durationSeconds: element.duration.value,
        durationText: element.duration.text,
      };
    }

    return null;
  } catch (error) {
    console.error('Distance matrix error:', error);
    // Fallback to Haversine formula
    const distance = calculateHaversineDistance(origin, destination);
    return {
      origin,
      destination,
      distanceMeters: distance,
      distanceText: formatDistance(distance),
      durationSeconds: 0,
      durationText: "N/A",
    };
  }
}

/**
 * Calculate straight-line distance using Haversine formula
 * Fallback when Ola Maps API is unavailable
 */
export function calculateHaversineDistance(
  origin: Coordinates,
  destination: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance in human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Sort venues/caterers by distance from user's location
 */
export function sortByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  userLocation: Coordinates
): (T & { distance?: number })[] {
  return items
    .map((item) => {
      if (item.latitude && item.longitude) {
        const distance = calculateHaversineDistance(userLocation, {
          lat: item.latitude,
          lng: item.longitude,
        });
        return { ...item, distance };
      }
      return { ...item, distance: Infinity };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

/**
 * Get nearby venues/caterers within a radius
 */
export function filterByRadius<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  userLocation: Coordinates,
  radiusMeters: number
): (T & { distance: number })[] {
  return items
    .map((item) => {
      if (item.latitude && item.longitude) {
        const distance = calculateHaversineDistance(userLocation, {
          lat: item.latitude,
          lng: item.longitude,
        });
        return { ...item, distance };
      }
      return null;
    })
    .filter((item): item is T & { distance: number } => 
      item !== null && item.distance <= radiusMeters
    )
    .sort((a, b) => a.distance - b.distance);
}

// Kolkata coordinates for default center
export const KOLKATA_CENTER: Coordinates = {
  lat: 22.5726,
  lng: 88.3639,
};

// Common area coordinates in Kolkata (for venues without coordinates)
export const KOLKATA_AREAS: Record<string, Coordinates> = {
  "Salt Lake": { lat: 22.5809, lng: 88.4185 },
  "New Town": { lat: 22.5938, lng: 88.4667 },
  "Rajarhat": { lat: 22.6116, lng: 88.4741 },
  "Barasat": { lat: 22.7228, lng: 88.4812 },
  "Howrah": { lat: 22.5958, lng: 88.2636 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Dum Dum": { lat: 22.6442, lng: 88.4323 },
  "Barrackpore": { lat: 22.7627, lng: 88.3799 },
  "Madhyamgram": { lat: 22.6885, lng: 88.4553 },
  "Kalyani": { lat: 22.9750, lng: 88.4345 },
  "Jadavpur": { lat: 22.4991, lng: 88.3706 },
  "Gariahat": { lat: 22.5145, lng: 88.3669 },
  "Ballygunge": { lat: 22.5298, lng: 88.3633 },
  "Park Street": { lat: 22.5541, lng: 88.3520 },
  "Alipore": { lat: 22.5310, lng: 88.3383 },
  "Behala": { lat: 22.4987, lng: 88.3206 },
  "Tollygunge": { lat: 22.4996, lng: 88.3472 },
};

/**
 * Get coordinates for an area name (fallback when venue has no lat/lng)
 */
export function getAreaCoordinates(areaName: string): Coordinates | null {
  // Find matching area (case-insensitive, partial match)
  const normalizedArea = areaName.toLowerCase();
  
  for (const [area, coords] of Object.entries(KOLKATA_AREAS)) {
    if (normalizedArea.includes(area.toLowerCase()) || area.toLowerCase().includes(normalizedArea)) {
      return coords;
    }
  }
  
  return KOLKATA_CENTER; // Default to Kolkata center if no match
}
