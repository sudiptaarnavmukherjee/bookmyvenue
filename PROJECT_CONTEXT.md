# 📋 COMPREHENSIVE PROJECT CONTEXT - BookMyVenue (ShubhSpace)

## PROJECT OVERVIEW
**BookMyVenue** (internally called ShubhSpace) is a wedding venue and catering booking platform built with modern web technologies. It allows users to browse, search, and book wedding venues and catering services, while venue/catering owners can list and manage their properties.

**Live URL:** https://bookmyvenue-alpha.vercel.app  
**GitHub:** https://github.com/sudiptaarnavmukherjee/bookmyvenue

---

## TECH STACK
- **Framework:** Next.js 15.2.0 (App Router)
- **React:** 19.0.0
- **Language:** TypeScript 5.7.2
- **Database:** PostgreSQL (Supabase - Mumbai region)
- **ORM:** Prisma 6.2.1
- **Authentication:** NextAuth.js 4.24.13 (JWT strategy with CredentialsProvider)
- **Styling:** Tailwind CSS 3.4.17 with Framer Motion animations
- **Icons:** Lucide React
- **Deployment:** Vercel
- **Image Storage:** Cloudinary (configured but optional)

---

## DATABASE SCHEMA (Prisma Models)

### Enums:
- `UserRole`: USER, VENUE_OWNER, CATERING_OWNER, ADMIN
- `PriceMode`: EXACT, ESTIMATED
- `BookingStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `BookingType`: VENUE, CATERING
- `PackageTier`: SILVER, GOLD, DIAMOND, PLATINUM

### Models (10 total):
1. **User** - id, email, password (bcrypt), name, phone, role, isActive, KYC fields (aadhaarNumber, panNumber, gstNumber)
2. **Venue** - name, slug, description, city, area, address, pincode, priceMode, exactPrice/estimatedMinPrice/estimatedMaxPrice, minGuests, maxGuests, images (comma-separated), videos (comma-separated), amenities (comma-separated), venueType, offlineBookings (comma-separated), isVerified, isActive, ownerId
3. **Caterer** - name, slug, description, city, address, phone, minPlatePrice, isPureVeg, isMultiCuisine, cuisines (comma-separated), images (comma-separated), coverImage, isVerified, isActive, ownerId
4. **MenuPackage** - tier (PackageTier enum), name, description, pricePerPlate, itemCount, items (JSON), catererId
5. **Booking** - bookingNumber, type (VENUE/CATERING), status, eventDate, guestCount, totalAmount, userId, venueId, catererId
6. **Review** - rating, comment, userId, venueId, catererId
7. **Wishlist** - userId, venueId, catererId
8. **BlockedDate** - date, reason, venueId, catererId, blockedById
9. **Account** - NextAuth OAuth accounts
10. **Session** - NextAuth sessions

### IMPORTANT DATA STORAGE NOTE:
Arrays are stored as **comma-separated strings** (images, videos, amenities, cuisines, offlineBookings), **NOT JSON arrays**.

---

## PROJECT STRUCTURE

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   ├── auth/signup/route.ts          # User registration
│   │   ├── availability/blocked-dates/   # Calendar blocking
│   │   ├── availability/check/           # Availability check
│   │   ├── bookings/route.ts             # CRUD bookings
│   │   ├── bookings/[id]/route.ts        # Single booking
│   │   ├── bookings/[id]/confirm/        # Confirm booking
│   │   ├── bookings/[id]/cancel/         # Cancel booking
│   │   ├── catering/route.ts             # CRUD caterers
│   │   ├── catering/[id]/route.ts        # Single caterer
│   │   ├── venues/route.ts               # CRUD venues
│   │   ├── venues/[id]/route.ts          # Single venue
│   │   ├── wishlist/route.ts             # Wishlist management
│   │   ├── upload/image/                 # Image upload (Cloudinary)
│   │   └── users/me/                     # Current user profile
│   │
│   ├── auth/signin/page.tsx              # Login page
│   ├── auth/signup/page.tsx              # Registration page
│   ├── page.tsx                          # Homepage with search
│   ├── venues/page.tsx                   # Venue listing
│   ├── venues/[id]/page.tsx              # Venue detail + booking
│   ├── catering/page.tsx                 # Caterer listing
│   ├── catering/[id]/page.tsx            # Caterer detail + booking
│   ├── venue-owner/page.tsx              # Venue owner dashboard (Add Venue)
│   ├── catering-owner/page.tsx           # Catering owner dashboard
│   ├── dashboard/page.tsx                # User dashboard
│   ├── bookings/page.tsx                 # User's bookings
│   ├── wishlist/page.tsx                 # User's wishlist
│   ├── profile/page.tsx                  # User profile
│   └── trips/page.tsx                    # Upcoming trips
│
├── components/
│   ├── calendar/AvailabilityCalendar.tsx # Availability calendar
│   ├── calendar/BlockDateModal.tsx       # Block date modal
│   ├── catering/CatererCard.tsx          # Caterer card component
│   ├── venue/VenueCard.tsx               # Venue card component
│   ├── upload/ImageUploader.tsx          # Image upload component
│   ├── layout/DesktopNav.tsx             # Desktop navigation
│   ├── layout/MobileNav.tsx              # Mobile navigation
│   └── providers/SessionProvider.tsx     # NextAuth session provider
│
├── lib/
│   ├── auth.ts                           # NextAuth configuration (authOptions)
│   ├── api-client.ts                     # Frontend API client utility
│   ├── db.ts                             # Prisma client instance
│   ├── prisma.ts                         # Prisma client (alias)
│   └── utils.ts                          # Utility functions (cn, etc.)
│
└── middleware.ts                         # Route protection middleware
```

---

