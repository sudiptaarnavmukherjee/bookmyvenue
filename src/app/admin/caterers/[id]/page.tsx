"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, UtensilsCrossed, Loader2, Plus, Minus, Check,
  Save, IndianRupee, Users, Leaf, Drumstick, Tag, Search,
  RefreshCw, Pencil, Eye, ShieldCheck, Package, Info,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Category = {
  id: string;
  name: string;
  sortOrder: number;
  icon: string | null;
  items: { id: string; name: string; isVeg: boolean; isPopular: boolean }[];
};

type MenuPackage = {
  id: string;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  variant: string;
  name: string;
  description: string | null;
  pricePerPlate: number;
  itemCount: number;
  items: Record<string, string[]>;
};

type CatererInfo = {
  id: string;
  name: string;
  silverPrice: number | null;
  goldPrice: number | null;
  platinumPrice: number | null;
};

const TIER_CONFIG = {
  SILVER: { label: "Silver", limit: 50, color: "border-gray-300 bg-gray-50", badge: "bg-gray-200 text-gray-700", price_key: "silverPrice" },
  GOLD:   { label: "Gold",   limit: 60, color: "border-yellow-300 bg-yellow-50", badge: "bg-yellow-100 text-yellow-800", price_key: "goldPrice" },
  PLATINUM: { label: "Platinum", limit: 70, color: "border-purple-300 bg-purple-50", badge: "bg-purple-100 text-purple-800", price_key: "platinumPrice" },
} as const;

type TierKey = keyof typeof TIER_CONFIG;

