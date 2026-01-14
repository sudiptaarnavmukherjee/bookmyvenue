export default function TripsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">My Trips</h1>
      <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-600">No upcoming bookings</p>
        <p className="mt-2 text-sm text-gray-500">
          Your bookings and reservations will appear here
        </p>
      </div>
    </div>
  );
}
