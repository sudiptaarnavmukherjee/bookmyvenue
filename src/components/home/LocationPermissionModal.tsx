"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
import { searchPlaces, getPlaceDetails, geocodeAddress, getAreaCoordinates, type PlaceResult } from "@/lib/ola-maps";

// ── Shared location storage ──────────────────────────────────────────────────
const STORAGE_KEY = "bmv_location";
const LOCATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredLocation {
  lat: number;
  lng: number;
  label: string;
  ts: number;
}

export function storeBmvLocation(lat: number, lng: number, label: string): void {
  try {
    const data: StoredLocation = { lat, lng, label, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("bmv:locationUpdated", { detail: { lat, lng, label } })
    );
  } catch {}
}

export function getBmvLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredLocation = JSON.parse(raw);
    if (Date.now() - data.ts > LOCATION_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Quick-select Kolkata areas (fallback when Ola Maps unavailable) ──────────
const QUICK_AREAS = [
  { label: "Salt Lake",    lat: 22.5806, lng: 88.4187 },
  { label: "New Town",     lat: 22.5978, lng: 88.4832 },
  { label: "Rajarhat",     lat: 22.6370, lng: 88.4953 },
  { label: "Howrah",       lat: 22.5958, lng: 88.2636 },
  { label: "Barasat",      lat: 22.7255, lng: 88.4769 },
  { label: "Tollygunge",   lat: 22.4997, lng: 88.3467 },
  { label: "Park Street",  lat: 22.5518, lng: 88.3598 },
  { label: "Jadavpur",     lat: 22.4977, lng: 88.3697 },
  { label: "Dum Dum",      lat: 22.6293, lng: 88.4301 },
  { label: "Behala",       lat: 22.4971, lng: 88.3063 },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onLocationSet: (lat: number, lng: number, label: string) => void;
  onDismiss: () => void;
}

type Step = "ask" | "locating" | "manual";

// ── Component ────────────────────────────────────────────────────────────────
export default function LocationPermissionModal({ onLocationSet, onDismiss }: Props) {
  const [step, setStep]       = useState<Step>("ask");
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const debounceRef           = useRef<NodeJS.Timeout | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "manual") setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── GPS ──────────────────────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setStep("manual");
      setError("GPS not supported — please type your area below");
      return;
    }
    setStep("locating");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        storeBmvLocation(lat, lng, "Current Location");
        onLocationSet(lat, lng, "Current Location");
      },
      (err) => {
        setStep("manual");
        setError(
          err.code === 1
            ? "Location access denied — please type your area or pick one below"
            : "Could not detect location — please type your area"
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [onLocationSet]);

  // ── Manual search with Ola Maps autocomplete ─────────────────────────────
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Try with "Kolkata" bias first, fallback to raw query
        const places = await searchPlaces(val + ", Kolkata, West Bengal");
        setResults(places.length > 0 ? places.slice(0, 6) : (await searchPlaces(val)).slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleSelectPlace = useCallback(async (place: PlaceResult) => {
    let { lat, lng } = place.coordinates;
    const label = place.name || place.address;

    // 1. Try place details API for precise coords
    if ((lat === 0 || lng === 0) && place.placeId) {
      const details = await getPlaceDetails(place.placeId);
      if (details) { lat = details.coordinates.lat; lng = details.coordinates.lng; }
    }

    // 2. Fallback: geocode the address text
    if ((lat === 0 || lng === 0) && (place.address || place.name)) {
      const geocoded = await geocodeAddress(place.address || place.name);
      if (geocoded) { lat = geocoded.lat; lng = geocoded.lng; }
    }

    // 3. Last resort: fuzzy match against known Kolkata areas
    if (lat === 0 || lng === 0) {
      const areaCoords = getAreaCoordinates(label);
      if (areaCoords) { lat = areaCoords.lat; lng = areaCoords.lng; }
    }

    storeBmvLocation(lat, lng, label);
    onLocationSet(lat, lng, label);
  }, [onLocationSet]);

  const handleQuickArea = useCallback((area: { label: string; lat: number; lng: number }) => {
    storeBmvLocation(area.lat, area.lng, area.label);
    onLocationSet(area.lat, area.lng, area.label);
  }, [onLocationSet]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Set your location"
    >
      {/* Backdrop — not shown while GPS is running */}
      {step !== "locating" && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onDismiss}
        />
      )}

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4.5 h-4.5 text-purple-600" aria-hidden />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">Find Near You</h2>
              <p className="text-[11px] text-gray-400 leading-tight">Venues &amp; caterers within 10 km</p>
            </div>
          </div>
          {step !== "locating" && (
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 pb-6 pt-4">

          {/* ── Step: ask ─────────────────────────────────────────────── */}
          {step === "ask" && (
            <>
              <button
                onClick={handleGPS}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl transition-colors mb-3"
              >
                <Navigation className="w-4 h-4" />
                Use My Current Location
              </button>

              <button
                onClick={() => setStep("manual")}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors mb-4"
              >
                <Search className="w-4 h-4 text-gray-400" />
                Type My Area
              </button>

              <button
                onClick={onDismiss}
                className="w-full text-center text-gray-400 text-xs hover:text-gray-600 transition-colors"
              >
                Skip for now
              </button>
            </>
          )}

          {/* ── Step: locating ────────────────────────────────────────── */}
          {step === "locating" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-9 h-9 text-purple-600 animate-spin" />
              <p className="text-gray-600 text-sm font-medium">Getting your location…</p>
              <p className="text-gray-400 text-xs text-center">Please allow location access in your browser</p>
            </div>
          )}

          {/* ── Step: manual ──────────────────────────────────────────── */}
          {step === "manual" && (
            <>
              {error && (
                <p className="text-orange-700 text-xs mb-3 bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Search input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search area, landmark, pincode…"
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  autoComplete="off"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Ola Maps autocomplete results */}
              {results.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm">
                  {results.map((place) => (
                    <button
                      key={place.placeId}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-purple-50 text-left border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate leading-tight">{place.name}</p>
                        <p className="text-xs text-gray-400 truncate">{place.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Fallback quick area chips */}
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Popular Areas
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_AREAS.map((area) => (
                  <button
                    key={area.label}
                    onClick={() => handleQuickArea(area)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 text-xs rounded-full font-medium transition-colors"
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
