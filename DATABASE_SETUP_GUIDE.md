# Quick Start: Database Setup Guide

## 🚀 Phase 1 Foundation - COMPLETED ✅

You now have all the foundation files ready! Here's what we've set up:

### ✅ What's Been Created:

1. **Database Client** (`/src/lib/db.ts`)
   - Singleton Prisma client with connection pooling
   - Development query logging

2. **Enhanced Prisma Schema** (`/prisma/schema.prisma`)
   - ✅ User model with KYC fields
   - ✅ NextAuth.js models (Account, Session, VerificationToken)
   - ✅ Enhanced Venue model (analytics, soft delete)
   - ✅ Booking model with payment tracking
   - ✅ Payment model for Razorpay integration
   - ✅ Proper roles: USER, VENUE_OWNER, CATERING_OWNER, ADMIN

3. **Seed Script** (`/prisma/seed.ts`)
   - Creates 4 test users (admin, venue owner, caterer, user)
   - Creates 2 sample venues
   - Creates 2 sample caterers with 3 packages each
   - All with realistic data

4. **API Client Utility** (`/src/lib/api-client.ts`)
   - Centralized fetch wrapper
   - Type-safe API calls
   - Error handling built-in
   - Methods for venues, catering, bookings, reviews, admin

5. **Environment Setup** (`.env.local.example`)
   - Template for all required environment variables
   - Database, NextAuth, Razorpay, Email, File Upload

6. **Dependencies Installed** ✅
   - next-auth
   - @auth/prisma-adapter
   - bcryptjs
   - tsx (for running TypeScript)

---

## 🎯 NEXT STEPS: Get Database Running

### Step 1: Choose Your Database (5 minutes)

**Option A: Supabase (Recommended for Development)**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub
4. Create new project:
   - Name: `shubhspace`
   - Database Password: (save this!)
   - Region: Choose closest to you
5. Wait 2-3 minutes for project to be ready
6. Go to Settings → Database
7. Copy **Connection String** (Pooling mode)
8. It looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

**Option B: Neon (Also Free)**
1. Go to https://neon.tech
2. Sign up
3. Create project
4. Copy connection string

**Option C: PlanetScale (Good for Production)**
1. Go to https://planetscale.com
2. Create database
3. Copy connection string

---

### Step 2: Set Up Environment Variables (2 minutes)

1. Create `.env.local` file in root:
```bash
# Copy from example
cp .env.local.example .env.local
```

2. Edit `.env.local` and update:
```bash
# Paste your database URL from Step 1
DATABASE_URL="postgresql://your-connection-string-here"

# Generate NextAuth secret:
# Run in terminal: openssl rand -base64 32
NEXTAUTH_SECRET="paste-generated-secret-here"

NEXTAUTH_URL="http://localhost:3000"
```

For now, you can leave the other variables (Razorpay, Email, etc.) commented out. We'll add them when needed.

---

### Step 3: Push Database Schema (1 minute)

```bash
# This creates all tables in your database
npm run db:push
```

You should see:
```
✔ Generated Prisma Client
🚀  Your database is now in sync with your Prisma schema
```

---

### Step 4: Seed Sample Data (1 minute)

```bash
# This adds test users and sample venues/caterers
npm run db:seed
```

You should see:
```
🌱 Starting database seed...
✅ Admin user created: admin@shubhspace.com
✅ Venue owner created: venue@shubhspace.com
✅ Catering owner created: caterer@shubhspace.com
✅ Regular user created: user@example.com
✅ Created 2 venues
✅ Created 2 caterers with packages
🎉 Database seed completed successfully!

📝 Test Accounts:
Admin: admin@shubhspace.com / admin123
Venue Owner: venue@shubhspace.com / owner123
Catering Owner: caterer@shubhspace.com / caterer123
User: user@example.com / user123
```

---

### Step 5: Verify Database (Optional)

```bash
# Opens Prisma Studio - visual database browser
npm run db:studio
```

Opens at http://localhost:5555 - you can see all your data!

---

## ✅ Verification Checklist

- [ ] Database created (Supabase/Neon/PlanetScale)
- [ ] `.env.local` file created with DATABASE_URL
- [ ] NEXTAUTH_SECRET generated and added
- [ ] `npm run db:push` completed successfully
- [ ] `npm run db:seed` completed successfully
- [ ] Can open Prisma Studio and see data

---

## 🚨 Common Issues & Fixes

### Issue 1: "Can't reach database server"
**Fix:** Check your DATABASE_URL is correct. Make sure:
- No extra spaces
- Password is correct
- Database is running (check Supabase dashboard)

### Issue 2: "Environment variable not found"
**Fix:** Make sure `.env.local` is in root directory (same level as package.json)

### Issue 3: "Prisma Client not generated"
**Fix:** Run:
```bash
npx prisma generate
```

### Issue 4: Seed fails with "Unique constraint"
**Fix:** Data already exists. To reset:
```bash
npx prisma db push --force-reset
npm run db:seed
```

---

## 📊 What's Next (Phase 1 Remaining Tasks)

Now that database is ready, we need to:

1. ✅ **Database Setup** - COMPLETE
2. ✅ **Enhanced Schema** - COMPLETE  
3. ✅ **Seed Data** - COMPLETE
4. ⏳ **NextAuth Configuration** - NEXT
5. ⏳ **API Routes** - After Auth
6. ⏳ **Update Frontend** - After APIs

**Next Action:** Create NextAuth.js configuration to enable real authentication!

---

## 🎯 Phase 1 Progress

```
Foundation (Database + Auth):
████████████░░░░░░░░ 60% Complete

Completed:
✅ Prisma schema enhanced
✅ Database client created
✅ Seed script with sample data
✅ API client utility
✅ Environment setup
✅ Dependencies installed

Remaining:
⏳ NextAuth.js configuration
⏳ API routes (venues, catering, bookings)
⏳ Update frontend to use APIs
```

**Time to complete remaining:** ~4-6 hours

---

## 📞 Need Help?

If you get stuck:
1. Check the error message carefully
2. Verify `.env.local` has correct values
3. Make sure database is accessible (Supabase should be running)
4. Check Prisma docs: https://www.prisma.io/docs

---

**Ready to continue? Let me know when your database is set up and we'll move to NextAuth.js configuration!** 🚀
