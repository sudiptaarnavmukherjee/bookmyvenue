# ShubhSpace Development Notes

## 🎯 Project Status: Ready for Development

### ✅ Completed Setup
- [x] Next.js 15 project structure
- [x] TypeScript configuration
- [x] Tailwind CSS with custom wedding theme
- [x] Prisma schema (comprehensive dual-marketplace model)
- [x] Core component library
- [x] Mobile-first responsive layout
- [x] Framer Motion integration
- [x] All configuration files

### 📦 Dependencies Status
**⚠️ ACTION REQUIRED**: Install dependencies before running the project

```bash
npm install
```

If you encounter disk space errors, run:
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

## 🏗️ Architecture Overview

### Hybrid Inventory Model (The "Fishbowl")
This is the key differentiator. Two types of venue listings coexist:

1. **Type 1: Unverified Listings**
   - Data source: Web scraping
   - Pricing: Estimated range (e.g., ₹40k - ₹60k)
   - Calendar: No real-time availability
   - CTA: "Get Quote" button
   - Purpose: Lead generation

2. **Type 2: Verified Partners**
   - Data source: Owner onboarding
   - Pricing: Exact price (e.g., ₹45,000)
   - Calendar: Real-time booking system
   - CTA: "Book Now" button
   - Purpose: Direct booking with payment

### Feast Builder (Menu System)
Every caterer must offer exactly 4 tiers:
- **Silver**: ~20 items (Economy tier)
- **Gold**: ~30 items (Standard tier)
- **Diamond**: ~40 items (Premium tier)
- **Platinum**: ~50 items (Luxury tier)

Items stored as JSON in MenuPackage.items:
```json
{
  "categories": [
    {
      "name": "Starters",
      "items": ["Paneer Tikka", "Veg Spring Roll"]
    },
    {
      "name": "Main Course",
      "items": ["Dal Makhani", "Butter Chicken"]
    }
  ]
}
```

## 🔄 User Flows

### Venue Booking Flow
```
Home → Search (City + Date) → Venue Listing → Venue Detail
  ↓
Unverified: Get Quote Form → Lead captured
Verified: Select Date → Pay Token → Booking Confirmed
```

### Catering Flow
```
Home → Switch to Catering → Search City → Caterer List → Caterer Detail
  ↓
View Packages → Select Tier → View Items → Enter Guest Count
  ↓
Add to Cart → Checkout → Payment
```

### Owner Flow (To Build)
```
Owner Dashboard → Calendar View → See Online Bookings
  ↓
Block Date Button → Mark Offline Booking → Update Calendar
```

## 🎨 Design Principles

### Mobile-First
- Bottom tab navigation (fixed, visible only on mobile)
- Touch-friendly buttons (min 44px height)
- Swipeable image galleries
- Optimized images (Next.js Image component)

