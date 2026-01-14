# 🎨 ShubhSpace - Visual Design Guide

## Color Palette

### Primary Colors
```
┌─────────────────────────────────────┐
│  DEEP ROSE (Primary)                │
│  #E11D48                            │
│  rgb(225, 29, 72)                   │
│  Usage: CTAs, links, active states  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  GOLD (Secondary)                   │
│  #D4AF37                            │
│  rgb(212, 175, 55)                  │
│  Usage: Highlights, premium badges  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  CREAM WHITE (Background)           │
│  #FFFBF5                            │
│  rgb(255, 251, 245)                 │
│  Usage: Page backgrounds, cards     │
└─────────────────────────────────────┘
```

### Semantic Colors
```css
✅ Success:     #10B981 (Green-500)
❌ Error:       #EF4444 (Red-500)
⚠️  Warning:     #F59E0B (Amber-500)
ℹ️  Info:        #3B82F6 (Blue-500)
```

## Typography Scale

```
┌────────────────────────────────────────┐
│  HERO (48px)                           │
│  font-size: 3rem                       │
│  font-weight: 700 (bold)               │
│  Usage: Landing page headlines         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  H1 (30px)                             │
│  font-size: 1.875rem                   │
│  font-weight: 700 (bold)               │
│  Usage: Page titles                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  H2 (24px)                             │
│  font-size: 1.5rem                     │
│  font-weight: 700 (bold)               │
│  Usage: Section headers                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  H3 (18px)                             │
│  font-size: 1.125rem                   │
│  font-weight: 700 (bold)               │
│  Usage: Card titles                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Body (16px)                           │
│  font-size: 1rem                       │
│  font-weight: 400 (normal)             │
│  Usage: Main content                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Caption (14px)                        │
│  font-size: 0.875rem                   │
│  font-weight: 400/500                  │
│  Usage: Supporting text                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Micro (12px)                          │
│  font-size: 0.75rem                    │
│  font-weight: 400                      │
│  Usage: Labels, badges                 │
└────────────────────────────────────────┘
```

## Spacing System

```
┌──────────────────────────────────────────┐
│  SPACING SCALE (Tailwind)               │
├──────────────────────────────────────────┤
│  1  = 0.25rem (4px)   - Micro spacing   │
│  2  = 0.5rem  (8px)   - Tight spacing   │
│  3  = 0.75rem (12px)  - Compact         │
│  4  = 1rem    (16px)  - Base spacing    │
│  6  = 1.5rem  (24px)  - Comfortable     │
│  8  = 2rem    (32px)  - Section gap     │
│  12 = 3rem    (48px)  - Large sections  │
│  16 = 4rem    (64px)  - Page sections   │
│  20 = 5rem    (80px)  - Hero spacing    │
└──────────────────────────────────────────┘
```

### Common Patterns
```css
/* Card Padding */
p-4 (16px) - Compact cards
p-6 (24px) - Standard cards
p-8 (32px) - Large cards

/* Section Spacing */
py-8 (32px vertical) - Standard sections
py-12 (48px vertical) - Large sections

/* Grid Gaps */
gap-4 (16px) - Tight grid
gap-6 (24px) - Standard grid
gap-8 (32px) - Spacious grid
```

## Border Radius

```
┌─────────────────────────────────────┐
│  sm  = 0.125rem (2px)               │
│  Usage: Small elements              │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│  md  = 0.375rem (6px)                │
│  Usage: Buttons, inputs              │
└──────────────────────────────────────┘

┌────────────────────────────────────────┐
│  lg  = 0.5rem (8px)                    │
│  Usage: Cards, modals                  │
└────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  xl  = 0.75rem (12px)                    │
│  Usage: Large cards, primary buttons     │
└──────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  2xl = 1rem (16px)                         │
│  Usage: Feature cards, image containers    │
└────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  full = 9999px (circular)                    │
│  Usage: Pills, avatars, badges               │
└──────────────────────────────────────────────┘
```

## Shadows

```css
/* Card Shadow (Custom) */
.card-shadow {
  box-shadow: 
    0 4px 6px -1px rgba(225, 29, 72, 0.1),
    0 2px 4px -1px rgba(212, 175, 55, 0.06);
}

/* Standard Shadows */
shadow-sm   - Subtle elevation
shadow-md   - Medium elevation
shadow-lg   - High elevation
shadow-xl   - Very high elevation
```

## Component Anatomy

### VenueCard
```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │                                │  │ ← Image (aspect-[4/3])
│  │         Cover Image            │  │   rounded-t-2xl
│  │                                │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Venue Name (text-lg bold)     │  │
│  │  📍 City (text-sm)             │  │ ← Content (p-4)
│  │  👥 100-500 guests             │  │
│  │                                │  │
│  │  ₹75,000 (text-2xl bold rose) │  │
│  │                                │  │
│  │  [  Book Now  ] (button)      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
    rounded-2xl, card-shadow
```