// ─── Component ───────────────────────────────────────────────────────────────
export default function CatererDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: catererId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [caterer, setCaterer] = useState<CatererInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedPackages, setSavedPackages] = useState<MenuPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active tier being edited
  const [activeTier, setActiveTier] = useState<TierKey>("SILVER");

  // Selected items per tier: tier -> category name -> item names[]
  const [selection, setSelection] = useState<Record<TierKey, Record<string, string[]>>>({
    SILVER: {}, GOLD: {}, PLATINUM: {},
  });

  // Prices per tier
  const [prices, setPrices] = useState({ silver: "", gold: "", platinum: "" });

  // Package names & descriptions  
  const [pkgMeta, setPkgMeta] = useState<Record<TierKey, { name: string; description: string }>>({
    SILVER: { name: "Silver Package", description: "Classic Bengali spread — 50 items" },
    GOLD:   { name: "Gold Package",   description: "Premium Bengali feast — 60 items" },
    PLATINUM: { name: "Platinum Package", description: "Royal Bengali banquet — 70 items" },
  });

  // Category filter / search
  const [catSearch, setCatSearch] = useState("");

  // Tag owner by email
  const [tagEmail, setTagEmail] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [tagMsg, setTagMsg] = useState("");

  // ── Auth ──
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") router.replace("/auth/signin");
  }, [session, status, router]);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/caterer/${catererId}/menu`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setCaterer(data.caterer);
    setCategories(data.categories);
    setSavedPackages(data.packages);

    // Populate existing prices
    if (data.caterer) {
      setPrices({
        silver: data.caterer.silverPrice?.toString() ?? "",
        gold: data.caterer.goldPrice?.toString() ?? "",
        platinum: data.caterer.platinumPrice?.toString() ?? "",
      });
    }

    // Populate existing package selections
    if (data.packages.length > 0) {
      const sel: Record<TierKey, Record<string, string[]>> = { SILVER: {}, GOLD: {}, PLATINUM: {} };
      const meta: Record<TierKey, { name: string; description: string }> = {
        SILVER: { name: "Silver Package", description: "Classic Bengali spread — 50 items" },
        GOLD:   { name: "Gold Package",   description: "Premium Bengali feast — 60 items" },
        PLATINUM: { name: "Platinum Package", description: "Royal Bengali banquet — 70 items" },
      };
      for (const pkg of data.packages) {
        const tier = pkg.tier as TierKey;
        if (tier in sel) {
          sel[tier] = typeof pkg.items === "object" && !Array.isArray(pkg.items) ? pkg.items : {};
          meta[tier] = { name: pkg.name, description: pkg.description ?? meta[tier].description };
        }
      }
      setSelection(sel);
      setPkgMeta(meta);
    }

    setLoading(false);
  }, [catererId]);

  useEffect(() => { if (session?.user.role === "ADMIN") loadData(); }, [session, loadData]);

  // ── Helpers ──
  function isSelected(tier: TierKey, catName: string, itemName: string): boolean {
    return (selection[tier][catName] ?? []).includes(itemName);
  }

  function toggleItem(tier: TierKey, catName: string, itemName: string) {
    const current = selection[tier][catName] ?? [];
    const newCat = current.includes(itemName)
      ? current.filter((n) => n !== itemName)
      : [...current, itemName];
    setSelection((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [catName]: newCat },
    }));
  }

  function selectAll(tier: TierKey, cat: Category) {
    const names = cat.items.map((i) => i.name);
    setSelection((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [cat.name]: names },
    }));
  }

  function clearAll(tier: TierKey, cat: Category) {
    setSelection((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [cat.name]: [] },
    }));
  }

  function countSelected(tier: TierKey): number {
    return Object.values(selection[tier]).reduce((s, arr) => s + arr.length, 0);
  }

  // ── Save all packages ──
  async function saveAll() {
    setSaving(true);
    const packages = (["SILVER", "GOLD", "PLATINUM"] as TierKey[]).map((tier) => ({
      tier,
      variant: "NON_VEG",
      name: pkgMeta[tier].name,
      description: pkgMeta[tier].description,
      pricePerPlate: tier === "SILVER" ? prices.silver : tier === "GOLD" ? prices.gold : prices.platinum,
      items: selection[tier],
    }));

    const res = await fetch(`/api/caterer/${catererId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages, prices }),
    });

    if (res.ok) {
      loadData();
      alert("✅ Menu saved successfully!");
    } else {
      const e = await res.json();
      alert("Failed: " + (e.error || "Unknown error"));
    }
    setSaving(false);
  }

  // ── Tag by email ──
  async function tagByEmail() {
    if (!tagEmail.trim()) return;
    setTagLoading(true);
    setTagMsg("");
    const res = await fetch(`/api/admin/caterers/${catererId}/tag-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tagEmail.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setTagMsg("✅ Caterer tagged & booking enabled!");
      setTagEmail("");
      loadData();
    } else {
      setTagMsg("❌ " + (data.error || "Failed to tag"));
    }
    setTagLoading(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
        <span className="text-gray-600">Loading menu builder…</span>
      </div>
    );
  }

  const filteredCategories = catSearch
    ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  const tierCount = countSelected(activeTier);
  const tierLimit = TIER_CONFIG[activeTier].limit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/caterers")} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <UtensilsCrossed className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{caterer?.name ?? "Caterer"} — Menu Builder</h1>
            <p className="text-sm text-gray-500">Build Silver (50) · Gold (60) · Platinum (70) item packages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/caterers/${catererId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
          >
            <Pencil className="h-4 w-4" /> Edit Details
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Menu
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Left: Tier selector + prices + tag ── */}
        <div className="xl:col-span-1 space-y-4">

          {/* Tier selector */}
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Packages</h2>
            {(["SILVER", "GOLD", "PLATINUM"] as TierKey[]).map((tier) => {
              const cfg = TIER_CONFIG[tier];
              const count = countSelected(tier);
              const pct = Math.min((count / cfg.limit) * 100, 100);
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    activeTier === tier ? cfg.color + " border-opacity-100 shadow-md" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    <span className={`text-xs font-mono ${count > cfg.limit ? "text-red-600 font-bold" : "text-gray-500"}`}>
                      {count}/{cfg.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${count > cfg.limit ? "bg-red-500" : "bg-purple-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 truncate">{pkgMeta[tier].name}</p>
                </button>
              );
            })}

            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              You can exceed limits — but Silver=50, Gold=60, Platinum=70 is the standard.
            </p>
          </div>

          {/* Prices */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Prices / Plate</h2>
            {(["silver", "gold", "platinum"] as const).map((t) => (
              <div key={t}>
                <label className="block text-xs text-gray-500 mb-1 capitalize">{t}</label>
                <div className="flex items-center gap-1 border rounded-lg px-3 py-2">
                  <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="number"
                    value={prices[t]}
                    onChange={(e) => setPrices((p) => ({ ...p, [t]: e.target.value }))}
                    placeholder="0"
                    className="flex-1 outline-none text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Package meta */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{activeTier} Package Info</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Package Name</label>
              <input
                value={pkgMeta[activeTier].name}
                onChange={(e) => setPkgMeta((m) => ({ ...m, [activeTier]: { ...m[activeTier], name: e.target.value } }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea
                value={pkgMeta[activeTier].description}
                onChange={(e) => setPkgMeta((m) => ({ ...m, [activeTier]: { ...m[activeTier], description: e.target.value } }))}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          {/* Tag by email */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tag to Owner
            </h2>
            <input
              type="email"
              placeholder="owner@email.com"
              value={tagEmail}
              onChange={(e) => setTagEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tagByEmail()}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={tagByEmail}
              disabled={tagLoading || !tagEmail}
              className="w-full rounded-lg bg-purple-600 text-white py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {tagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              Tag & Enable Booking
            </button>
            {tagMsg && <p className="text-sm text-center">{tagMsg}</p>}
          </div>

          {/* Saved packages summary */}
          {savedPackages.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Saved Packages</h2>
              <div className="space-y-2">
                {savedPackages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{pkg.name}</span>
                    <span className="text-gray-500">{pkg.itemCount} items · ₹{pkg.pricePerPlate}/plate</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Menu item grid ── */}
        <div className="xl:col-span-3 space-y-4">
          {/* Counter bar */}
          <div className={`rounded-xl border-2 px-5 py-3 flex items-center justify-between ${TIER_CONFIG[activeTier].color}`}>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="font-bold text-gray-800">{TIER_CONFIG[activeTier].label} Package</span>
              <span className={`text-sm font-mono font-bold ${tierCount > tierLimit ? "text-red-600" : "text-purple-700"}`}>
                {tierCount} / {tierLimit} items selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-40 h-2 bg-white/60 rounded-full overflow-hidden border">
                <div
                  className={`h-full transition-all rounded-full ${tierCount > tierLimit ? "bg-red-500" : "bg-purple-500"}`}
                  style={{ width: `${Math.min((tierCount / tierLimit) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{Math.round((tierCount / tierLimit) * 100)}%</span>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border px-4 py-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              placeholder="Search categories…"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>

          {/* Category blocks */}
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const selectedInCat = (selection[activeTier][cat.name] ?? []).length;
              return (
                <div key={cat.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon ?? "🍽️"}</span>
                      <span className="font-semibold text-gray-800">{cat.name}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {selectedInCat}/{cat.items.length} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAll(activeTier, cat)}
                        className="text-xs px-3 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium"
                      >
                        All
                      </button>
                      <button
                        onClick={() => clearAll(activeTier, cat)}
                        className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Items grid */}
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cat.items.map((item) => {
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
                              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">⭐ Popular</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
