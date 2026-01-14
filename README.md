# 🎊 ShubhSpace - Wedding Marketplace

> *Your Dream Wedding, Simplified*

A production-ready, mobile-first wedding marketplace platform built with **Next.js 15**, combining venue booking (Airbnb-style) and catering services (Zomato-style).

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=flat-square&logo=prisma)

---

## 🎯 Features

### Dual-Sided Marketplace
- **Venue Booking Mode**: Browse and book wedding venues with hybrid inventory (verified and unverified listings)
- **Catering Mode**: Explore caterers with the "Feast Builder" menu customization system

### Key Highlights
- 🏰 **Hybrid Inventory Model**: Verified partners with exact pricing + unverified listings with estimated ranges
- 📅 **Calendar OS**: Owner dashboard for managing online bookings and blocking offline dates
- 🍛 **Feast Builder**: 4-tier menu packages (Silver, Gold, Diamond, Platinum)
- 📱 **Mobile-First**: Native app-like experience with bottom tab navigation
- 🎨 **Wedding-Themed UI**: Deep Rose, Gold, and Cream color palette

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Prisma ORM + PostgreSQL
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shubhspace"
```

3. **Set up Prisma**:
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with mobile nav
│   ├── page.tsx           # Home page with mode toggle
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Layout components
│   │   └── MobileNav.tsx  # Bottom tab navigation
│   ├── home/              # Home page components
│   │   └── ModeToggle.tsx # Venue/Catering switcher
│   ├── venue/             # Venue components
│   │   └── VenueCard.tsx  # Venue listing card
│   └── catering/          # Catering components
│       └── CatererCard.tsx # Caterer listing card
└── lib/
    ├── prisma.ts          # Prisma client instance
    └── utils.ts           # Utility functions

prisma/
└── schema.prisma          # Database schema
```

## 🗄️ Database Schema

The application uses a comprehensive schema supporting:
- **Users**: Multi-role system (USER, OWNER, ADMIN)
- **Venues**: Hybrid pricing model with verification status
- **Caterers**: Rating system with menu packages
- **MenuPackages**: 4-tier system with customizable items
- **Bookings**: Dual-type bookings for venues and catering
- **Reviews**: User feedback system
- **Wishlist**: Save favorite venues and caterers

## 🎨 Design System

### Color Palette
- **Primary (Rose)**: #E11D48
- **Secondary (Gold)**: #D4AF37
- **Background (Cream)**: #FFFBF5

### Mobile Navigation
- Fixed bottom tab bar (Home, Wishlist, Trips, Profile)
- Only visible on mobile devices

### Animations
- Smooth page transitions with Framer Motion
- Card hover effects
- Slide-in animations for mode switching

## 🚀 Development

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## 📝 Next Steps

1. **Set up Database**: Configure PostgreSQL (recommended: Supabase)
2. **Add Authentication**: Implement user login/signup with NextAuth.js
3. **Create Detail Pages**: Build venue and caterer detail pages
4. **Implement Booking Flow**: Add booking forms and payment integration
5. **Owner Dashboard**: Create calendar management interface
6. **Add Server Actions**: Implement data mutations with Next.js Server Actions

## 🤝 Contributing

This is a production-ready template. Customize it according to your business requirements.

## 📄 License

Private and Proprietary

---

Built with ❤️ for Indian Weddings
