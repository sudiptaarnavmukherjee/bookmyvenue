"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Leaf,
  Drumstick,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  icon: string | null;
  _count: { items: number };
}

interface MenuItemTemplate {
  id: string;
  name: string;
  isVeg: boolean;
  isPopular: boolean;
  sortOrder: number;
  categoryId: string;
  category: { name: string; icon: string | null };
}

interface MenuTemplate {
  id: string;
  tier: string;
  variant: string;
  name: string;
  description: string | null;
  pricePerPlate: number;
  itemCount: number;
  items: Record<string, string[]>;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MenuBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItemTemplate[]>([]);
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Add-item form
  const [selCategoryId, setSelCategoryId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemPopular, setNewItemPopular] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Expanded category
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Selected category for item filtering
  const [filterCat, setFilterCat] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"categories" | "items" | "templates">("categories");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catRes, itemRes, tplRes] = await Promise.all([
      fetch("/api/admin/menu-categories"),
      fetch("/api/admin/menu-items"),
      fetch("/api/admin/menu-templates"),
    ]);
    const [cats, itms, tpls] = await Promise.all([
      catRes.json(),
      itemRes.json(),
      tplRes.json(),
    ]);
    setCategories(cats);
    setItems(itms);
    setTemplates(tpls);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.user.role === "ADMIN") loadData();
  }, [session, loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const res = await fetch("/api/admin/menu-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName.trim(),
        icon: newCatIcon.trim() || undefined,
        sortOrder: categories.length,
      }),
    });
    if (res.ok) {
      setNewCatName("");
      setNewCatIcon("");
      await loadData();
    }
    setAddingCat(false);
  }

  async function addItem() {
    if (!newItemName.trim() || !selCategoryId) return;
    setAddingItem(true);
    const res = await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItemName.trim(),
        categoryId: selCategoryId,
        isVeg: newItemVeg,
        isPopular: newItemPopular,
      }),
    });
    if (res.ok) {
      setNewItemName("");
      setNewItemPopular(false);
      await loadData();
    }
    setAddingItem(false);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/menu-items?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-purple-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading menu builder…</span>
      </div>
    );
  }

  const filteredItems = filterCat
    ? items.filter((i) => i.categoryId === filterCat)
    : items;

  const TIER_COLORS: Record<string, string> = {
    SILVER: "bg-gray-100 text-gray-700 border-gray-300",
    GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
    PLATINUM: "bg-purple-100 text-purple-800 border-purple-300",
  };
  const VARIANT_ICONS: Record<string, React.ReactNode> = {
    NON_VEG: <Drumstick className="h-3.5 w-3.5 text-red-500" />,
    VEG: <Leaf className="h-3.5 w-3.5 text-green-600" />,
    JAIN: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <UtensilsCrossed className="h-6 w-6 text-purple-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Menu Builder</h1>
          <p className="text-sm text-gray-500">
            Manage Bengali dish library &amp; global menu templates
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-6">
        {(["categories", "items", "templates"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === t
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "categories"
              ? `Categories (${categories.length})`
              : t === "items"
              ? `Dish Library (${items.length})`
              : `Templates (${templates.length})`}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <>
            {/* Add category form */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Add Category</h2>
              <div className="flex gap-3 flex-wrap">
                <input
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Icon (emoji) e.g. 🥗"
                  className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={addCategory}
                  disabled={addingCat || !newCatName.trim()}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Category list */}
            <div className="bg-white rounded-xl border divide-y">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() =>
                      setExpandedCat(expandedCat === cat.id ? null : cat.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon || "🍽️"}</span>
                      <span className="font-medium text-gray-800">{cat.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {cat._count.items} items
                      </span>
                    </div>
                    {expandedCat === cat.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {expandedCat === cat.id && (
                    <ul className="mt-3 ml-9 space-y-1">
                      {items
                        .filter((i) => i.categoryId === cat.id)
                        .map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  item.isVeg ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              <span className="text-gray-700">{item.name}</span>
                              {item.isPopular && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">
                                  Popular
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ITEMS TAB ── */}
        {activeTab === "items" && (
          <>
            {/* Add item form */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Add Dish Template</h2>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={selCategoryId}
                  onChange={(e) => setSelCategoryId(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-48"
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Dish name e.g. Ilish Bhapa"
                  className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemVeg}
                    onChange={(e) => setNewItemVeg(e.target.checked)}
                    className="accent-green-600"
                  />
                  Veg
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemPopular}
                    onChange={(e) => setNewItemPopular(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Popular
                </label>
                <button
                  onClick={addItem}
                  disabled={addingItem || !newItemName.trim() || !selCategoryId}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCat("")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !filterCat
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-400"
                }`}
              >
                All ({items.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filterCat === c.id
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-400"
                  }`}
                >
                  {c.icon} {c.name} ({items.filter((i) => i.categoryId === c.id).length})
                </button>
              ))}
            </div>

            {/* Item grid */}
            <div className="bg-white rounded-xl border divide-y">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        item.isVeg ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      {item.category.icon} {item.category.name}
                    </span>
                    {item.isPopular && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        ⭐ Popular
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              These 9 pre-built Bengali templates can be cloned by catering owners from their
              dashboard. Each template is categorised by tier (Silver / Gold / Platinum) and
              variant (Non-Veg / Veg / Jain).
            </p>

            {(["SILVER", "GOLD", "PLATINUM"] as const).map((tier) => (
              <div key={tier} className="bg-white rounded-xl border overflow-hidden">
                <div className={`px-5 py-3 font-semibold text-sm border-b ${TIER_COLORS[tier]}`}>
                  {tier === "SILVER" ? "🥈" : tier === "GOLD" ? "🥇" : "💎"} {tier}
                </div>
                <div className="divide-y">
                  {templates
                    .filter((t) => t.tier === tier)
                    .map((tpl) => (
                      <div key={tpl.id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {VARIANT_ICONS[tpl.variant]}
                            <span className="font-medium text-gray-800">{tpl.name}</span>
                            <span className="text-xs text-gray-400">{tpl.variant}</span>
                          </div>
                          <span className="text-sm font-semibold text-purple-700">
                            ₹{tpl.pricePerPlate}/plate
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{tpl.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(tpl.items).map(([section, dishes]) =>
                            (dishes as string[]).map((dish) => (
                              <span
                                key={`${section}-${dish}`}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              >
                                {dish}
                              </span>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {tpl.itemCount} items total
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
