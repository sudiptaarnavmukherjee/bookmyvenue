-- ============================================================
-- PHASE 10: Bengali Menu Builder — Supabase SQL Migration
-- Run this in the Supabase SQL Editor after unpausing the project
-- ============================================================

-- 1. Create MenuVariant enum
DO $$ BEGIN
  CREATE TYPE "MenuVariant" AS ENUM ('NON_VEG', 'VEG', 'JAIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create MenuCategory table
CREATE TABLE IF NOT EXISTS "MenuCategory" (
  "id"        TEXT          NOT NULL PRIMARY KEY,
  "name"      TEXT          NOT NULL UNIQUE,
  "sortOrder" INTEGER       NOT NULL DEFAULT 0,
  "icon"      TEXT
);

CREATE INDEX IF NOT EXISTS "MenuCategory_sortOrder_idx" ON "MenuCategory"("sortOrder");

-- 3. Create MenuItemTemplate table
CREATE TABLE IF NOT EXISTS "MenuItemTemplate" (
  "id"          TEXT      NOT NULL PRIMARY KEY,
  "name"        TEXT      NOT NULL,
  "isVeg"       BOOLEAN   NOT NULL DEFAULT true,
  "isPopular"   BOOLEAN   NOT NULL DEFAULT false,
  "description" TEXT,
  "sortOrder"   INTEGER   NOT NULL DEFAULT 0,
  "categoryId"  TEXT      NOT NULL REFERENCES "MenuCategory"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MenuItemTemplate_categoryId_idx" ON "MenuItemTemplate"("categoryId");
CREATE INDEX IF NOT EXISTS "MenuItemTemplate_isVeg_idx"      ON "MenuItemTemplate"("isVeg");

-- 4. Alter MenuPackage — add variant, isTemplate, make catererId optional
ALTER TABLE "MenuPackage"
  ADD COLUMN IF NOT EXISTS "variant"    "MenuVariant" NOT NULL DEFAULT 'NON_VEG',
  ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN       NOT NULL DEFAULT false;

-- Make catererId nullable (needed for global template packages)
ALTER TABLE "MenuPackage"
  ALTER COLUMN "catererId" DROP NOT NULL;

-- Drop the existing foreign key constraint on catererId so we can allow NULLs
-- (Prisma will recreate it as optional)
DO $$ BEGIN
  ALTER TABLE "MenuPackage" DROP CONSTRAINT IF EXISTS "MenuPackage_catererId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Re-add as optional foreign key
ALTER TABLE "MenuPackage"
  ADD CONSTRAINT "MenuPackage_catererId_fkey"
  FOREIGN KEY ("catererId") REFERENCES "Caterer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for faster template lookups
CREATE INDEX IF NOT EXISTS "MenuPackage_isTemplate_idx"  ON "MenuPackage"("isTemplate");
CREATE INDEX IF NOT EXISTS "MenuPackage_variant_idx"     ON "MenuPackage"("variant");