### CatererCard
```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │                                │  │ ← Image (aspect-[4/3])
│  │      Food Cover Image          │  │   rounded-t-2xl
│  │                                │  │   [Pure Veg badge]
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Caterer Name (text-lg bold)   │  │
│  │  📍 City (text-sm)             │  │ ← Content (p-4)
│  │  ⭐ 4.8 (234 reviews)          │  │
│  │                                │  │
│  │  ₹450/plate (text-2xl)        │  │
│  │                                │  │
│  │  [  View Packages  ] (button) │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
    rounded-2xl, card-shadow
```

### MobileNav (Bottom Tab Bar)
```
┌──────────────────────────────────────────┐
│  [🏠]    [❤️]    [📅]    [👤]           │
│  Home  Wishlist Trips  Profile          │
└──────────────────────────────────────────┘
Fixed bottom-0, bg-white, border-t
Min height: 64px (safe for mobile)
Icon size: 24px (h-6 w-6)
Active state: text-rose-600
```

## Responsive Breakpoints

```
┌────────────────────────────────────────┐
│  MOBILE (Default)                      │
│  < 768px                               │
│  - Single column layout                │
│  - Bottom navigation visible           │
│  - Touch-friendly buttons (min 44px)   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  TABLET (md:)                          │
│  768px - 1024px                        │
│  - 2 column grid                       │
│  - Bottom nav hidden                   │
│  - Slightly larger cards               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  DESKTOP (lg:)                         │
│  > 1024px                              │
│  - 3 column grid                       │
│  - Full navigation                     │
│  - Max width: 1152px (max-w-6xl)       │
└────────────────────────────────────────┘
```

## Animation Patterns

### Framer Motion Variants

```tsx
// Card Hover
<motion.div
  whileHover={{ y: -4 }}
  transition={{ duration: 0.2 }}
>

// Page Transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Fade In
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

## Icon Usage

### Lucide React Icons
```tsx
import {
  Home,           // Home/Dashboard
  Heart,          // Wishlist/Favorites
  Calendar,       // Bookings/Trips
  User,           // Profile/Account
  Search,         // Search functionality
  MapPin,         // Location
  Star,           // Rating
  Building2,      // Venues
  UtensilsCrossed,// Catering
  CheckCircle2,   // Verified badge
  Leaf,           // Pure Veg badge
  Users,          // Guest capacity
} from "lucide-react";
```

### Icon Sizes
```css
h-4 w-4  (16px) - Small (inline with text)
h-5 w-5  (20px) - Medium (buttons, badges)
h-6 w-6  (24px) - Large (navigation, headers)
h-8 w-8  (32px) - Extra large (hero sections)
```

## Button Styles

### Primary Button
```tsx
className="
  w-full rounded-xl 
  bg-rose-600 text-white 
  py-3 px-6 
  font-semibold 
  hover:bg-rose-700 
  transition-colors
"
```

### Secondary Button
```tsx
className="
  w-full rounded-xl 
  bg-gold-600 text-white 
  py-3 px-6 
  font-semibold 
  hover:bg-gold-700 
  transition-colors
"
```

### Outline Button
```tsx
className="
  w-full rounded-xl 
  border-2 border-rose-600 
  text-rose-600 
  py-3 px-6 
  font-semibold 
  hover:bg-rose-50 
  transition-colors
"
```

## Image Guidelines

### Aspect Ratios
```
Venue Cards:     4:3  (landscape)
Caterer Cards:   4:3  (landscape)
Detail Gallery:  16:9 (widescreen)
Thumbnails:      1:1  (square)
```

### Image Optimization
```tsx
<Image
  src={coverImage}
  alt={name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 
         (max-width: 1024px) 50vw, 
         33vw"
  priority={index < 3} // First 3 images
/>
```

## Accessibility

### Color Contrast
```
✅ Rose (#E11D48) on White: 5.4:1 (AA)
✅ Gold (#D4AF37) on White: 3.5:1 (AA Large)
✅ Dark Gray (#1F2937) on Cream: 12.6:1 (AAA)
```

### Touch Targets
```
Minimum: 44x44px (iOS/Android standard)
Recommended: 48x48px
Spacing: 8px between targets
```

### Focus States
```css
/* Add to interactive elements */
focus:outline-none
focus:ring-2
focus:ring-rose-500
focus:ring-offset-2
```

---

**Pro Tip**: Use this guide while building new components to maintain visual consistency!
