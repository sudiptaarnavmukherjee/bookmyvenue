"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Search, Loader2, X, Navigation, Check } from "lucide-react";
import { searchPlaces, geocodeAddress, getCurrentLocation, type Coordinates, type PlaceResult } from "@/lib/ola-maps";

interface LocationPickerProps {
  value?: {
    address: string;
    area?: string;
    city?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  onChange: (location: {
    address: string;
    area: string;
    city: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  placeholder?: string;
}

export default function LocationPicker({ value, onChange, placeholder = "Search for location..." }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    area: string;
    city: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  } | null>(value ? {
    address: value.address,
    area: value.area || "",
    city: value.city || "Kolkata",
    pincode: value.pincode || "",
    latitude: value.latitude || null,
    longitude: value.longitude || null,
  } : null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search places with debounce
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const places = await searchPlaces(searchQuery, { lat: 22.5726, lng: 88.3639 }); // Near Kolkata
      setResults(places);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedLocation(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Parse address to extract area, city, pincode
  const parseAddress = (address: string): { area: string; city: string; pincode: string } => {
    const parts = address.split(",").map(p => p.trim());
    let area = "";
    let city = "Kolkata";
    let pincode = "";

    // Extract pincode (6 digit number)
    const pincodeMatch = address.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      pincode = pincodeMatch[0];
    }

    // Common Kolkata areas
    const kolkataAreas = [
      "Barasat", "Kalyani", "Salt Lake", "New Town", "Madhyamgram",
      "Rajarhat", "Howrah", "Barrackpore", "Dum Dum", "Tollygunge",
      "Gariahat", "Ballygunge", "Park Street", "Alipore", "Jadavpur",
      "Behala", "Kasba", "Garia", "Narendrapur", "Sonarpur",
      "Baruipur", "Sealdah", "Esplanade", "Shyambazar", "Ultadanga",
      "Lake Town", "Kankurgachi", "Phoolbagan", "Entally", "Park Circus"
    ];

    // Find area match
    for (const knownArea of kolkataAreas) {
      if (address.toLowerCase().includes(knownArea.toLowerCase())) {
        area = knownArea;
        break;
      }
    }

    // If no known area found, use first meaningful part
    if (!area && parts.length > 0) {
      area = parts[0];
    }

    // Check for Kolkata/Calcutta in address
    if (address.toLowerCase().includes("kolkata") || address.toLowerCase().includes("calcutta")) {
      city = "Kolkata";
    } else if (address.toLowerCase().includes("howrah")) {
      city = "Howrah";
    }

    return { area, city, pincode };
  };

  // Select a place from results
  const handleSelectPlace = async (place: PlaceResult) => {
    setQuery(place.address);
    setShowDropdown(false);
    setLoading(true);

    try {
      // Get coordinates if not available
      let coords = place.coordinates;
      if (!coords || (coords.lat === 0 && coords.lng === 0)) {
        const geocoded = await geocodeAddress(place.address);
        if (geocoded) {
          coords = geocoded;
        }
      }

      const parsed = parseAddress(place.address);
      const location = {
        address: place.address,
        area: parsed.area,
        city: parsed.city,
        pincode: parsed.pincode,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
      };

      setSelectedLocation(location);
      onChange(location);
    } catch (error) {
      console.error("Error selecting place:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use current location
  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        // Reverse geocode to get address
        const response = await fetch(
          `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${coords.lat},${coords.lng}&api_key=${process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            const parsed = parseAddress(address);
            
            const location = {
              address,
              area: parsed.area,
              city: parsed.city,
              pincode: parsed.pincode,
              latitude: coords.lat,
              longitude: coords.lng,
            };

            setQuery(address);
            setSelectedLocation(location);
            onChange(location);
          }
        }
      }
    } catch (error) {
      console.error("Current location error:", error);
      alert("Could not get your current location. Please search manually.");
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setQuery("");
    setSelectedLocation(null);
    setResults([]);
    onChange({
      address: "",
      area: "",
      city: "Kolkata",
      pincode: "",
      latitude: null,
      longitude: null,
    });
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <MapPin className="inline w-4 h-4 mr-1" />
        Location (Search on Map)
      </label>
      
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                selectedLocation ? "border-green-500 bg-green-50" : "border-gray-300"
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            title="Use current location"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Dropdown Results */}
        {showDropdown && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
          >
            {results.map((place, index) => (
              <button
                key={place.placeId || index}
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-start gap-3 border-b last:border-0"
              >
                <MapPin className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{place.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">{place.address}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && !showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && selectedLocation.latitude && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
            <Check className="w-4 h-4" />
            Location captured successfully
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="text-gray-400">Area:</span> {selectedLocation.area || "N/A"}
            </div>
            <div>
              <span className="text-gray-400">City:</span> {selectedLocation.city}
            </div>
            <div>
              <span className="text-gray-400">Pincode:</span> {selectedLocation.pincode || "N/A"}
            </div>
            <div>
              <span className="text-gray-400">Coordinates:</span> {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Info */}
      <p className="mt-2 text-xs text-gray-500">
        Search and select a location from the dropdown, or use your current location. This helps customers find venues near them.
      </p>
    </div>
  );
}
