"use client";

import { useState } from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

interface MapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  address?: string | null;
  name: string;
  /** Height of the map embed in pixels. Defaults to 280 */
  height?: number;
}

// Validate that a string is a safe maps URL to prevent open redirect
function isSafeGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "maps.google.com" ||
        parsed.hostname === "www.google.com" ||
        parsed.hostname === "maps.app.goo.gl" ||
        parsed.hostname === "goo.gl")
    );
  } catch {
    return false;
  }
}

/**
 * Convert a Google Maps share URL to an embed-friendly URL.
 * e.g. "https://maps.app.goo.gl/xxx" → use with lat/lng instead
 * e.g. "https://www.google.com/maps/place/..." → extract coords if possible
 */
function buildGoogleMapsEmbedUrl(url: string): string | null {
  // If it's a full Google Maps URL with coordinates in the @lat,lng pattern
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
  }
  // For shortened URLs or place links, just use a search embed
  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
  }
  return null;
}

/**
 * Build OpenStreetMap embed URL for lat/lng.
 * Uses a ~0.5km bounding box.
 */
function buildOSMEmbedUrl(lat: number, lng: number): string {
  const delta = 0.005; // ~500m
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}` +
    `&layer=mapnik&marker=${lat},${lng}`
  );
}

/**
 * Build Ola Maps static tile URL (requires NEXT_PUBLIC_OLA_MAPS_API_KEY)
 */
function buildOlaMapsStaticUrl(lat: number, lng: number): string | null {
  const key = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;
  if (!key) return null;
  const zoom = 15;
  const w = 800;
  const h = 400;
  return `https://api.olamaps.io/tiles/v1/static/${lng},${lat},${zoom}/${w}x${h}.png?api_key=${key}&markers=color:red|${lat},${lng}`;
}

/**
 * Build directions URL for "Get Directions" button.
 * Prefers Google Maps with coordinates, falls back to address search.
 */
function buildDirectionsUrl(
  lat?: number | null,
  lng?: number | null,
  address?: string | null,
  name?: string
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const query = [name, address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function MapEmbed({
  latitude,
  longitude,
  googleMapsUrl,
  address,
  name,
  height = 280,
}: MapEmbedProps) {
  const [embedError, setEmbedError] = useState(false);

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const hasGoogleUrl = googleMapsUrl && isSafeGoogleMapsUrl(googleMapsUrl);

  // Pick the best embed source
  let embedSrc: string | null = null;
  let embedType: "ola" | "osm" | "google" | null = null;

  if (hasCoords) {
    const olaUrl = buildOlaMapsStaticUrl(latitude!, longitude!);
    if (olaUrl) {
      embedSrc = olaUrl;
      embedType = "ola";
    } else {
      embedSrc = buildOSMEmbedUrl(latitude!, longitude!);
      embedType = "osm";
    }
  } else if (hasGoogleUrl) {
    const gmbedUrl = buildGoogleMapsEmbedUrl(googleMapsUrl!);
    if (gmbedUrl) {
      embedSrc = gmbedUrl;
      embedType = "google";
    }
  }

  const directionsUrl = buildDirectionsUrl(latitude, longitude, address, name);

  const fullAddress = address || name;

  if (!embedSrc || embedError) {
    // Fallback — address + directions button only (no iframe)
    return (
      <div className="rounded-2xl bg-purple-50 border border-purple-100 p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-xl flex-shrink-0">
            <MapPin className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{fullAddress}</p>
          </div>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Get Directions
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Map render */}
      {embedType === "ola" ? (
        // Ola Maps returns a static PNG image
        <div className="relative" style={{ height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={embedSrc}
            alt={`Map showing location of ${name}`}
            className="w-full h-full object-cover"
            onError={() => setEmbedError(true)}
          />
          {/* Marker label overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md max-w-[calc(100%-1.5rem)]">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-800 truncate">{name}</span>
            </div>
          </div>
        </div>
      ) : (
        // OSM or Google Maps iframe
        <iframe
          src={embedSrc}
          width="100%"
          height={height}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${name}`}
          className="block border-0"
          onError={() => setEmbedError(true)}
        />
      )}

      {/* Footer bar */}
      <div className="bg-white px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <p className="text-xs text-gray-600 truncate">{fullAddress}</p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 whitespace-nowrap transition-colors flex-shrink-0"
        >
          <Navigation className="h-3.5 w-3.5" />
          Get Directions
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
