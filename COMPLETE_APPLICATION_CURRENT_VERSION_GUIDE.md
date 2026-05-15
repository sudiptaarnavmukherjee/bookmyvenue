# BookMyVenue Current Version Guide (Code-Aligned)

This document explains how the current application behaves based on the implemented code paths, role protection, API contracts, and operational tooling.

It is designed so that product, QA, and engineering can read one file and understand:
- what each role can do,
- how core journeys run from UI to API,
- what status transitions are expected,
- what reliability and security guardrails are active,
- how to validate behavior from the UI.

## 1) Product and Architecture Snapshot

BookMyVenue is a multi-role marketplace for:
- venue discovery and booking,
- catering discovery and booking,
- wishlist and profile management,
- booking lifecycle operations (customer, owner, admin),
- payment processing and verification,
- cancellation and dispute handling,
- operational reliability through observability and cron automation.

Primary stack:
- Next.js App Router + React + TypeScript
- NextAuth (JWT strategy) for authentication/session
- Prisma + PostgreSQL for persistence
- Tailwind UI components for frontend

Core execution model:
- Server-rendered and client-interactive pages under src/app
- Role-protected pages using middleware
- API routes under src/app/api
- Shared API helper in src/lib/api-client.ts

## 2) Role and Access Model

### Roles
- USER
- VENUE_OWNER
- CATERING_OWNER
- ADMIN

### Route access enforcement
Middleware applies guardrails on protected paths:
- protected: /dashboard, /admin, /venue-owner, /catering-owner, /bookings, /profile, /wishlist
- auth routes: /auth/signin and /auth/signup redirect to role home if already logged in
- role mismatch redirects to home or role home

Expected behavior:
- unauthenticated access to protected routes redirects to sign-in with callbackUrl
- authenticated users hitting sign-in/sign-up are redirected to their role home

## 3) Authentication and Account Flows

## 3.1 Sign up
UI:
- /auth/signup

Flow:
1. User submits name, email, password, role (USER, VENUE_OWNER, CATERING_OWNER)
2. API POST /api/auth/signup validates payload
3. Admin role creation is blocked from public signup
4. Password is hashed and user is created
5. UI attempts auto sign-in via credentials

Important behavior:
- API minimum password check is 6 chars
- Sign-up page enforces minimum 8 chars in UI
- This is a UI/API validation mismatch; API remains authoritative for direct calls

## 3.2 Sign in
UI:
- /auth/signin

Flow:
- Supports credentials and Google sign-in
- Callback URL is sanitized to internal paths only
- After successful sign-in, role-driven redirect:
  - ADMIN -> /admin
  - VENUE_OWNER -> /venue-owner
  - CATERING_OWNER -> /catering-owner
  - USER -> /

## 3.3 Phone verification
UI:
- /auth/verify-phone
- also available in profile for unverified phone

APIs:
- POST /api/auth/send-phone-otp
- POST /api/auth/verify-phone-otp

Behavior:
- OTP is 6 digits and expires in 10 minutes
- resend throttle is enforced (roughly 60-second floor)
- phone must pass Indian mobile validation
- Twilio is used if credentials exist; in dev, OTP logs to server console
- successful verification sets phoneVerified and clears OTP fields

## 4) Customer (USER) Journeys

## 4.1 Discovery and listing consumption
Key surfaces:
- Home page with featured content and nearby suggestions
- Venue detail pages and catering detail pages

Nearby API behavior:
- GET /api/nearby
- clamps query params for radius and result limits to controlled ranges
- returns venues or caterers sorted by distance
- uses differential cache-control depending on custom location vs default center

## 4.2 Wishlist
UI:
- /wishlist

API:
- GET /api/wishlist
- POST /api/wishlist
- DELETE /api/wishlist

Rules:
- auth required
- item can reference either venue or caterer, never both simultaneously
- duplicate additions are prevented

## 4.3 Profile
UI:
- /profile

API:
- GET /api/users/me
- PATCH /api/users/me

Rules:
- auth required
- changing phone resets verification state and OTP fields
- user can update name/phone/image

## 4.4 Booking creation
Customer can create bookings from listing flows.

API entry:
- POST /api/bookings

