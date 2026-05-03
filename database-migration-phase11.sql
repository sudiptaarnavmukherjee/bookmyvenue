-- ============================================================
-- PHASE 11: Maps — Supabase SQL Migration
-- Run in Supabase SQL Editor after unpausing the project
-- ============================================================

-- Add googleMapsUrl to Venue table
ALTER TABLE "Venue"
  ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;

-- Add googleMapsUrl to Caterer table
ALTER TABLE "Caterer"
  ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
