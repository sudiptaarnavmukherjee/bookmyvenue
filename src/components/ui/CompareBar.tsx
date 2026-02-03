"use client";

import { useCompare } from "@/components/providers/CompareProvider";
import { useRouter, usePathname } from "next/navigation";
import { X, ArrowRight, Trash2 } from "lucide-react";

export function CompareBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { venueItems, catererItems, removeVenue, removeCaterer, clearVenues, clearCaterers } = useCompare();

  // Determine which items to show based on current page
  const isVenuePage = pathname?.startsWith("/venues");
  const isCateringPage = pathname?.startsWith("/catering");
  
  const items = isVenuePage ? venueItems : isCateringPage ? catererItems : [];
  const clearItems = isVenuePage ? clearVenues : clearCaterers;
  const removeItem = isVenuePage ? removeVenue : removeCaterer;
  const comparePath = isVenuePage ? "/venues/compare" : "/catering/compare";
  const itemType = isVenuePage ? "venues" : "caterers";

  if (items.length === 0) return null;

  const handleCompare = () => {
    const ids = items.map(i => i.id).join(",");
    router.push(`${comparePath}?ids=${ids}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Selected Items */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-sm font-medium text-gray-600">
              Compare {items.length} {itemType}:
            </span>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full"
              >
                <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                  {item.name}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={clearItems}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={handleCompare}
              disabled={items.length < 2}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {items.length < 2 && (
          <p className="text-xs text-gray-500 mt-2">
            Select at least 2 {itemType} to compare
          </p>
        )}
      </div>
    </div>
  );
}