Expected behavior includes:
- authenticated user required
- payload validation for booking details
- booking record created with lifecycle statuses
- subsequent payment flow initiated from booking context

## 4.5 Payment flow
APIs:
- POST /api/payment/create-order
- POST /api/payment/verify

Behavior:
1. Create order endpoint validates booking/payment context and creates payment order intent
2. Client completes provider checkout
3. Verify endpoint validates payment signature and finalizes payment state
4. Booking/payment records transition to completed/paid path when verification succeeds
5. Notifications are triggered as part of booking/payment status handling

## 4.6 Booking history and actions
UI:
- /bookings

APIs:
- GET /api/bookings (role-aware list)
- PATCH /api/bookings/[id] (status updates under authorization rules)

Expected UX:
- user sees own bookings
- status updates are reflected in timeline/cards
- side effects can include emails/push and owner/admin visibility updates

## 5) Venue Owner Journeys

UI:
- /venue-owner

Core capabilities in current implementation:
- owner dashboard visibility into booking pipeline
- booking actions through owner booking endpoint
- cancellation-related owner operations and note/dispute collaboration
- pricing and listing management areas connected through owner surfaces

API focus:
- PATCH/ops via /api/owner/bookings/[id]

Expected behavior:
- only booking-linked owner can perform owner actions
- owner action updates booking/cancellation request states according to allowed transitions
- owner notes and dispute metadata are retained for admin review

## 6) Catering Owner Journeys

UI:
- /catering-owner

Core capabilities:
- catering owner dashboard with booking queue and revenue/progress visibility
- booking workflow actions similar to venue-owner lifecycle
- menu/pricing related management integrated into owner experience

Authorization principle:
- owner can only act on resources they own
- role mismatch or ownership mismatch should deny or hide actions

## 7) Admin Journeys and Operations

## 7.1 Admin home
UI:
- /admin

Aggregates:
- platform counts and operational links
- cancellation/dispute/reliability/reconciliation entry points

## 7.2 Cancellation and disputes
Surfaces:
- admin cancellations APIs
- /admin/disputes page

Behavior:
- admin reviews and adjudicates cancellation requests
- admin can approve/reject and drive refund status lifecycle
- dispute records and notes are used for auditability and resolution context

## 7.3 Reconciliation hub
UI:
- /admin/reconciliation

API:
- GET /api/admin/reconciliation
- export endpoint for CSV report

What it computes:
- approved cancellation totals
- completed/pending/failed refund counts
- mismatch queue where refund expected but incomplete
- payment aggregates (total, owner amount, platform fee)
- payout status summary

Expected use:
- detect mismatch amount and unresolved refund backlog
- export data for finance review

## 7.4 Notification reliability
API:
- GET /api/admin/notification-reliability

Metrics:
- 24h sent/failed counts for email and SMS
- push subscription count
- retry queue size
- recent failed logs with retryability metadata
- provider alert signals

## 7.5 Observability dashboard
UI:
- /admin/observability

API:
- GET /api/admin/observability

What it provides:
- synthetic probes across admin stats, catalog search, booking ops, notification aggregation, audit trail
- probe-level latency and health grading
- SLO/error budget style summaries
- cancellation SLA risk indicators
- provider alert count and operational risk framing
- incident checklist guidance by severity tier
- server timing header and request correlation id

## 8) Reliability Automation and Scheduled Jobs

Cron endpoints:
- GET /api/cron/notification-retry
- GET /api/cron/retention

Safety mechanism:
- both cron routes are wrapped with lease-based cron safety
- prevents overlapping execution of same job window
- logs run identifiers and start/completion metadata

Notification retry job:
- re-attempts failed email/SMS notifications with configured limits

Retention job:
- runs retention automation according to policy routines

## 9) Security Hardening in Current Version

Security wrapper:
- withApiSecurity in src/lib/security.ts

Applied controls:
- CORS/origin validation for state-changing methods
- OPTIONS support with controlled allow-method headers
- security response headers (nosniff, referrer policy, COOP/CORP, origin-agent-cluster)
- per-endpoint rate limiting where configured
- no-store default cache control on sensitive APIs
- rate-limit headers for observability on constrained endpoints

