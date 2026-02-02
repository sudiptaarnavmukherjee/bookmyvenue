# Phase 3 Complete: View Counters & Analytics

## What Was Implemented

### 1. View Tracking APIs

**Venue Views API** (`src/app/api/venues/[id]/views/route.ts`)
- `POST` - Increments view count when venue detail page loads
- `GET` - Returns view stats including daily breakdown
- Updates venue.viewCount and weeklyViews
- Creates/updates ViewAnalytics record for daily tracking
- Also updates Area.totalViews for area-level analytics

**Caterer Views API** (`src/app/api/catering/[id]/views/route.ts`)
- Same functionality as venue views API
- Tracks caterer views with same granularity

### 2. Automatic View Tracking on Detail Pages

**Venue Detail Page** (`src/app/venues/[id]/page.tsx`)
- Added `trackView()` function
- Calls POST /api/venues/[id]/views after successful fetch
- Non-blocking, silent failure

**Caterer Detail Page** (`src/app/catering/[id]/page.tsx`)
- Same implementation as venue
- View counted when page loads and data fetches successfully

### 3. Analytics Dashboard

**Admin Analytics Page** (`src/app/admin/analytics/page.tsx`)
- Shows total venue views, caterer views, today's views, weekly views
- Lists top 10 most viewed venues with weekly growth
- Lists top 10 most viewed caterers with weekly growth
- Shows top 8 areas by view count with venue/caterer breakdown
- Date range filter: Today, This Week, This Month, All Time
- Refresh button for real-time updates

**Analytics API** (`src/app/api/admin/analytics/route.ts`)
- Admin-only endpoint
- Returns aggregated analytics data
- Supports date range filtering

### 4. Schema Updates

**ViewAnalytics Model** (prisma/schema.prisma)
- Added relations to Venue and Caterer models
- Enables JOIN queries for detailed analytics

**Venue & Caterer Models**
- Added reverse relation `viewAnalytics ViewAnalytics[]`

### 5. Admin Dashboard Update

- Added "View Analytics" card to admin dashboard
- Grid updated to 4 columns (Venues, Caterers, Areas, Analytics)

## How It Works

```
User visits venue/caterer page
       ↓
Page loads and fetches data
       ↓
On success, calls POST /api/venues/[id]/views
       ↓
API increments:
  - venue.viewCount (total)
  - venue.weeklyViews (weekly counter)
  - area.totalViews (area aggregate)
       ↓
API creates/updates ViewAnalytics record for today
       ↓
Data available in admin analytics dashboard
```

## Files Created/Modified

### New Files
- `src/app/api/venues/[id]/views/route.ts`
- `src/app/api/catering/[id]/views/route.ts`
- `src/app/admin/analytics/page.tsx`
- `src/app/api/admin/analytics/route.ts`

### Modified Files
- `prisma/schema.prisma` - Added ViewAnalytics relations
- `src/app/venues/[id]/page.tsx` - Added view tracking
- `src/app/catering/[id]/page.tsx` - Added view tracking
- `src/app/admin/page.tsx` - Added Analytics link

## Deployment Steps

1. Push code to repository
2. Vercel will auto-deploy
3. Run `npx prisma db push` to apply schema changes
4. Run `npx prisma generate` to update client

## Testing

1. Visit any venue detail page - view count should increment
2. Visit any caterer detail page - view count should increment
3. Go to Admin → View Analytics to see the data
4. VenueCard and CatererCard already display view counts (from Phase 1)

## Weekly Views Reset

The `weeklyViews` counter needs periodic reset. Options:
1. **Vercel Cron** - Add cron job to reset weekly
2. **Calculate from ViewAnalytics** - More accurate, sum last 7 days
