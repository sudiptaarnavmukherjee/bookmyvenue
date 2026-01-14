"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  name: string;
  type: "VENUE" | "CATERING";
  location: string;
  isVerified: boolean;
  bookingsCount: number;
  revenue: number;
};

type Booking = {
  id: string;
  customerName: string;
  date: string;
  guests: number;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    name: "Royal Garden Palace",
    type: "VENUE",
    location: "Barasat, Kolkata",
    isVerified: true,
    bookingsCount: 5,
    revenue: 625000
  }
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    customerName: "Amit Kumar",
    date: "2024-12-25",
    guests: 300,
    amount: 125000,
    status: "CONFIRMED"
  },
  {
    id: "2",
    customerName: "Priya Sharma",
    date: "2024-12-30",
    guests: 250,
    amount: 100000,
    status: "PENDING"
  }
];

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings] = useState<Listing[]>(MOCK_LISTINGS);
  const [bookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState<"listings" | "bookings">("listings");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/signin");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "OWNER") {
      router.push("/");
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalRevenue = listings.reduce((sum, l) => sum + l.revenue, 0);
  const totalBookings = listings.reduce((sum, l) => sum + l.bookingsCount, 0);

  const getStatusColor = (status: Booking["status"]) => {
    switch(status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Owner Dashboard</h1>
          <p className="text-gray-600">Manage your listings and bookings</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-600">Total Listings</span>
            </div>
            <p className="text-3xl font-bold text-gradient">{listings.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-600">Total Bookings</span>
            </div>
            <p className="text-3xl font-bold text-gradient">{totalBookings}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            </div>
            <p className="text-3xl font-bold text-gradient">₹{(totalRevenue / 100000).toFixed(1)}L</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded-full px-6 py-2.5 font-medium transition-all ${
              activeTab === "listings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "glass-card hover:bg-white/80"
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`rounded-full px-6 py-2.5 font-medium transition-all ${
              activeTab === "bookings"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "glass-card hover:bg-white/80"
            }`}
          >
            Bookings
          </button>
        </div>

        {/* Content */}
        {activeTab === "listings" ? (
          <div className="space-y-4">
            {/* Add New Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full glass-card rounded-2xl p-6 hover-lift flex items-center justify-center gap-3 text-purple-600 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add New Listing
            </motion.button>

            {/* Listings */}
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 1) * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{listing.name}</h3>
                      {listing.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{listing.location}</p>
                    
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Bookings:</span>
                        <span className="ml-2 font-semibold text-gray-900">{listing.bookingsCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <span className="ml-2 font-semibold text-gray-900">₹{listing.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="rounded-lg p-2 hover:bg-white/60 transition-colors">
                      <Eye className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="rounded-lg p-2 hover:bg-white/60 transition-colors">
                      <Edit className="h-5 w-5 text-purple-600" />
                    </button>
                    <button className="rounded-lg p-2 hover:bg-white/60 transition-colors">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Guests</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.guests}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{booking.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold w-fit ${getStatusColor(booking.status)}`}>
                          {booking.status === "CONFIRMED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button className="text-sm font-medium text-green-600 hover:text-green-700">
                              Confirm
                            </button>
                            <button className="text-sm font-medium text-red-600 hover:text-red-700">
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
