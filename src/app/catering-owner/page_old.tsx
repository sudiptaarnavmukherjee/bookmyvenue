"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  UtensilsCrossed,
  ChefHat,
  Soup,
  Coffee,
  IceCream,
  Sparkles,
  Save
} from "lucide-react";

type MenuPackage = {
  tier: "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM";
  pricePerPlate: number;
  items: string;
};

type MenuItem = {
  id: string;
  nameEnglish: string;
  nameBengali?: string;
  category: "STARTERS" | "MAIN_COURSE" | "DESSERTS" | "BEVERAGES" | "BENGALI_SPECIALS";
  price: number;
  isAvailable: boolean;
  description?: string;
  isVeg: boolean;
};

type CatererMenu = {
  catererId: string;
  items: MenuItem[];
};

type Caterer = {
  id: string;
  name: string;
  location: string;
  isPureVeg: boolean;
  minGuests: number;
  packages: MenuPackage[];
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

type Booking = {
  id: string;
  catererName: string;
  date: string;
  customerName: string;
  guests: number;
  package: string;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  message?: string;
};

const TIER_COLORS = {
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
  DIAMOND: "from-blue-400 to-blue-600",
  PLATINUM: "from-purple-500 to-pink-600"
};

const CATEGORY_ICONS = {
  STARTERS: Soup,
  MAIN_COURSE: ChefHat,
  DESSERTS: IceCream,
  BEVERAGES: Coffee,
  BENGALI_SPECIALS: Sparkles
};

const BENGALI_ITEMS = [
  { english: "Rasgulla", bengali: "রসগোল্লা", category: "DESSERTS" as const, basePrice: 50, isVeg: true },
  { english: "Sandesh", bengali: "সন্দেশ", category: "DESSERTS" as const, basePrice: 60, isVeg: true },
  { english: "Mishti Doi", bengali: "মিষ্টি দই", category: "DESSERTS" as const, basePrice: 40, isVeg: true },
  { english: "Roshogolla", bengali: "রসগোল্লা", category: "DESSERTS" as const, basePrice: 50, isVeg: true },
  { english: "Chomchom", bengali: "চমচম", category: "DESSERTS" as const, basePrice: 55, isVeg: true },
  { english: "Pantua", bengali: "পান্তুয়া", category: "DESSERTS" as const, basePrice: 45, isVeg: true },
  { english: "Macher Jhol", bengali: "মাছের ঝোল", category: "MAIN_COURSE" as const, basePrice: 180, isVeg: false },
  { english: "Kosha Mangsho", bengali: "কষা মাংস", category: "MAIN_COURSE" as const, basePrice: 250, isVeg: false },
  { english: "Shorshe Ilish", bengali: "সর্ষে ইলিশ", category: "MAIN_COURSE" as const, basePrice: 350, isVeg: false },
  { english: "Chingri Malai Curry", bengali: "চিংড়ি মালাই কারি", category: "MAIN_COURSE" as const, basePrice: 280, isVeg: false },
  { english: "Begun Bhaja", bengali: "বেগুন ভাজা", category: "STARTERS" as const, basePrice: 80, isVeg: true },
  { english: "Alur Dom", bengali: "আলুর দম", category: "MAIN_COURSE" as const, basePrice: 100, isVeg: true },
  { english: "Shukto", bengali: "শুক্তো", category: "MAIN_COURSE" as const, basePrice: 120, isVeg: true },
  { english: "Luchi", bengali: "লুচি", category: "STARTERS" as const, basePrice: 60, isVeg: true },
  { english: "Puchka", bengali: "ফুচকা", category: "STARTERS" as const, basePrice: 50, isVeg: true },
  { english: "Jhal Muri", bengali: "ঝাল মুড়ি", category: "STARTERS" as const, basePrice: 40, isVeg: true },
  { english: "Masala Chai", bengali: "মশলা চা", category: "BEVERAGES" as const, basePrice: 30, isVeg: true },
  { english: "Lassi", bengali: "লাসি", category: "BEVERAGES" as const, basePrice: 50, isVeg: true },
  { english: "Aam Pora Sherbet", bengali: "আম পোড়া শরবত", category: "BEVERAGES" as const, basePrice: 60, isVeg: true },
  { english: "Patishapta", bengali: "পাটিসাপটা", category: "BENGALI_SPECIALS" as const, basePrice: 70, isVeg: true },
  { english: "Pithe", bengali: "পিঠে", category: "BENGALI_SPECIALS" as const, basePrice: 65, isVeg: true }
];

export default function CateringOwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "menu" | "bookings">("listings");
  const [showAddCaterer, setShowAddCaterer] = useState(false);
  
  // Menu Builder States
  const [selectedCaterer, setSelectedCaterer] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    nameEnglish: "",
    nameBengali: "",
    category: "STARTERS" as MenuItem["category"],
    price: "",
    description: "",
    isVeg: true
  });
  const [searchSuggestions, setSearchSuggestions] = useState<typeof BENGALI_ITEMS>([]);
  
  const [newCaterer, setNewCaterer] = useState({
    name: "",
    location: "",
    isPureVeg: false,
    minGuests: "50",
    description: ""
  });
  const [packages, setPackages] = useState<MenuPackage[]>([
    { tier: "SILVER", pricePerPlate: 0, items: "" },
    { tier: "GOLD", pricePerPlate: 0, items: "" },
    { tier: "DIAMOND", pricePerPlate: 0, items: "" },
    { tier: "PLATINUM", pricePerPlate: 0, items: "" }
  ]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/signin");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "CATERING_OWNER") {
      router.push("/");
      return;
    }
    
    setUser(parsedUser);

    // Load caterers
    const storedCaterers = localStorage.getItem("myCaterers");
    if (storedCaterers) {
      const allCaterers = JSON.parse(storedCaterers);
      const myCaterers = allCaterers.filter((c: any) => 
        c.ownerEmail === parsedUser.email || !c.ownerEmail
      );
      setCaterers(myCaterers);
      
      // Set first caterer as selected for menu builder
      if (myCaterers.length > 0 && !selectedCaterer) {
        setSelectedCaterer(myCaterers[0].id);
        loadMenu(myCaterers[0].id);
      }
    }

    // Load bookings
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const myBookings = allBookings.filter((b: any) => b.type === "CATERING");
    setBookings(myBookings);
  }, [router]);

  const loadMenu = (catererId: string) => {
    const storedMenus = JSON.parse(localStorage.getItem("catererMenus") || "[]");
    const menu = storedMenus.find((m: CatererMenu) => m.catererId === catererId);
    setMenuItems(menu?.items || []);
  };

  const saveMenu = () => {
    if (!selectedCaterer) return;
    
    const storedMenus = JSON.parse(localStorage.getItem("catererMenus") || "[]");
    const otherMenus = storedMenus.filter((m: CatererMenu) => m.catererId !== selectedCaterer);
    const newMenu: CatererMenu = {
      catererId: selectedCaterer,
      items: menuItems
    };
    
    localStorage.setItem("catererMenus", JSON.stringify([...otherMenus, newMenu]));
    alert("Menu saved successfully!");
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 1) {
      const filtered = BENGALI_ITEMS.filter(item =>
        item.english.toLowerCase().includes(query.toLowerCase()) ||
        (item.bengali && item.bengali.includes(query))
      );
      setSearchSuggestions(filtered);
    } else {
      setSearchSuggestions([]);
    }
  };

  const addItemFromSuggestion = (suggestion: typeof BENGALI_ITEMS[0]) => {
    const newMenuItem: MenuItem = {
      id: Date.now().toString(),
      nameEnglish: suggestion.english,
      nameBengali: suggestion.bengali,
      category: suggestion.category,
      price: suggestion.basePrice,
      isAvailable: true,
      isVeg: suggestion.isVeg
    };
    
    setMenuItems([...menuItems, newMenuItem]);
    setSearchQuery("");
    setSearchSuggestions([]);
  };

  const handleAddCustomItem = () => {
    if (!newItem.nameEnglish || !newItem.price) {
      alert("Please fill in item name and price");
      return;
    }

    const menuItem: MenuItem = {
      id: Date.now().toString(),
      nameEnglish: newItem.nameEnglish,
      nameBengali: newItem.nameBengali,
      category: newItem.category,
      price: parseFloat(newItem.price),
      description: newItem.description,
      isAvailable: true,
      isVeg: newItem.isVeg
    };

    setMenuItems([...menuItems, menuItem]);
    setNewItem({
      nameEnglish: "",
      nameBengali: "",
      category: "STARTERS",
      price: "",
      description: "",
      isVeg: true
    });
    setShowAddItem(false);
  };

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems(menuItems.map(item =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const deleteMenuItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMenuItems(menuItems.filter(item => item.id !== itemId));
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch = item.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.nameBengali && item.nameBengali.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const handleAddCaterer = () => {
    if (!newCaterer.name || !newCaterer.location) {
      alert("Please fill in all required fields");
      return;
    }

    const validPackages = packages.filter(p => p.pricePerPlate > 0 && p.items);
    if (validPackages.length === 0) {
      alert("Please add at least one menu package");
      return;
    }

    const caterer: Caterer = {
      id: Date.now().toString(),
      name: newCaterer.name,
      location: newCaterer.location,
      isPureVeg: newCaterer.isPureVeg,
      minGuests: parseInt(newCaterer.minGuests),
      packages: validPackages,
      status: "PENDING"
    };

    const updatedCaterers = [...caterers, caterer];
    setCaterers(updatedCaterers);
    localStorage.setItem("myCaterers", JSON.stringify(updatedCaterers));
    
    // Set as selected for menu builder
    setSelectedCaterer(caterer.id);
    
    setShowAddCaterer(false);
    setNewCaterer({ name: "", location: "", isPureVeg: false, minGuests: "50", description: "" });
    setPackages([
      { tier: "SILVER", pricePerPlate: 0, items: "" },
      { tier: "GOLD", pricePerPlate: 0, items: "" },
      { tier: "DIAMOND", pricePerPlate: 0, items: "" },
      { tier: "PLATINUM", pricePerPlate: 0, items: "" }
    ]);
    alert("Catering service added successfully! It will be live after admin verification.");
  };

  const handleDeleteCaterer = (id: string) => {
    if (confirm("Are you sure you want to delete this catering service?")) {
      const updated = caterers.filter(c => c.id !== id);
      setCaterers(updated);
      localStorage.setItem("myCaterers", JSON.stringify(updated));
    }
  };

  const updatePackage = (tier: string, field: string, value: any) => {
    setPackages(packages.map(p => 
      p.tier === tier ? { ...p, [field]: value } : p
    ));
  };

  const updateBookingStatus = (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updated = allBookings.map((b: any) =>
      b.id === bookingId ? { ...b, status } : b
    );
    localStorage.setItem("bookings", JSON.stringify(updated));
    
    const myBookings = updated.filter((b: any) => b.type === "CATERING");
    setBookings(myBookings);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center cosmic-gradient">Loading...</div>;
  }

  const stats = {
    totalCaterers: caterers.length,
    totalBookings: bookings.length,
    revenue: bookings.reduce((sum, b) => sum + b.amount, 0),
    totalMenuItems: menuItems.length,
    availableItems: menuItems.filter(i => i.isAvailable).length
  };

  const selectedCatererData = caterers.find(c => c.id === selectedCaterer);

  return (
    <div className="min-h-screen cosmic-gradient pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-rainbow mb-2">Catering Owner Dashboard</h1>
          <p className="text-gray-700">Manage your catering services and menus</p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "listings"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            🍽️ My Services
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "menu"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📋 Menu Builder
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`rounded-full px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "bookings"
                ? "btn-rainbow text-white shadow-lg"
                : "glass-card-vibrant hover:bg-white/80"
            }`}
          >
            📅 Bookings
          </button>
        </div>

        {/* Menu Builder Tab */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            {caterers.length === 0 ? (
              <div className="glass-card-vibrant rounded-3xl p-12 text-center">
                <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Catering Services Yet</h3>
                <p className="text-gray-600 mb-6">Create a catering service first to build your menu</p>
                <button
                  onClick={() => setActiveTab("listings")}
                  className="btn-rainbow text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
                >
                  Add Catering Service
                </button>
              </div>
            ) : (
              <>
                {/* Service Selector & Stats */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="glass-card-vibrant rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Catering Service
                    </label>
                    <select
                      value={selectedCaterer}
                      onChange={(e) => {
                        setSelectedCaterer(e.target.value);
                        loadMenu(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors font-semibold"
                    >
                      {caterers.map(caterer => (
                        <option key={caterer.id} value={caterer.id}>
                          {caterer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="glass-card-vibrant rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Menu Items</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalMenuItems}</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          {stats.availableItems} Available
                        </p>
                      </div>
                      <button
                        onClick={saveMenu}
                        className="flex items-center gap-2 btn-rainbow text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        <Save className="h-5 w-5" />
                        Save Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search & Add */}
                <div className="glass-card-vibrant rounded-3xl p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search Bengali items (e.g., Rasgulla, রসগোল্লা, Mishti Doi...)"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors"
                      />
                      
                      {/* Search Suggestions */}
                      <AnimatePresence>
                        {searchSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-orange-200 max-h-80 overflow-y-auto z-50"
                          >
                            {searchSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => addItemFromSuggestion(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{suggestion.english}</p>
                                    <p className="text-sm text-gray-600">{suggestion.bengali}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-orange-600">
                                      ₹{suggestion.basePrice}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {suggestion.category.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                    >
                      <Plus className="h-5 w-5" />
                      Add Custom Item
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["ALL", "STARTERS", "MAIN_COURSE", "DESSERTS", "BEVERAGES", "BENGALI_SPECIALS"].map((category) => {
                    const Icon = category !== "ALL" ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : UtensilsCrossed;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-all whitespace-nowrap ${
                          selectedCategory === category
                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                            : "glass-card-vibrant hover:bg-white/80"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {category.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>

                {/* Menu Items Grid */}
                {filteredMenuItems.length === 0 ? (
                  <div className="glass-card-vibrant rounded-3xl p-12 text-center">
                    <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Items Yet</h3>
                    <p className="text-gray-600">Search and add Bengali items or create custom menu items</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMenuItems.map((item) => {
                      const Icon = CATEGORY_ICONS[item.category];
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`glass-card-vibrant rounded-2xl p-5 transition-all ${
                            !item.isAvailable ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Icon className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{item.nameEnglish}</h4>
                                {item.nameBengali && (
                                  <p className="text-sm text-gray-600">{item.nameBengali}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleItemAvailability(item.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  item.isAvailable 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteMenuItem(item.id)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Price</p>
                              <p className="text-lg font-bold text-gray-900">₹{item.price}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 mb-1">Category</p>
                              <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                                {item.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {item.description && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600">{item.description}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.isVeg 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.isVeg ? '🌿 Veg' : '🍖 Non-Veg'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.isAvailable 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Item Modal */}
                <AnimatePresence>
                  {showAddItem && (
                    <div
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                      onClick={() => setShowAddItem(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-card-vibrant rounded-3xl p-8 max-w-2xl w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-gray-900">Add Custom Menu Item</h3>
                          <button
                            onClick={() => setShowAddItem(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Item Name (English) *
                              </label>
                              <input
                                type="text"
                                value={newItem.nameEnglish}
                                onChange={(e) => setNewItem({ ...newItem, nameEnglish: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors"
                                placeholder="e.g., Paneer Tikka"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Item Name (Bengali)
                              </label>
                              <input
                                type="text"
                                value={newItem.nameBengali}
                                onChange={(e) => setNewItem({ ...newItem, nameBengali: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors"
                                placeholder="e.g., পনির টিক্কা"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Category *
                              </label>
                              <select
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as MenuItem["category"] })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors"
                              >
                                <option value="STARTERS">Starters</option>
                                <option value="MAIN_COURSE">Main Course</option>
                                <option value="DESSERTS">Desserts</option>
                                <option value="BEVERAGES">Beverages</option>
                                <option value="BENGALI_SPECIALS">Bengali Specials</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Price (₹) *
                              </label>
                              <input
                                type="number"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors"
                                placeholder="150"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={newItem.description}
                              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none transition-colors resize-none"
                              rows={3}
                              placeholder="Brief description of the item..."
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newItem.isVeg}
                                onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300"
                              />
                              <span className="font-semibold text-gray-700">Vegetarian Item</span>
                            </label>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => setShowAddItem(false)}
                              className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold hover:bg-white/60 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddCustomItem}
                              className="flex-1 btn-rainbow text-white py-3 rounded-xl font-semibold shadow-lg"
                            >
                              Add Item
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAddCaterer(!showAddCaterer)}
              className="w-full glass-card-vibrant rounded-2xl p-6 hover-lift flex items-center justify-center gap-3 font-semibold transition-all"
              style={{ color: '#FF6B35' }}
            >
              <Plus className="h-5 w-5" />
              Add New Catering Service
            </button>

            {showAddCaterer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-vibrant rounded-3xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Catering Service</h3>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      placeholder="Business Name *"
                      value={newCaterer.name}
                      onChange={(e) => setNewCaterer({...newCaterer, name: e.target.value})}
                      className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                    />
                    <input
                      placeholder="Location *"
                      value={newCaterer.location}
                      onChange={(e) => setNewCaterer({...newCaterer, location: e.target.value})}
                      className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Minimum Guests *"
                      value={newCaterer.minGuests}
                      onChange={(e) => setNewCaterer({...newCaterer, minGuests: e.target.value})}
                      className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                    />
                    <label className="flex items-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={newCaterer.isPureVeg}
                        onChange={(e) => setNewCaterer({...newCaterer, isPureVeg: e.target.checked})}
                        className="rounded"
                      />
                      <span className="font-medium">Pure Vegetarian</span>
                    </label>
                    <textarea
                      placeholder="Description"
                      value={newCaterer.description}
                      onChange={(e) => setNewCaterer({...newCaterer, description: e.target.value})}
                      rows={3}
                      className="rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-orange-500 transition-colors sm:col-span-2 resize-none"
                    />
                  </div>

                  {/* Menu Packages */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Menu Packages</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.tier}
                          className="rounded-2xl border-2 border-gray-200 p-4"
                        >
                          <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[pkg.tier]} px-4 py-1.5 mb-3`}>
                            <span className="text-sm font-bold text-white">{pkg.tier}</span>
                          </div>
                          <input
                            type="number"
                            placeholder="Price per plate"
                            value={pkg.pricePerPlate || ""}
                            onChange={(e) => updatePackage(pkg.tier, "pricePerPlate", parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-2 outline-none focus:border-orange-500"
                          />
                          <textarea
                            placeholder="Menu items (comma separated)"
                            value={pkg.items}
                            onChange={(e) => updatePackage(pkg.tier, "items", e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-orange-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddCaterer(false)}
                      className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold hover:bg-white/60 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCaterer}
                      className="flex-1 rounded-xl btn-rainbow py-3 font-semibold text-white shadow-lg"
                    >
                      Add Service
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {caterers.map((caterer) => (
              <motion.div
                key={caterer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-vibrant rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{caterer.name}</h3>
                      {caterer.status === "APPROVED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : caterer.status === "PENDING" ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{caterer.location}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium">{caterer.isPureVeg ? "🌿 Pure Veg" : "🍖 Veg & Non-Veg"}</span>
                      <span className="text-gray-600">Min. {caterer.minGuests} guests</span>
                    </div>
                    {caterer.status === "PENDING" && (
                      <div className="mt-3 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Awaiting Admin Approval
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg p-2 hover:bg-white/60 transition-colors">
                      <Edit className="h-5 w-5 text-orange-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCaterer(caterer.id)}
                      className="rounded-lg p-2 hover:bg-white/60 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {caterer.packages.map((pkg) => (
                    <div key={pkg.tier} className="rounded-lg bg-white/60 p-3">
                      <div className={`inline-block rounded-full bg-gradient-to-r ${TIER_COLORS[pkg.tier]} px-3 py-1 mb-2`}>
                        <span className="text-xs font-bold text-white">{pkg.tier}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">₹{pkg.pricePerPlate}/plate</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {caterers.length === 0 && !showAddCaterer && (
              <div className="glass-card-vibrant rounded-3xl p-12 text-center">
                <p className="text-gray-600">No services yet. Add your first catering service!</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-vibrant rounded-3xl overflow-hidden"
          >
            {bookings.length === 0 ? (
              <div className="p-12 text-center">
                <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Package</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Guests</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-6 py-4 font-medium">{booking.customerName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">{booking.package}</td>
                        <td className="px-6 py-4 text-sm">{booking.guests}</td>
                        <td className="px-6 py-4 font-semibold">
                          ₹{booking.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                            booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                                className="text-sm font-medium text-green-600 hover:text-green-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
