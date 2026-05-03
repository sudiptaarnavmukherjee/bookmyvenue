import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Attempts to extract lat/lng coordinates from a Google Maps URL.
 * Handles common share formats:
 *   /@lat,lng,zoom  (standard place / directions links)
 *   ?q=lat,lng      (search query with coordinates)
 *   ?ll=lat,lng     (older format)
 * Returns null for short URLs (goo.gl / maps.app.goo.gl) since they require a redirect.
 */
export function parseGoogleMapsUrl(url: string): { latitude: number; longitude: number } | null {
  if (!url) return null;
  try {
    // Format: /@lat,lng,zoom — most common in share links
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
    }

    const parsed = new URL(url);

    // Format: ?q=lat,lng
    const q = parsed.searchParams.get("q");
    if (q) {
      const qMatch = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
      if (qMatch) {
        const lat = parseFloat(qMatch[1]);
        const lng = parseFloat(qMatch[2]);
        if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
      }
    }

    // Format: ?ll=lat,lng
    const ll = parsed.searchParams.get("ll");
    if (ll) {
      const llMatch = ll.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
      if (llMatch) {
        const lat = parseFloat(llMatch[1]);
        const lng = parseFloat(llMatch[2]);
        if (isValidLatLng(lat, lng)) return { latitude: lat, longitude: lng };
      }
    }
  } catch {
    // Invalid URL — ignore
  }
  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
