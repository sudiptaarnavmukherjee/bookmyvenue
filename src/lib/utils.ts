import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Attempts to extract lat/lng coordinates from Google/Ola Maps URLs.
 * Handles common share formats:
 *   /@lat,lng,zoom  (Google place / directions links)
 *   ?q=lat,lng      (Google/Ola query with coordinates)
 *   ?ll=lat,lng     (older Google format)
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

const MAPS_HOSTS = new Set([
  "maps.google.com",
  "www.google.com",
  "google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "maps.olacabs.com",
  "www.maps.olacabs.com",
]);

export function normalizeGoogleMapsUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    if (!MAPS_HOSTS.has(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
