"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, UtensilsCrossed, Loader2, Check, IndianRupee,
  Users, Leaf, Drumstick, Send, ShoppingCart, Info, Star,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type MenuItem = {
  id: string;
  name: string;
  isVeg: boolean;
  isPopular: boolean;
};

type Category = {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  items: MenuItem[];
};

type SavedPackage = {
  id: string;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  name: string;
  description: string | null;
  pricePerPlate: number;
  itemCount: number;
  items: Record<string, string[]>;
};

type CatererInfo = {
  id: string;
  name: string;
  city: string;
  area: string;
  silverPrice: number | null;
  goldPrice: number | null;
  platinumPrice: number | null;
};

const TIER_CONFIG = {
  SILVER:   { label: "Silver",   emoji: "🥈", badge: "bg-gray-100 text-gray-700",     ring: "ring-gray-400" },
  GOLD:     { label: "Gold",     emoji: "🥇", badge: "bg-yellow-100 text-yellow-800", ring: "ring-yellow-400" },
  PLATINUM: { label: "Platinum", emoji: "💜", badge: "bg-purple-100 text-purple-800", ring: "ring-purple-500" },
} as const;

type TierKey = keyof typeof TIER_CONFIG;

// ─── Component ───────────────────────────────────────────────────────────────
export default function MenuCustomizerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: catererId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [caterer, setCaterer] = useState<CatererInfo | null>(null);
  const [packages, setPackages] = useState<SavedPackage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's selections state — persists per tier while they switch tabs
  const [activeTier, setActiveTier] = useState<TierKey>("SILVER");
  const [userSelection, setUserSelection] = useState<Record<TierKey, Record<string, string[]>>>({
    SILVER: {}, GOLD: {}, PLATINUM: {},
  });
  const [guestCount, setGuestCount] = useState(100);

  // Submit inquiry state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch data ──
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/caterer/${catererId}/menu`);
      if (!res.ok) {
        setError("Could not load menu.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCaterer(data.caterer);
      setCategories(data.categories || []);
      setPackages(data.packages || []);

      // Pre-populate user selections from the saved packages (show ALL items as default selected)
      if (data.packages?.length > 0) {
        const sel: Record<TierKey, Record<string, string[]>> = { SILVER: {}, GOLD: {}, PLATINUM: {} };
        for (const pkg of data.packages as SavedPackage[]) {
          const tier = pkg.tier as TierKey;
          if (tier in sel && pkg.items && typeof pkg.items === "object") {
            sel[tier] = pkg.items as Record<string, string[]>;
          }
        }
        setUserSelection(sel);

        // Set active tier to first available package
        const tiers: TierKey[] = ["SILVER", "GOLD", "PLATINUM"];
        const firstTier = tiers.find((t) => data.packages.some((p: SavedPackage) => p.tier === t));
        if (firstTier) setActiveTier(firstTier);
      }

      setLoading(false);
    }
    fetchData();
  }, [catererId]);

  // ── Helpers ──
  function isSelected(tier: TierKey, catName: string, itemName: string): boolean {
    return (userSelection[tier][catName] ?? []).includes(itemName);
  }

  function toggleItem(tier: TierKey, catName: string, itemName: string) {
    const current = userSelection[tier][catName] ?? [];
    const updated = current.includes(itemName)
      ? current.filter((n) => n !== itemName)
      : [...current, itemName];
    setUserSelection((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [catName]: updated },
    }));
  }

  function countSelected(tier: TierKey): number {
    return Object.values(userSelection[tier]).reduce((s, arr) => s + arr.length, 0);
  }

  // ── Active package ──
  const activePackage = packages.find((p) => p.tier === activeTier) ?? null;

  // ── Live price calculation ──
  const livePrice = useMemo(() => {
    if (!activePackage || !guestCount || guestCount < 1) return 0;
    return activePackage.pricePerPlate * guestCount;
  }, [activePackage, guestCount]);

  // ── Categories shown: only those that have items in this tier's package ──
  const tierCategories = useMemo(() => {
    if (!activePackage?.items || !categories.length) return categories;
    const includedCatNames = Object.keys(activePackage.items).filter(
      (k) => (activePackage.items[k] ?? []).length > 0
    );
    if (includedCatNames.length === 0) return categories;
    return categories.filter((c) => includedCatNames.includes(c.name));
  }, [activePackage, categories]);

  // ── Submit inquiry ──
  async function handleSubmit() {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/catering/${catererId}/customize`);
      return;
    }
    if (!activePackage) return;

    setSubmitting(true);
    const selectedItems = userSelection[activeTier];
    const itemSummary = Object.entries(selectedItems)
      .filter(([, items]) => items.length > 0)
      .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
      .join("\n");

    const message = `Custom menu preference for ${TIER_CONFIG[activeTier].label} package (${guestCount} guests):\n\n${itemSummary}`;

    const res = await fetch("/api/bookings/catering-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catererId,
        tier: activeTier,
        guests: guestCount,
        message,
        pricePerPlate: activePackage.pricePerPlate,
        totalAmount: livePrice,
        menuPackage: TIER_CONFIG[activeTier].label,
        selectedItems,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json();
      alert(d.error || "Failed to submit inquiry. Please try again.");
    }
  }

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
        <span className="text-gray-600">Loading menu…</span>
      </div>
    );
  }

  if (error || !caterer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-sm">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error || "Caterer not found."}</p>
          <Link href={`/catering/${catererId}`} className="text-purple-600 font-semibold hover:underline">
            ← Back to caterer page
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm max-w-md">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Sent!</h2>
          <p className="text-gray-500 mb-6">
            Your custom menu preference has been submitted to <strong>{caterer.name}</strong>. They will reach out to confirm the details.
          </p>
          <div className="space-y-3">
            <Link
              href="/bookings"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-center hover:opacity-90"
            >
              View My Bookings
            </Link>
            <Link
              href={`/catering/${catererId}`}
              className="block w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-center hover:bg-gray-50"
            >
              Back to Caterer Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableTiers = (["SILVER", "GOLD", "PLATINUM"] as TierKey[]).filter((t) =>
    packages.some((p) => p.tier === t)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/catering/${catererId}`} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <UtensilsCrossed className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{caterer.name} — Customize Menu</h1>
            <p className="text-sm text-gray-500">{caterer.area}, {caterer.city}</p>
          </div>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Menu not yet configured</h2>
          <p className="text-gray-500 mb-6">
            The caterer hasn&apos;t built their menu yet. Please check back later or use the contact option.
          </p>
          <Link
            href={`/catering/${catererId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Tier picker + live quote ── */}
          <div className="xl:col-span-1 space-y-4">

            {/* Tier selector */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Choose Package
              </h2>
              <div className="space-y-2">
                {availableTiers.map((tier) => {
                  const pkg = packages.find((p) => p.tier === tier)!;
                  const cfg = TIER_CONFIG[tier];
                  const isActive = activeTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                        isActive
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 font-semibold text-gray-800">
                          <span>{cfg.emoji}</span> {cfg.label}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {pkg.itemCount} items
                        </span>
                      </div>
                      <p className="text-lg font-bold text-purple-700">
                        ₹{pkg.pricePerPlate.toLocaleString("en-IN")}<span className="text-sm font-normal text-gray-400">/plate</span>
                      </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guest count */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Guest Count
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuestCount((g) => Math.max(10, g - 10))}
                  className="h-9 w-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="flex-1 text-center text-xl font-bold border-2 rounded-xl py-2 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={() => setGuestCount((g) => g + 10)}
                  className="h-9 w-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Live price quote */}
            {activePackage && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 opacity-80" />
                  <span className="text-sm font-semibold opacity-90">Live Price Quote</span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold">₹{livePrice.toLocaleString("en-IN")}</p>
                  <p className="text-sm opacity-80 mt-0.5">
                    {guestCount} guests × ₹{activePackage.pricePerPlate}/plate
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/20 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-80">Package</span>
                    <span className="font-semibold">{TIER_CONFIG[activeTier].label} ({countSelected(activeTier)} items)</span>
                  </div>
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-xs opacity-70">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  Final price confirmed by caterer after inquiry
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !activePackage || guestCount < 10}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {session?.user ? "Send Inquiry" : "Sign in to Send Inquiry"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Your selected items will be shared with {caterer.name}
            </p>
          </div>

          {/* ── Right: Menu items ── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Header for active tier */}
            {activePackage && (
              <div className="bg-white rounded-xl border px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TIER_CONFIG[activeTier].emoji}</span>
                  <div>
                    <h2 className="font-bold text-gray-900">{activePackage.name}</h2>
                    <p className="text-sm text-gray-500">
                      Select your preferred items · {countSelected(activeTier)} of {activePackage.itemCount} selected
                    </p>
                  </div>
                </div>
                <div className={`h-2 w-24 bg-gray-100 rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min((countSelected(activeTier) / (activePackage.itemCount || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Category + items */}
            {tierCategories.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center">
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No items in this package yet.</p>
              </div>
            ) : (
              tierCategories.map((cat) => {
                // Only show items that are part of this package
                const packageItems = activePackage?.items[cat.name] ?? [];
                const catItems = cat.items.filter((i) => packageItems.includes(i.name));
                if (catItems.length === 0) return null;
                const selectedCount = (userSelection[activeTier][cat.name] ?? []).length;

                return (
                  <div key={cat.id} className="bg-white rounded-xl border overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon ?? "🍽️"}</span>
                        <span className="font-semibold text-gray-800">{cat.name}</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {selectedCount}/{catItems.length}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const names = catItems.map((i) => i.name);
                            setUserSelection((prev) => ({
                              ...prev,
                              [activeTier]: { ...prev[activeTier], [cat.name]: names },
                            }));
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium"
                        >
                          All
                        </button>
                        <button
                          onClick={() =>
                            setUserSelection((prev) => ({
                              ...prev,
                              [activeTier]: { ...prev[activeTier], [cat.name]: [] },
                            }))
                          }
                          className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {catItems.map((item) => {
                        const selected = isSelected(activeTier, cat.name, item.name);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(activeTier, cat.name, item.name)}
                            className={`relative flex flex-col items-start gap-1 rounded-xl border-2 px-3 py-2.5 text-left transition-all text-sm ${
                              selected
                                ? "border-purple-500 bg-purple-50 shadow-sm"
                                : "border-gray-100 bg-white hover:border-gray-300"
                            }`}
                          >
                            {selected && (
                              <span className="absolute top-1.5 right-1.5 bg-purple-600 rounded-full p-0.5">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                            <span className="font-medium text-gray-800 leading-snug pr-4">{item.name}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.isVeg ? (
                                <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                  <Leaf className="h-2.5 w-2.5" /> Veg
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                  <Drumstick className="h-2.5 w-2.5" /> Non-Veg
                                </span>
                              )}
                              {item.isPopular && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  <Star className="h-2.5 w-2.5" /> Popular
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
