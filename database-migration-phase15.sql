-- ============================================================
-- PHASE 15: Phone OTP Verification — Supabase SQL Migration
-- Run in Supabase SQL Editor after unpausing the project
-- ============================================================

-- Add OTP fields to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phoneOtpCode"   TEXT,
  ADD COLUMN IF NOT EXISTS "phoneOtpExpiry" TIMESTAMPTZ;
