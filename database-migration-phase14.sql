-- ============================================================
-- PHASE 14: Caterer Verification Flow — Supabase SQL Migration
-- Run in Supabase SQL Editor after unpausing the project
-- ============================================================

-- Add verification request tracking to Caterer table
ALTER TABLE "Caterer"
  ADD COLUMN IF NOT EXISTS "verificationRequestedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
