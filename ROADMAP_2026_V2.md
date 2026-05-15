# BookMyVenue Roadmap 2026 (V2)

## Objective
This roadmap replaces the older scattered planning notes and provides one clear sequence of completed and upcoming execution phases.

## Status Legend
- COMPLETED: Built, validated, and committed.
- ACTIVE: Implementation started in current cycle.
- PLANNED: Scoped but not started.

---

## Completed Phases (1-24)

### Foundation and Core (1-8) - COMPLETED
1. Auth, role access, and secure session flow
2. Venue and caterer CRUD APIs + dashboards
3. Booking core lifecycle and calendar blocking
4. Payment flow integration and confirmations
5. Reviews, wishlist, compare, and owner/admin operations
6. Fishbowl listing model + admin workflows
7. Payout, moderation, and audit administration
8. Stabilization of production-ready data flows

### Product Expansion (9-15) - COMPLETED
9. Event-type pricing on bookings (marriage/birthday/other)
10. Bengali menu builder architecture and templates
11. Partner trust tiers (LISTED/CLAIMED/VERIFIED/PREFERRED)
12. Google Maps and venue info enhancements
13. Location-aware homepage + proximity search
14. Inquiry assist flow for owners and users
15. Booking notification emails across status transitions

### Growth and Reliability (16-24) - COMPLETED
16. Retention campaign execution (settings + trigger + cron)
17. Caterer KYC verification workflow improvements
18. Advanced admin analytics with export
19. PWA push notification infrastructure
20. Phone OTP verification + Twilio re-enable
21. PWA offline queue + background sync
22. Admin dispute resolution dashboard (single actions)
23. Bulk dispute actions + audit logging
24. Performance optimization (Cloudinary URL transforms + caching path hardening)

---

## New Roadmap (25-32)

### Phase 25 - Refund Lifecycle Tracking - ACTIVE
Goal: Make dispute handling financially traceable end-to-end.

Scope:
- Add refund lifecycle controls (PENDING/PROCESSING/COMPLETED/FAILED)
- Persist refund reference IDs
- Update cancellation and payment records on refund completion
- Add refund lifecycle audit logs
- Show and edit refund lifecycle in admin dispute UI

Success Criteria:
- Admin can update refund status from disputes screen
- Refund status and reference are persisted per cancellation
- Payment refund statuses update when refund is completed
- Audit trail exists for every refund lifecycle change

### Phase 26 - Reconciliation Report Hub - PLANNED
Goal: Give finance a clean daily/weekly reconciliation surface.

Scope:
- Reconciliation API endpoint by date range
- Group by refund state and payout state
- CSV export for finance operations
- Mismatch flags (approved cancellation without completed refund)

### Phase 27 - Notification Reliability - PLANNED
Goal: Ensure message delivery consistency across email/SMS/push.

Scope:
- Retry strategy for failed sends
- Delivery status dashboard
- Alerting for repeated provider failures

### Phase 28 - Search Performance and Relevance - PLANNED
Goal: Improve conversion via better discovery.

Scope:
- Search relevance tuning
- Query caching strategy improvements
- Pagination and ranking optimization

### Phase 29 - Owner Self-Serve Operations - PLANNED
Goal: Reduce admin load by enabling safe owner controls.

Scope:
- Better owner-side booking action permissions
- Guided cancellation and refund request tools
- Owner dispute note trails

### Phase 30 - Observability and SLOs - PLANNED
Goal: Measure uptime and performance with enforceable targets.

Scope:
- Structured logs + error budgets
- Key API latency dashboards
- Incident classification and response checklist

### Phase 31 - Security Hardening - PLANNED
Goal: Raise platform security posture before scale.

Scope:
- Rate limiting coverage review
- Header/CORS policy hardening
- Session policy and secret hygiene checks

### Phase 32 - Production Scale Readiness - PLANNED
Goal: Prepare for high traffic and operational resilience.

Scope:
- Cache strategy review across hot endpoints
- Background job safety checks
- Deployment rollback and recovery playbook

---

## Execution Rules
1. Every phase must ship with code + validation + commit.
2. No phase is marked complete without type-check and lint pass.
3. Build validation is required, with known environment exceptions documented.
4. Audit-critical actions must include audit log coverage.
