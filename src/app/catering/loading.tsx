export default function CateringLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky header skeleton */}
      <div className="bg-white border-b sticky top-0 lg:top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-5 w-44 bg-gray-200 rounded-lg animate-pulse" />
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
        {/* Area + veg chips skeleton */}
        <div className="flex gap-2 pb-1 mb-5 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-shrink-0 h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Zomato-style list skeletons */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-gray-200" />
              <div className="flex-1 py-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                  <div className="h-4 w-10 bg-gray-200 rounded-lg" />
                </div>
                <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                <div className="flex justify-between items-center mt-1">
                  <div className="h-5 w-20 bg-gray-200 rounded-lg" />
                  <div className="h-6 w-24 bg-gray-100 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
