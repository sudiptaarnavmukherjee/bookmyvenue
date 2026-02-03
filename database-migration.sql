-- BookMyVenue Database Migration Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard > Your Project > SQL Editor
-- This will add all missing columns to sync with the Prisma schema

-- =====================================================
-- VENUE TABLE - Add missing columns
-- =====================================================

-- Fishbowl Model - Prime/Non-Prime Pricing
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "primeDayPrice" DOUBLE PRECISION;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "nonPrimeDayPrice" DOUBLE PRECISION;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "primeDays" TEXT;

-- Fishbowl Model - Admin Control
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "isAdminListed" BOOLEAN DEFAULT true;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "taggedToOwnerId" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "bookingEnabled" BOOLEAN DEFAULT false;

-- Verification & Status
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- Analytics
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "inquiryCount" INTEGER DEFAULT 0;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "weeklyViews" INTEGER DEFAULT 0;

-- SEO
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;

-- Deleted timestamp
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- =====================================================
-- USER TABLE - Add missing columns
-- =====================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "panNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycVerified" BOOLEAN DEFAULT false;

-- =====================================================
-- BOOKING TABLE - Add missing columns  
-- =====================================================

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookingNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "advanceAmount" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- =====================================================
-- CATERER TABLE - Add missing columns
-- =====================================================

ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "isAdminListed" BOOLEAN DEFAULT true;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "taggedToOwnerId" TEXT;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "bookingEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "inquiryCount" INTEGER DEFAULT 0;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "weeklyViews" INTEGER DEFAULT 0;
ALTER TABLE "Caterer" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- =====================================================
-- BLOCKED DATE TABLE - Add missing columns
-- =====================================================

ALTER TABLE "BlockedDate" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "BlockedDate" ADD COLUMN IF NOT EXISTS "isOnlineBooking" BOOLEAN DEFAULT false;

-- =====================================================
-- Create indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS "Venue_isAdminListed_idx" ON "Venue"("isAdminListed");
CREATE INDEX IF NOT EXISTS "Venue_isVerified_idx" ON "Venue"("isVerified");
CREATE INDEX IF NOT EXISTS "Caterer_isAdminListed_idx" ON "Caterer"("isAdminListed");
CREATE INDEX IF NOT EXISTS "Caterer_isVerified_idx" ON "Caterer"("isVerified");

-- =====================================================
-- SUCCESS! Your database is now synced.
-- =====================================================

SELECT 'Database migration completed successfully!' as status;
