# 📂 ShubhSpace - Project Structure

```
c:\Bookmyvenue/
│
├── .github/
│   └── copilot-instructions.md    # GitHub Copilot workspace instructions
│
├── prisma/
│   └── schema.prisma              # Database schema (User, Venue, Caterer, etc.)
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Root layout with MobileNav
│   │   ├── page.tsx              # Home page with mode toggle
│   │   ├── globals.css           # Global styles & custom classes
│   │   ├── wishlist/
│   │   │   └── page.tsx          # Wishlist page (placeholder)
│   │   ├── trips/
│   │   │   └── page.tsx          # Trips/Bookings page (placeholder)
│   │   └── profile/
│   │       └── page.tsx          # User profile page (placeholder)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── MobileNav.tsx     # Bottom tab navigation (mobile only)
│   │   ├── home/
│   │   │   └── ModeToggle.tsx    # Venues/Catering toggle switch
│   │   ├── venue/
│   │   │   └── VenueCard.tsx     # Venue listing card with pricing
│   │   └── catering/
│   │       └── CatererCard.tsx   # Caterer card with rating
│   │
│   └── lib/
│       ├── utils.ts              # Utility functions (cn helper)
│       └── prisma.ts             # Prisma client instance
│
├── .env.example                   # Environment variables template
├── .eslintrc.json                 # ESLint configuration
├── .gitignore                     # Git ignore rules
├── components.json                # Shadcn UI configuration
├── DEV_NOTES.md                   # Development guidelines & roadmap
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies & scripts
├── postcss.config.js              # PostCSS configuration
├── README.md                      # Project overview
├── SETUP.md                       # Detailed setup instructions
├── tailwind.config.ts             # Tailwind + theme configuration
└── tsconfig.json                  # TypeScript configuration
```

## 🔑 Key Files Explained

### Configuration Files

**package.json**
- Dependencies: Next.js 15, React 19, Prisma, Framer Motion, Lucide icons
- Scripts: dev, build, start, lint, postinstall (prisma generate)

**tailwind.config.ts**
- Custom color palette: Rose, Gold, Cream
- Extended with Shadcn UI color system
- CSS variables for theming

**prisma/schema.prisma**
- Database models for dual marketplace
- Enums: UserRole, PriceMode, BookingStatus, PackageTier
- Relations: Users → Venues/Caterers, Bookings, Wishlist, Reviews

**next.config.ts**
- Image optimization for remote URLs
- Server Actions configuration
- Production-ready settings

### Application Files

**src/app/layout.tsx**
- Root layout component
- Inter font loading
- MobileNav integration
- Cream background theme

**src/app/page.tsx**
- Home page with dual-mode toggle
- Search interface (city + date for venues)
- Featured listings grid
- Framer Motion animations

**src/app/globals.css**
- Tailwind base, components, utilities
- CSS variables for light/dark mode
- Custom classes: `.wedding-gradient`, `.text-gradient`, `.card-shadow`
- Mobile-safe spacing: `.mobile-nav-safe`

### Component Library

**MobileNav** (layout/MobileNav.tsx)
- Fixed bottom navigation
- 4 tabs: Home, Wishlist, Trips, Profile
- Active state highlighting
- Hidden on desktop (md:hidden)

**ModeToggle** (home/ModeToggle.tsx)
- Pill-shaped segmented control
- Icons: Building2 (venues), UtensilsCrossed (catering)
- Active state with white background

**VenueCard** (venue/VenueCard.tsx)
- Image slider with 4:3 aspect ratio
- Hybrid pricing display (exact vs estimated)
- Verification badge
- Guest capacity info
- CTA: "Book Now" or "Get Quote"

**CatererCard** (catering/CatererCard.tsx)
- Food-focused imagery
- Star rating with review count
- "Pure Veg" badge
- Price per plate
- CTA: "View Packages"

### Utility Files

**lib/utils.ts**
- `cn()`: Tailwind class merger (clsx + tailwind-merge)