### Color Psychology
- **Rose (#E11D48)**: Excitement, passion, celebration
- **Gold (#D4AF37)**: Luxury, premium, tradition
- **Cream (#FFFBF5)**: Elegance, warmth, clean canvas

### Typography Scale
```css
Hero: text-3xl font-bold (30px)
Section Headers: text-2xl font-bold (24px)
Card Titles: text-lg font-bold (18px)
Body: text-base (16px)
Caption: text-sm (14px)
Micro: text-xs (12px)
```

## 📊 Database Relationships

```
User (1) → (M) Venue
User (1) → (M) Caterer
User (1) → (M) Booking
User (1) → (M) Wishlist
User (1) → (M) Review

Venue (1) → (M) Booking
Venue (1) → (M) Review
Venue (1) → (M) Wishlist

Caterer (1) → (M) MenuPackage (4 exactly)
Caterer (1) → (M) Booking
Caterer (1) → (M) Review
Caterer (1) → (M) Wishlist
```

## 🔐 Future: Authentication Strategy

Recommended: NextAuth.js v5 (Auth.js)

**User Roles**:
- `USER`: Can browse and book
- `OWNER`: Can manage listings + view dashboard
- `ADMIN`: Full system access

**Sign-up Flow**:
1. Email/Password or Google OAuth
2. Phone verification (OTP)
3. Role selection (User vs Owner)
4. If Owner → Onboarding wizard

## 💳 Future: Payment Integration

Recommended: Razorpay (India-focused)

**Venue Booking**:
- Token amount: 10-20% of total price
- Full payment: Collected offline or later

**Catering Booking**:
- Token amount: Fixed (e.g., ₹5000)
- Remaining: Pay on delivery

## 📱 PWA Features (Future)

```json
// manifest.json
{
  "name": "ShubhSpace",
  "short_name": "ShubhSpace",
  "theme_color": "#E11D48",
  "background_color": "#FFFBF5",
  "display": "standalone",
  "start_url": "/"
}
```

## 🚀 Performance Targets

- Lighthouse Score: 90+ on all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Core Web Vitals: All green

**Optimization Strategies**:
- Next.js Image optimization
- Dynamic imports for heavy components
- Server-side rendering for listing pages
- Edge caching with Vercel

## 🧪 Testing Strategy (Future)

1. **Unit Tests**: Utility functions, data transformations
2. **Integration Tests**: Server Actions, API routes
3. **E2E Tests**: Booking flows with Playwright
4. **Visual Regression**: Chromatic for component library

## 📈 Analytics Events (Future)

Key events to track:
- `mode_toggle`: User switches between Venues/Catering
- `search`: Search parameters submitted
- `venue_card_click`: Which venue was clicked
- `get_quote_submit`: Lead generation form submission
- `book_now_click`: Booking initiated
- `package_select`: Which catering tier selected
- `booking_complete`: Successful booking with amount

## 🔧 Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Future (when adding features)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
SMTP_HOST="..."
SMTP_USER="..."
SMTP_PASSWORD="..."
```

## 📝 Code Conventions

### File Naming
- Components: PascalCase (e.g., `VenueCard.tsx`)
- Pages: lowercase (e.g., `page.tsx`)
- Utilities: camelCase (e.g., `formatPrice.ts`)
- Types: PascalCase (e.g., `VenueCardProps`)

### Component Structure
```tsx
"use client"; // If using hooks/interactivity

import { ... } from "...";

interface ComponentProps {
  // Props definition
}

export function Component({ props }: ComponentProps) {
  // Logic
  return (
    // JSX
  );
}
```

### Prisma Conventions
- Model names: PascalCase singular (e.g., `User`, `Venue`)
- Field names: camelCase (e.g., `firstName`, `createdAt`)
- Enum names: SCREAMING_SNAKE_CASE (e.g., `USER_ROLE`)

## 🎓 Learning Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Shadcn UI](https://ui.shadcn.com/)

## 🐛 Known Issues & Limitations

1. **Disk Space Error**: npm install may fail due to insufficient disk space. Free up space before installing dependencies.

2. **No Authentication**: Currently no user authentication. All pages are public.

3. **Mock Data**: Venue and caterer cards use hardcoded data. Connect to database after setup.

4. **No Image Upload**: Image URLs are static. Implement Cloudinary or similar for uploads.

5. **No Search Functionality**: Search bar is UI-only. Implement with Prisma queries.

## 🎯 Next Sprint Priorities

### Sprint 1: Foundation (Week 1-2)
- [ ] Install dependencies successfully
- [ ] Set up PostgreSQL database (Supabase)
- [ ] Run Prisma migrations
- [ ] Seed database with sample data
- [ ] Test development server

### Sprint 2: Venues (Week 3-4)
- [ ] Venue detail page with photo gallery
- [ ] Calendar component for verified venues
- [ ] "Get Quote" form with validation
- [ ] "Book Now" flow (without payment)
- [ ] Search and filter functionality

### Sprint 3: Catering (Week 5-6)
- [ ] Caterer detail page
- [ ] Feast Builder (package selection)
- [ ] Menu item display with categories
- [ ] Guest count calculator
- [ ] Cart functionality

### Sprint 4: Owner Dashboard (Week 7-8)
- [ ] Authentication system
- [ ] Owner role and permissions
- [ ] Calendar OS interface
- [ ] Block date functionality
- [ ] Booking management

### Sprint 5: Polish (Week 9-10)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Wishlist functionality
- [ ] Reviews and ratings
- [ ] Performance optimization

---

**Last Updated**: January 11, 2026
**Status**: Project scaffolded, ready for npm install