Auth/session hardening:
- NextAuth JWT session max age reduced and updated for stricter session lifetime
- secure cookies enabled in production
- secret-driven token signing

## 10) Core Lifecycle State Transitions

## 10.1 Booking lifecycle (conceptual)
Typical transition path:
1. Booking created (pending/new)
2. Payment order created
3. Payment verified -> booking marked paid/confirmed path
4. Owner/admin actions may further transition status (confirm, cancel flow, dispute)

## 10.2 Cancellation lifecycle
1. Cancellation request opened
2. Admin/owner review path
3. Approved or rejected
4. If approved, refund processing transitions:
   - PENDING/PROCESSING -> COMPLETED or FAILED
5. Reconciliation surfaces unresolved mismatches

## 10.3 Notification lifecycle
1. Event triggers outbound notification
2. Provider attempt logged
3. Failure enters retry queue if retryable and within policy
4. Cron retry re-attempts delivery
5. Reliability metrics and provider alerts reflect degradation

## 11) UI Validation Runbook (Current Version)

Use these scenarios to verify behavior from frontend with expected outcomes.

## 11.1 Authentication
1. Sign up as USER, VENUE_OWNER, CATERING_OWNER
   - Expected: account created, auto sign-in, redirected to role-appropriate surface
2. Attempt admin sign-up via public form payload
   - Expected: API rejects with forbidden message
3. Sign in with invalid credentials
   - Expected: error shown, no redirect
4. Try opening /auth/signin while already logged in
   - Expected: redirected to role home

## 11.2 Route protection
1. Open /admin as non-admin user
   - Expected: redirected away from admin route
2. Open /bookings while logged out
   - Expected: redirected to sign-in with callbackUrl

## 11.3 Phone OTP
1. Send OTP with valid phone
   - Expected: success message
2. Resend immediately
   - Expected: throttle/rate-limit response
3. Verify wrong OTP
   - Expected: validation error
4. Verify correct OTP
   - Expected: phone marked verified in profile

## 11.4 Wishlist
1. Add venue to wishlist
   - Expected: item appears in /wishlist
2. Add same venue again
   - Expected: duplicate prevented
3. Remove item
   - Expected: removed from list and persisted

## 11.5 Booking and payment
1. Create a booking from listing flow
   - Expected: booking row created and appears in /bookings
2. Complete payment success path
   - Expected: payment verification succeeds and booking reflects paid progression
3. Force payment verification failure input
   - Expected: booking not incorrectly marked paid

## 11.6 Owner workflows
1. Login as venue owner and open dashboard
   - Expected: only own bookings/listings visible
2. Perform owner booking action
   - Expected: allowed transitions apply and customer/admin views reflect update
3. Repeat for catering owner
   - Expected: same ownership-constrained behavior

## 11.7 Admin operations
1. Open disputes page and process a dispute item
   - Expected: status and notes update, linked booking/cancellation context preserved
2. Open reconciliation page for month/week/year/all
   - Expected: metrics update by range, mismatch queue visible when present
3. Export reconciliation CSV
   - Expected: downloadable file with selected range naming
4. Open observability page
   - Expected: probe, SLO, and operational risk data displayed
5. Open notification reliability section
   - Expected: failed logs/retry queue/provider alerts populated as applicable

## 11.8 Cron and reliability
1. Trigger notification retry cron (safe environment)
   - Expected: run metadata logged; retries attempted
2. Trigger retention cron
   - Expected: run metadata logged; retention routine executes
3. Trigger same cron concurrently (if feasible)
   - Expected: lease safety prevents harmful overlap

## 12) Operational Caveats and Notes

- Some documentation files in repository may be historical; this guide tracks current runtime behavior paths reviewed in code.
- Password minimum differs between sign-up UI and sign-up API (8 vs 6 chars).
- OTP experience depends on Twilio env presence:
  - with Twilio: real SMS
  - without Twilio: development console logging
- Middleware route protections and API-level authorization both matter; API remains final authority.

## 13) Suggested Ongoing Maintenance for This Guide

After each roadmap phase, update this file sections:
1. affected role journeys,
2. new/changed API endpoints,
3. state transition changes,
4. reliability/security adjustments,
5. test scenarios for QA.

This keeps one living source of truth aligned with current production behavior.
