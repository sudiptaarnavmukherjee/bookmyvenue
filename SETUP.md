# ShubhSpace - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database (or Supabase account)
- At least 500MB free disk space

### Installation Steps

#### 1. Install Dependencies
```bash
npm install
```

**Note**: If you encounter disk space errors, free up space and retry with:
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

#### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Using Supabase** (Recommended):
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string and add to `.env`

#### 3. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

#### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📦 What's Included

### ✅ Core Features Implemented
- [x] Mobile-first responsive design
- [x] Dual-mode toggle (Venues/Catering)
- [x] Bottom tab navigation
- [x] Venue cards with hybrid pricing
- [x] Caterer cards with ratings
- [x] Wedding-themed color system
- [x] Framer Motion animations
- [x] Complete Prisma schema
- [x] Utility functions and TypeScript setup

### 🚧 To Be Implemented (Next Steps)
- [ ] Authentication (NextAuth.js recommended)
- [ ] Venue detail pages with photo galleries
- [ ] Caterer detail pages with Feast Builder
- [ ] Booking flow with payment integration
- [ ] Owner Dashboard with Calendar OS
- [ ] Search and filter functionality
- [ ] Reviews and ratings system
- [ ] Wishlist functionality
- [ ] Email notifications

## 🎨 Design System

### Colors
```css
Primary (Rose): #E11D48
Secondary (Gold): #D4AF37
Background (Cream): #FFFBF5
```

### Component Library
- **VenueCard**: Displays venue listings with pricing and CTA
- **CatererCard**: Shows caterers with ratings and packages
- **ModeToggle**: Switches between venues and catering
- **MobileNav**: Bottom navigation bar (mobile only)

## 🗄️ Database Schema Overview

### Key Models
- **User**: Multi-role authentication (USER, OWNER, ADMIN)
- **Venue**: Supports both verified (exact price) and unverified (estimated price) listings
- **Caterer**: Includes rating system and multiple packages
- **MenuPackage**: 4-tier system (Silver, Gold, Diamond, Platinum)
- **Booking**: Handles both venue and catering bookings
- **Review**: User feedback for venues and caterers
- **Wishlist**: Save favorite listings

### Special Fields
- `Venue.offlineBookings`: Array of dates for Calendar OS blocking
- `Venue.priceMode`: EXACT or ESTIMATED for hybrid pricing
- `MenuPackage.items`: JSON structure for menu customization

## 📱 Mobile Experience

### Bottom Navigation
- **Home**: Browse venues and caterers
- **Wishlist**: Saved favorites (placeholder)
- **Trips**: Booking history (placeholder)
- **Profile**: Account settings (placeholder)

### Responsive Breakpoints
- Mobile: < 768px (bottom nav visible)
- Tablet: 768px - 1024px
- Desktop: > 1024px (bottom nav hidden)

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Lint code

# Database
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema changes
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create migration
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy

### Environment Variables for Production
```env
DATABASE_URL="your-production-db-url"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## 📚 Technology Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Custom + Shadcn UI utilities |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

## 🎯 Business Logic

### Venue Booking Flow
1. **Unverified Venues**: Show estimated price → "Get Quote" → Lead generation
2. **Verified Venues**: Show exact price → "Book Now" → Payment flow

### Catering Flow
1. Browse caterers → View packages
2. Select package tier (Silver/Gold/Diamond/Platinum)
3. Customize menu (view items)
4. Enter guest count → Calculate total
5. Add to cart → Checkout

### Owner Dashboard (Future)
- View online bookings calendar
- Block dates for offline bookings
- Manage listing details
- View analytics

## 🐛 Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Try legacy peer deps
npm install --legacy-peer-deps
```

### Prisma errors
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma db push --force-reset
```

### Build errors
```bash
# Delete .next folder
rm -rf .next

# Rebuild
npm run build
```

## 📞 Support

For issues or questions:
1. Check [README.md](README.md)
2. Review Prisma schema for data structure
3. Check Next.js 15 documentation

---

**Built with ❤️ for the Wedding Industry**
