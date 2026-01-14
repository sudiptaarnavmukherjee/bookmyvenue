"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { api } from "@/lib/api-client";

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  isOnlineBooking: boolean;
  bookingId?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  guestCount?: number;
  status: string;
  totalAmount?: number;
}

interface AvailabilityCalendarProps {
  venueId?: string;
  catererId?: string;
  bookings: Booking[];
  onDateClick?: (date: Date, blockedDate?: BlockedDate) => void;
}

export default function AvailabilityCalendar({
  venueId,
  catererId,
  bookings,
  onDateClick,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch blocked dates when month changes
  useEffect(() => {
    fetchBlockedDates();
  }, [currentDate, venueId, catererId]);

  const fetchBlockedDates = async () => {
    setLoading(true);
    try {
      // Get first and last day of current month
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const { data, error } = await api.getBlockedDates({
        venueId,
        catererId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      if (!error && data?.blockedDates) {
        setBlockedDates(data.blockedDates);
      }
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if date is blocked
  const isDateBlocked = (day: number) => {
    const dateStr = new Date(year, currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return blockedDates.find((bd) => bd.date.split("T")[0] === dateStr);
  };

  // Check if date has bookings
  const getDateBookings = (day: number) => {
    const dateStr = new Date(year, currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return bookings.filter((b) => b.eventDate.split("T")[0] === dateStr);
  };

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter(
        (b) =>
          b.eventDate.split("T")[0] ===
          selectedDate.toISOString().split("T")[0]
      )
    : [];

  // Handle date click
  const handleDateClick = (day: number) => {
    const date = new Date(year, currentDate.getMonth(), day);
    setSelectedDate(date);
    const blocked = isDateBlocked(day);
    if (onDateClick) {
      onDateClick(date, blocked);
    }
  };

  // Get date cell styling
  const getDateCellClass = (day: number | null) => {
    if (day === null) return "invisible";

    const date = new Date(year, currentDate.getMonth(), day);
    const isPast = date < today;
    const isToday =
      date.toDateString() === today.toDateString();
    const isSelected =
      selectedDate && date.toDateString() === selectedDate.toDateString();
    const blocked = isDateBlocked(day);
    const dateBookings = getDateBookings(day);

    let baseClass =
      "relative h-16 p-2 border border-gray-200 cursor-pointer transition-all hover:border-rose-300";

    if (isPast) {
      baseClass += " bg-gray-50 text-gray-400 cursor-not-allowed";
    } else if (isSelected) {
      baseClass += " bg-rose-100 border-rose-500 ring-2 ring-rose-200";
    } else if (blocked?.isOnlineBooking) {
      baseClass += " bg-red-50 border-red-300 hover:bg-red-100";
    } else if (blocked) {
      baseClass += " bg-gray-100 border-gray-400";
    } else if (dateBookings.length > 0) {
      baseClass += " bg-yellow-50 border-yellow-300";
    } else {
      baseClass += " bg-white hover:bg-green-50";
    }

    if (isToday) {
      baseClass += " ring-2 ring-blue-400";
    }

    return baseClass;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-rose-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Availability Calendar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <div className="text-center min-w-[150px]">
            <p className="text-lg font-semibold text-gray-900">
              {monthName} {year}
            </p>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 border-b text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-green-500 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border-2 border-red-400 rounded"></div>
          <span className="text-gray-600">Booked Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded"></div>
          <span className="text-gray-600">Blocked by You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-400 rounded"></div>
          <span className="text-gray-600">Has Bookings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded ring-2 ring-blue-300"></div>
          <span className="text-gray-600">Today</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 animate-pulse rounded"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={getDateCellClass(day)}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className="font-semibold text-sm">{day}</div>
                    {isDateBlocked(day) && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-[10px] font-medium text-red-600 truncate">
                          {isDateBlocked(day)?.isOnlineBooking
                            ? "Booked"
                            : "Blocked"}
                        </div>
                      </div>
                    )}
                    {getDateBookings(day).length > 0 && !isDateBlocked(day) && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-[10px] font-medium text-yellow-700">
                          {getDateBookings(day).length} booking(s)
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedDateBookings.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Bookings for this date:
              </p>
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white p-3 rounded border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {booking.bookingNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        booking.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.customerName}
                  </p>
                  {booking.guestCount && (
                    <p className="text-xs text-gray-500">
                      Guests: {booking.guestCount}
                    </p>
                  )}
                  {booking.totalAmount && (
                    <p className="text-xs text-gray-500">
                      Amount: ₹{booking.totalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : isDateBlocked(selectedDate.getDate()) ? (
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Date is blocked</p>
              <p className="text-xs">
                {isDateBlocked(selectedDate.getDate())?.reason ||
                  "No reason provided"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No bookings for this date. Date is available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
