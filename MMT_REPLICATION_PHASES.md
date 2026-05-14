# MakeMyTrip Replication Plan (Happily Eated)

## Goal
Replicate the MakeMyTrip-style UX patterns across the full app (not homepage-only) while preserving current platform functionality.

## Visual/UX Principles to Match
- Sticky search summary bar on listing pages
- Horizontal action chips: sort, filters, smart filter, map-like actions
- Bottom-sheet interactions for sort/filter on mobile
- Card-first browsing with clear rating/price/location hierarchy
- Dense but readable mobile layout with strong blue CTA system
- Consistent typography, spacing, and icon rhythm across pages

## Phase 1: Shell, Branding, Typography, Header Controls
Status: In progress

Scope:
- Restore product name to Happily Eated in main shell
- Ensure current location is visible in mobile header on home
- Set app-wide font baseline to match travel marketplace style
- Normalize top-level listing filter/sort labels and remove garbled text

Deliverables:
- Home and desktop brand updated
- Mobile home header location field visible
- Global font switched to Lato
- Listing pages cleaned for consistent labels and color language

## Phase 2: Listings (Venues + Catering) Full MMT-Style Replication
Status: Planned

Scope:
- Unified sticky listing header with editable destination/date/guests summary
- MMT-like action chips row: sort by, smart filter, all filters, map
- Sort bottom sheet with radio options
- Multi-section filter sheet with category rail and applied filter counts
- Promotional strip + recommendation carousel modules
- Card redesign for venue/catering listing rows and grid sections

Deliverables:
- Venue listing fully replicated UX pattern
- Catering listing fully replicated UX pattern
- Shared listing UI components to keep behavior consistent

## Phase 3: Detail Pages (Venue + Catering) Full Replication
Status: Planned

Scope:
- Top image hero + sticky tab nav (overview, amenities, reviews, dining/rules)
- MMT-style info cards (ratings, location snippet, policy highlights)
- Sticky bottom booking CTA rail with price + primary action
- Review summary cards and nearby/similar suggestions
- Rule/policy and location sections with map card style parity

Deliverables:
- Venue detail and catering detail visual parity with listing language
- Unified detail action/footer CTA behavior on mobile

## Phase 4: Utility Pages + End-to-End Consistency
Status: Planned

Scope:
- Wishlist, bookings, compare flows updated to same design system
- Microcopy, iconography, and spacing consistency pass
- Accessibility pass (focus states, contrast, touch targets)
- Performance pass (image loading strategy, skeletons, transitions)

Deliverables:
- Full application visual consistency
- Final QA checklist and regression validation

## Phase 5: QA and Hardening
Status: Planned

Scope:
- Responsive audits across common mobile breakpoints
- Lint/type checks and visual regression checks
- Final polish for any page-level deviations from MMT pattern

Deliverables:
- Release-ready replication baseline
- Hand-off notes for future enhancements
