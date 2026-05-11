export default function VenuesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky header skeleton */}
      <div className="bg-white border-b sticky top-0 lg:top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse mt-1" />
              </div>
            </div>
            <div className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          {/* Search bar skeleton */}
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse mb-3" />
          {/* Sort chips skeleton */}
          <div className="flex gap-2 pb-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Area pills skeleton */}
        <div className="flex gap-2 pb-1 mb-5 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Venue grid skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-4 space-y-2.5">
                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-3.5 bg-gray-100 rounded-lg w-1/2" />
                <div className="h-3.5 bg-gray-100 rounded-lg w-2/3" />
                <div className="flex justify-between mt-4">
                  <div className="h-8 w-28 bg-gray-200 rounded-xl" />
                  <div className="h-8 w-20 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