## AUTHENTICATION FLOW
- Uses NextAuth.js with JWT strategy (not database sessions)
- CredentialsProvider for email/password login
- Password hashing: bcryptjs
- Auth config in `src/lib/auth.ts` (NOT in route handler)
- Session includes: id, email, name, role
- Protected routes via middleware.ts

---

## API PATTERNS (Next.js 15 App Router)

### Dynamic Route Params are Promises in Next.js 15:
```typescript
// Correct signature for dynamic routes
export async function GET(
  request: Request, 
  segmentData: { params: Promise<{ id: string }> }
) {
  const params = await segmentData.params;  // Must await!
  const { id } = params;
  // ... rest of handler
}
```

### Creating Records with Relations:
```typescript
// Venue creation example
const venue = await prisma.venue.create({
  data: {
    name,
    slug,
    description,
    city,
    area,
    address,
    pincode,
    priceMode: "EXACT",
    exactPrice: 150000,
    minGuests: 50,
    maxGuests: 500,
    images: "url1,url2,url3",      // Comma-separated, NOT array
    videos: "",                     // Empty string, NOT []
    offlineBookings: "",            // Empty string, NOT []
    amenities: "Parking,AC,Catering",
    venueType: "Banquet Hall",
    owner: { connect: { id: ownerId } }  // Relation, NOT ownerId directly
  }
});
```

### Using Enums:
```typescript
import { PriceMode, PackageTier } from '@prisma/client';

// Correct
priceMode: PriceMode.EXACT
tier: PackageTier.SILVER

// Wrong
priceMode: "EXACT"  // String won't work
tier: "SILVER"      // String won't work
```

---

## ENVIRONMENT VARIABLES (Vercel)

```env
DATABASE_URL=postgresql://postgres.wfjnbbwjnbozqjvhuike:Westbengal123456%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=bookmyvenue-production-secret-2026-vercel-live
NEXTAUTH_URL=https://bookmyvenue-alpha.vercel.app
NEXT_PUBLIC_APP_URL=https://bookmyvenue-alpha.vercel.app
```

---

## USER ROLES & FEATURES

| Role | Access |
|------|--------|
| USER | Browse venues/caterers, book, wishlist, view bookings |
| VENUE_OWNER | All USER features + Add/manage venues, view/confirm bookings, block dates |
| CATERING_OWNER | All USER features + Add/manage caterers, manage menu packages |
| ADMIN | Full platform access, verify venues/caterers |

---

## CURRENT FEATURES IMPLEMENTED

✅ User authentication (signup/signin/signout)  
✅ Venue browsing with filters (city, price, guests, date)  
✅ Catering browsing with filters  
✅ Venue detail pages with image gallery  
✅ Catering detail with menu packages (Silver/Gold/Diamond/Platinum)  
✅ Booking creation for venues and caterers  
✅ Wishlist functionality  
✅ Venue owner dashboard with "Add Venue" form  
✅ Catering owner dashboard  
✅ Availability calendar with date blocking  
✅ Booking confirmation/cancellation  
✅ Responsive design (mobile-friendly)  
✅ Gradient UI theme (purple/pink)  

---

## KNOWN ISSUES/CONSIDERATIONS

1. **Images stored as comma-separated URLs** - Split with `.split(',')` when displaying
2. **Next.js 15 async params** - Dynamic route params must be awaited
3. **Prisma relations** - Use `connect: { id }` syntax for creation, not direct ID
4. **Enums** - Must import and use Prisma enum types, not strings
5. **API Response typing** - Use `(data as any)` cast when accessing response properties

---

## TEST CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookmyvenue.com | password123 |
| Venue Owner | Create via signup | Your choice |
| Catering Owner | Create via signup | Your choice |
| User | Create via signup | Your choice |

---

## SQL COMMANDS FOR SUPABASE

### Create Admin User:
```sql
INSERT INTO "User" (id, email, password, name, phone, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@bookmyvenue.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.aCGJKlXjQaH0.4urXy',
  'Admin User',
  '9999999999',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```
Password: `password123`

### Upgrade Existing User to Admin:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Create Sample Venue:
```sql
WITH owner AS (SELECT id FROM "User" WHERE role = 'VENUE_OWNER' LIMIT 1)
INSERT INTO "Venue" (id, name, slug, description, city, area, address, pincode, "priceMode", "exactPrice", "minGuests", "maxGuests", images, videos, "offlineBookings", "coverImage", amenities, "venueType", "ownerId", "isVerified", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Grand Palace Banquet',
  'grand-palace-banquet',
  'Elegant banquet hall for weddings',
  'Mumbai',
  'Andheri West',
  '123 Wedding Lane',
  '400058',
  'EXACT',
  150000,
  100,
  500,
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
  '',
  '',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
  'Parking,AC,Catering,DJ',
  'Banquet Hall',
  (SELECT id FROM owner),
  true,
  true,
  NOW(),
  NOW()
);
```

---

## API CLIENT USAGE (Frontend)

```typescript
import { api } from "@/lib/api-client";

// Get all venues
const { data, error } = await api.getVenues();

// Create venue
const response = await api.createVenue(venueData);

// Get bookings
const { data } = await api.getBookings();

// Confirm booking
await api.confirmBooking(bookingId);

// Cancel booking
await api.cancelBooking(bookingId);
```

---

## DEPLOYMENT NOTES

- **Platform:** Vercel (auto-deploys from GitHub main branch)
- **Database:** Supabase PostgreSQL (Mumbai region for low latency)
- **Build Command:** `yarn run build`
- **Prisma:** Runs `prisma generate` on postinstall

---

## COPY THIS ENTIRE FILE CONTENT TO GIVE FULL CONTEXT TO ANY NEW COPILOT SESSION!
