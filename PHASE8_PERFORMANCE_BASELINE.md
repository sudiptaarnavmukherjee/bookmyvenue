# Phase 8 Performance Baseline

Date: 2026-05-14

## What Was Set Up
- Added bundle analysis support via `@next/bundle-analyzer`.
- Added cross-platform analyze script via `cross-env`.
- Added script in `package.json`:
  - `analyze`: `cross-env ANALYZE=true next build`
- Enabled analyzer in `next.config.ts` behind `ANALYZE=true`.

## Optimization Applied In This Step
- Decoupled footer rendering from client-only shell.
- `src/components/layout/LayoutShell.tsx` now only mounts dynamic client UI.
- `src/app/layout.tsx` now renders footer directly in server layout.

## Optimization Iteration 2 (Admin Add/Edit Code Splitting)
- Switched `ImageUploader` and `LocationPicker` to dynamic imports in:
  - `src/app/admin/venues/add/page.tsx`
  - `src/app/admin/caterers/add/page.tsx`
  - `src/app/admin/venues/[id]/edit/page.tsx`
  - `src/app/admin/caterers/[id]/edit/page.tsx`
- Goal: avoid eager-loading upload/maps-heavy components on initial admin form render.

## Iteration 2 Result Summary
- `/admin/caterers/add`: **170 kB -> 128 kB** (`-42 kB`)
- `/admin/venues/add`: **170 kB -> 128 kB** (`-42 kB`)
- `/admin/venues/[id]/edit`: **169 kB -> 127 kB** (`-42 kB`)
- `/admin/caterers/[id]/edit`: **169 kB -> 127 kB** (`-42 kB`)
- Shared First Load JS remains **101 kB**.

## Iteration 2.1 (Active Admin Image Path Cleanup)
- Replaced `<img>` with `next/image` in:
  - `src/app/admin/venues/add/page.tsx`
  - `src/app/admin/caterers/add/page.tsx`
- Result: lint warnings for `<img>` in these two active admin add routes are removed.

## Iteration 3 (Middleware Bundle Reduction)
- Replaced `withAuth` wrapper usage with explicit middleware using `getToken` from `next-auth/jwt` in `src/middleware.ts`.
- Kept auth/role redirects intact for:
  - `/dashboard`, `/admin`, `/venue-owner`, `/catering-owner`
  - `/auth/signin`, `/auth/signup`

## Iteration 3 Result Summary
- Middleware bundle: **59.3 kB -> 53.6 kB** (`-5.7 kB`, ~9.6% reduction)
- Shared First Load JS remains **101 kB**.

## Iteration 4 (Active-Path Hook Stabilization)
- Fixed high-impact exhaustive-deps warnings in active runtime paths:
  - `src/app/admin/analytics/page.tsx` (memoized analytics fetch + effect deps)
  - `src/components/admin/LocationPicker.tsx` (moved fallback locations constant to module scope)
  - `src/app/catering-owner/page.tsx` (memoized `fetchData`, removed stale state capture)
  - `src/app/venue-owner/page.tsx` (memoized `fetchData`, removed stale state capture)

## Iteration 4 Result Summary
- Removed active warning noise for:
  - admin analytics page effect deps
  - catering owner page effect deps
  - venue owner page effect deps
  - location picker callback deps
- Build and lint remain green with baseline legacy warnings still present.
- Performance metrics stayed stable:
  - Shared First Load JS: **101 kB**
  - Middleware: **53.6 kB**
  - `/catering-owner`: **6.04 kB / 122 kB first load**
  - `/venue-owner`: **5.96 kB / 158 kB first load**

## Iteration 5 (Owner Dashboard Module Splitting)
- Converted heavy owner dashboard dependencies to dynamic imports:
  - `src/app/venue-owner/page.tsx`:
    - `AvailabilityCalendar`
    - `BlockDateModal`
    - `EarningsDashboard`
  - `src/app/catering-owner/page.tsx`:
    - `AvailabilityCalendar`
    - `BlockDateModal`
- Goal: load tab/modal-specific code only when those views are opened.

## Iteration 5 Result Summary
- `/venue-owner` first-load JS: **158 kB -> 117 kB** (`-41 kB`)
- `/catering-owner` first-load JS: **122 kB -> 120 kB** (`-2 kB`)
- Shared First Load JS remains **101 kB**.
- Middleware remains **53.6 kB**.

## Iteration 6 (Route-Gated Global Shell)
- Updated `src/components/layout/LayoutShell.tsx` to gate global shell components by pathname.
- Changes:
  - Hide desktop/mobile nav and install banner on admin, owner, dashboard, and auth routes.
  - Render compare bar only on venue/catering browsing paths.
- Goal: prevent non-relevant global UI from loading on dashboard-heavy routes.

## Iteration 6 Result Summary
- Shared First Load JS remains **101 kB** (no shared-chunk drop yet).
- Route-level improvements observed:
  - `/admin`: **8.02 kB -> 7.94 kB**
  - `/venue-owner`: **6.55 kB -> 6.47 kB** (First Load JS stays **117 kB**)
  - `/catering-owner`: **9.26 kB -> 9.18 kB** (First Load JS stays **120 kB**)
- Middleware remains **53.6 kB**.

## Iteration 7 (Route-Gated Compare Provider)
- Added `src/components/providers/CompareProviderGate.tsx` to scope compare state to browsing paths only.
- Updated `src/app/layout.tsx` so `CompareProvider` only wraps `/venues*` and `/catering*` flows.
- Goal: keep compare state off admin/auth/owner/dashboard routes.

## Iteration 7 Result Summary
- Shared First Load JS remains **101 kB**.
- Route-level improvements observed:
  - `/admin`: **7.94 kB -> 7.94 kB** (stable)
  - `/catering-owner`: **9.18 kB -> 9.18 kB** (stable)
  - `/venue-owner`: **6.47 kB -> 6.47 kB** (stable)
- No shared-chunk reduction yet, but compare state is now scoped to the routes that actually need it.

## Baseline Build Metrics
From latest production build output:
- Shared First Load JS: 101 kB
- Middleware: 59.3 kB
- Homepage route `/`: 11.4 kB page payload, 134 kB first load
- Heaviest first-load routes observed:
  - `/admin/caterers/add`: 170 kB
  - `/admin/venues/add`: 170 kB
  - `/admin/venues/[id]/edit`: 169 kB
  - `/admin/caterers/[id]/edit`: 169 kB

## Analyzer Artifacts
Generated files:
- `.next/analyze/client.html`
- `.next/analyze/nodejs.html`
- `.next/analyze/edge.html`

Note for Windows + OneDrive:
- If `npm run analyze` fails with `EINVAL ... readlink ... .next/diagnostics/framework.json`, clear `.next` and rerun.

## Observed Risks / Noise
- Build succeeds with existing lint warnings in legacy and admin-heavy files.
- Build logs include transient database connectivity errors during sitemap/data collection, but static generation still completed.

## Next Optimization Targets (Priority Order)
1. Reduce middleware edge bundle (`src/middleware.ts`, currently 59.3 kB) by simplifying auth/redirect checks and eliminating non-essential logic.
2. Convert remaining `<img>` usage in active routes/components to `next/image` for better LCP.
3. Resolve high-frequency React hook dependency warnings in active paths to avoid stale closures and hidden re-renders.
4. Re-run `npm run analyze` after each patch and maintain a route-level delta table in this file.
