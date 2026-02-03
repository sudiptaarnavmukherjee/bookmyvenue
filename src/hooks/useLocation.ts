"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentLocation, type Coordinates, KOLKATA_CENTER } from "@/lib/ola-maps";

interface UseLocationResult {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isPermissionDenied: boolean;
}

/**
 * React hook for getting user's current location
 * Falls back to Kolkata center if permission denied or unavailable
 */
export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we have cached location (less than 5 mins old)
      const cached = localStorage.getItem("userLocation");
      if (cached) {
        const { coords, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 5 * 60 * 1000) { // 5 minutes
          setLocation(coords);
          setLoading(false);
          return;
        }
      }

      const coords = await getCurrentLocation();
      
      if (coords) {
        setLocation(coords);
        // Cache the location
        localStorage.setItem("userLocation", JSON.stringify({
          coords,
          timestamp: Date.now(),
        }));
      } else {
        // Fallback to Kolkata center
        setLocation(KOLKATA_CENTER);
        setIsPermissionDenied(true);
      }
    } catch (err: any) {
      console.error("Location error:", err);
      setError(err.message || "Failed to get location");
      setLocation(KOLKATA_CENTER); // Fallback
      setIsPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    refresh: fetchLocation,
    isPermissionDenied,
  };
}

/**
 * Hook for fetching nearby venues/caterers
 */
export function useNearby(type: "venues" | "caterers" = "venues", limit = 10) {
  const { location, loading: locationLoading } = useLocation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationLoading || !location) return;

    const fetchNearby = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          lat: location.lat.toString(),
          lng: location.lng.toString(),
          type,
          limit: limit.toString(),
        });

        const res = await fetch(`/api/nearby?${params}`);
        
        if (!res.ok) throw new Error("Failed to fetch nearby");
        
        const result = await res.json();
        setData(type === "venues" ? result.venues : result.caterers);
      } catch (err: any) {
        console.error("Nearby fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [location, locationLoading, type, limit]);

  return {
    data,
    loading: loading || locationLoading,
    error,
    userLocation: location,
  };
}
