"use client";

import { Building2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "venues" | "catering";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => onChange("venues")}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all text-sm",
          mode === "venues"
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <Building2 className="h-4 w-4" />
        <span>Venues</span>
      </button>
      <button
        onClick={() => onChange("catering")}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all text-sm",
          mode === "catering"
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <UtensilsCrossed className="h-4 w-4" />
        <span>Catering</span>
      </button>
    </div>
  );
}