**lib/prisma.ts**
- Singleton Prisma client
- Development environment caching

## 📊 Data Flow

### Venue Booking
```
User → Home Page → Mode: Venues → Search (City + Date)
  ↓
Venue List (filtered) → VenueCard Click
  ↓
Venue Detail Page (to build)
  ↓
IF Verified: Calendar → Select Date → Book Now → Payment
IF Unverified: Get Quote Form → Lead Capture
```

### Catering Booking
```
User → Home Page → Mode: Catering → Search City
  ↓
Caterer List → CatererCard Click
  ↓
Caterer Detail Page (to build) → View Packages
  ↓
Select Tier (Silver/Gold/Diamond/Platinum)
  ↓
View Items → Enter Guest Count → Calculate Total
  ↓
Add to Cart → Checkout → Payment
```

## 🎨 Design System Quick Reference

### Colors (Tailwind Classes)
```css
Primary Rose:     text-rose-600, bg-rose-600
Secondary Gold:   text-gold-600, bg-gold-600
Background Cream: bg-cream-50, bg-cream-100
Gradients:        .wedding-gradient, .text-gradient
```

### Spacing
```css
Container:        container mx-auto max-w-6xl
Section Padding:  px-4 py-8
Card Padding:     p-4, p-6
Mobile Safe:      pb-20 md:pb-0 (account for bottom nav)
```

### Borders & Shadows
```css
Border Radius:    rounded-xl (12px), rounded-2xl (16px), rounded-full
Card Shadow:      .card-shadow (custom class)
```

### Typography
```css
Hero:             text-3xl font-bold
Section Header:   text-2xl font-bold
Card Title:       text-lg font-bold
Body:             text-base
Caption:          text-sm
Micro:            text-xs
```

## 🔄 State Management

### URL State (Recommended)
Use URL search params for:
- Search queries (city, date)
- Filters (price range, capacity)
- Active mode (venues vs catering)

```tsx
const searchParams = useSearchParams();
const mode = searchParams.get('mode') || 'venues';
```

### Server State
Use Server Actions for:
- Data mutations (bookings, reviews)
- Form submissions
- Database operations

### Client State
Use React hooks for:
- UI state (modals, dropdowns)
- Form inputs
- Animations

## 🚦 Routing Structure (Current + Future)

```
/ (Home)
├── /venues
│   └── /[id] (Venue Detail)
├── /catering
│   └── /[id] (Caterer Detail)
│       └── /[id]/packages (Feast Builder)
├── /wishlist
├── /trips
├── /profile
└── /dashboard (Owner)
    ├── /calendar
    ├── /bookings
    └── /settings
```

## 🎯 Component Reusability

### Shared Components to Build
- **Button**: Primary, secondary, outline variants
- **Input**: Text, email, tel, date with validation
- **Card**: Generic card wrapper
- **Badge**: Verified, Pure Veg, etc.
- **Rating**: Star display component
- **ImageGallery**: Swipeable image carousel
- **Modal**: Generic modal wrapper
- **Loader**: Spinner and skeleton loaders

### Layout Components
- **Header**: Desktop navigation (to build)
- **Footer**: Links and info (to build)
- **MobileNav**: Bottom tabs (✅ done)
- **Breadcrumb**: Navigation path

## 📦 Third-Party Integrations (Future)

### Essential
- **Supabase**: PostgreSQL database + storage
- **Vercel**: Hosting and deployment
- **NextAuth.js**: Authentication

### Payment
- **Razorpay**: Payment gateway (India)

### Media
- **Cloudinary**: Image upload and optimization

### Communication
- **Resend**: Transactional emails
- **Twilio**: SMS notifications (OTP)

### Analytics
- **Vercel Analytics**: Web vitals
- **PostHog**: Product analytics

---

**Quick Start**: See [SETUP.md](SETUP.md) for installation instructions.
**Development Guide**: See [DEV_NOTES.md](DEV_NOTES.md) for detailed architecture.
