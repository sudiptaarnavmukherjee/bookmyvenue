# Phase 3 - Retention Automation Foundation ✅

**Status:** Foundation & Infrastructure Complete  
**Commit:** 45c4638 (published to main)  
**Date:** May 15, 2026

---

## Overview

Phase 3 implements **Retention Automation** — a comprehensive lifecycle management system for BookMyVenue users. The phase focuses on keeping users engaged through strategic email touchpoints:

1. **Event Reminders** - Nudge users 7, 3, and 1 day before their booked events
2. **Post-Event Feedback** - Request reviews 1-2 days after completed events  
3. **Re-Engagement Campaigns** - Keep inactive users (60+ days without booking) coming back

---

## Database Schema Changes

### Booking Model (Extensions)

Added two new nullable datetime fields to track email sends:

```prisma
// Retention Email Tracking
reminderEmailSentAt DateTime?   // Pre-event reminder (7 days, 3 days, or 1 day before)
feedbackEmailSentAt DateTime?   // Post-event feedback request (1-2 days after event)
```

These fields prevent duplicate sends and enable audit trails.

### New Model: RetentionCampaign

```prisma
model RetentionCampaign {
  id            String    @id @default(cuid())
  
  userId        String
  user          User      @relation("RetentionCampaigns", ...)
  
  bookingId     String?   // Optional link to booking if applicable
  booking       Booking?  @relation("BookingRetention", ...)
  
  campaignType  String    // EVENT_REMINDER, POST_EVENT_FEEDBACK, RE_ENGAGEMENT, BIRTHDAY_OFFER
  emailSentAt   DateTime?
  emailOpenedAt DateTime?
  emailClickedAt DateTime?
  
  status        String    @default("PENDING")  // PENDING, SENT, OPENED, CLICKED, BOUNCED, FAILED
  emailId       String?   // External provider ID (Resend, SendGrid, etc.)
  
  metadata      Json?     // Campaign-specific context
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Purpose:** Centralized tracking for all retention campaigns, enabling:
- Email engagement analytics (opens, clicks)
- Campaign history per user
- Fraud detection (repeated fails)
- Future Webhook integration for bounce/complaint tracking

---

## Email Templates (Phase 3)

### 1. Event Reminder Email

**When:** Sent 7, 3, and 1 day before confirmed booking event date  
**For:** Users with CONFIRMED status bookings  
**Content:**
- Countdown ("Your event is in 3 days!")
- Booking details (venue, date, guest count)
- Pre-event checklist (confirm guest count, special requests, etc.)
- CTA: View booking details button

**Prevents:** Double sends via `reminderEmailSentAt` tracking

---

### 2. Post-Event Feedback Email

**When:** Sent 1-2 days after event date (for COMPLETED bookings)  
**For:** Users who attended their event  
**Content:**
- Warm thank you message
- Feedback request (rate experience, share thoughts)
- Review submission link
- Secondary CTA: Browse venues again

**Strategy:** Captures the "glow" period after successful event for maximum review likelihood.

---

### 3. Re-Engagement Campaign Email

**When:** Sent to inactive users (60+ days without new booking)  
**For:** Active USER role accounts (not owners/admins)  
**Content:**
- "We miss you" messaging
- Highlights of new venues added since
- Personalized section for saved venues (wishlist)
- Dual CTAs: Browse venues + View saved venues

**Frequency:** Once per 60-day cycle (prevents spam)

---

## Implementation: Core Files

### [src/lib/retention.ts] (160 lines)

**Main retention service with 4 exported functions:**

1. **processEventReminders()**
   - Finds CONFIRMED bookings within 7, 3, 1 day windows
   - Sends emails only if not already sent (reminderEmailSentAt null)
   - Marks Booking.reminderEmailSentAt and creates RetentionCampaign record
   - Returns: `{ sent: number, failed: number, updated: number }`

2. **processPostEventFeedback()**
   - Finds COMPLETED bookings 1-2 days past eventDate
   - Sends feedback request if not already sent
   - Creates campaign record for tracking
   - Returns: `{ sent: number, failed: number }`

3. **processReEngagementCampaigns(inactiveDaysThreshold = 60)**
   - Identifies users with no recent bookings over threshold
   - Excludes banned/inactive users
   - Prevents duplicate campaigns (checks last 60 days for prior sends)
   - Creates campaign record with metadata

4. **runRetentionAutomation()**
   - Orchestrator function that:
     - Calls all three campaign processors in parallel
     - Aggregates results
     - Logs completion summary
     - Can be called periodically or on-demand

---

### [src/lib/email.ts] (Extended)

**Added to EmailTemplate type:**
```typescript
| "event_reminder"
| "post_event_feedback"
| "re_engagement"
```

**3 New Template Functions:**
- `eventReminderTemplate()` - 45 lines HTML email
- `postEventFeedbackTemplate()` - 40 lines HTML email  
- `reEngagementTemplate()` - 50 lines HTML email

**3 New Helper Exports:**
- `sendEventReminder()` - Send pre-event reminder to customer
- `sendPostEventFeedback()` - Send post-event feedback request
- `sendReEngagementEmail()` - Send re-engagement campaign

All use same baseTemplate styling (glass-morphism, brand colors, responsive).

---

### [src/app/api/admin/retention/trigger/route.ts] (40 lines)

**Public API endpoint for triggering retention jobs**

**POST /api/admin/retention/trigger**
- Requires: `Authorization: Bearer {RETENTION_AUTOMATION_SECRET}`
- Response: `{ success, message, results, timestamp }`
- Calls `runRetentionAutomation()` and returns aggregated metrics

**GET /api/admin/retention/trigger**
- Health check for monitoring

**Use Cases:**
- External cron services (EasyCron, AWS Lambda, GCP Cloud Scheduler)
- Manual trigger for testing/debugging
- Integration with APScheduler or node-schedule if internal scheduler needed

---

### [prisma/schema.prisma] (5 additions)

1. Booking.reminderEmailSentAt
2. Booking.feedbackEmailSentAt
3. Booking.retentionCampaigns relation
4. User.retentionCampaigns relation  
5. RetentionCampaign model (with indexes on userId, bookingId, campaignType, status, emailSentAt)

---

## How to Deploy / Run

### Option A: External Cron Service (EasyCron)
1. Create EasyCron account (free tier available)
2. Set URL: `https://bookmyvenue.vercel.app/api/admin/retention/trigger`
3. Add header: `Authorization: Bearer {RETENTION_AUTOMATION_SECRET}`
4. Schedule: Daily at 6 AM UTC (or preferred time)

### Option B: Vercel Crons (Recommended for Vercel host)
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/admin/retention/trigger",
    "schedule": "0 6 * * *"
  }]
}
```

### Option C: Node-based Scheduler (Self-hosted)
```typescript
import cron from 'node-cron';
import { runRetentionAutomation } from '@/lib/retention';

// Every day at 6 AM
cron.schedule('0 6 * * *', async () => {
  await runRetentionAutomation();
});
```

---

## Environment Variables

Add to `.env`:
```
RETENTION_AUTOMATION_SECRET=your-secure-random-token
```

Generate secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Testing Checklist

### Unit Tests (Recommended Next)
- [ ] Verify processEventReminders() correctly identifies 7/3/1 day bookings
- [ ] Verify reminderEmailSentAt prevents duplicate sends
- [ ] Verify processPostEventFeedback() targets completed bookings 1-2 days post
- [ ] Verify processReEngagementCampaigns() finds inactive users correctly
- [ ] Verify campaign records are created properly

### Integration Tests
- [ ] Create test booking, advance time, trigger function, verify email sent
- [ ] Verify API endpoint authentication (missing/invalid token returns 401)
- [ ] Verify successful response format: `{ success: true, results: {...} }`

### Manual Testing
- [ ] Create test user account
- [ ] Create test booking with date 5 days out
- [ ] Manually call POST /api/admin/retention/trigger with valid token
- [ ] Check RetentionCampaign record created
- [ ] Verify email appeared in Resend/email provider logs

### Production Readiness
- [ ] [ ] Database migration applied to Supabase
- [ ] [ ] RETENTION_AUTOMATION_SECRET env var set in Vercel
-[ ] [ ] Cron service configured (EasyCron or Vercel)
- [ ] [ ] Email templates tested with real user data
- [ ] [ ] Monitoring alerts set for campaign failures

---

## Metrics & Monitoring

Track these KPIs post-launch:

| Metric | Target | Check |
|--------|--------|-------|
| Event Reminder Send Rate | > 95% | `results.eventReminders.sent` |
| Post-Event Feedback Send Rate | > 90% | `results.postEventFeedback.sent` |
| Re-Engagement Campaign Send Rate | > 85% | `results.reEngagement.sent` |
| Email Delivery Rate | > 95% | Monitor Resend dashboard |
| Review Conversion (Feedback emails) | > 20% | Track via booking.review relation |

---

## Phase 3 Remaining Tasks

After foundation is validated:

### Task 6: Admin Settings Panel
- [ ] Add admin UI to configure:
  - Retention automation on/off toggle
  - Days before/after thresholds
  - Re-engagement inactivity threshold
  - Email template customization
- [ ] New page: /admin/retention-settings

### Task 7: End-to-End Testing  
- [ ] Create comprehensive test suite
- [ ] Test with real date scenarios
- [ ] Verify campaign creation and email sends
- [ ] Monitor in production for 1 week post-deploy

### Future (Phase 3+)
- Birthday/Anniversary email campaigns
- Seasonal offer emails
- Email engagement dashboard
- A/B testing support for email templates
- SMS fallback for non-openers
- Complaint/bounce handling via webhooks

---

## Success Criteria ✅

**Foundation Phase (COMPLETE):**
- ✅ Schema supports retention tracking fields
- ✅ Email templates created for all 3 campaigns
- ✅ Retention service with business logic
- ✅ API endpoint for triggering jobs
- ✅ Code compiles cleanly
- ✅ Published to GitHub (commit 45c4638)

**Next Phase (In Progress):**
- [ ] Database migration applied
- [ ] Cron service configured
- [ ] Integration tests passing
- [ ] Manual testing with real bookings
- [ ] Admin settings panel built
- [ ] Production monitoring set up

---

## Code Quality

- **TypeScript:** Strict mode throughout
- **Error Handling:** Try-catch blocks with logging
- **Database:** Prisma types guarantee compile safety
- **Email Service:** Resend integration with fallback
- **Logging:** Console logs for audit trail (can be enhanced with Winston/Pino)

**Build Status:** ✅ All checks passing (exit code 0)

---

## Commit History

```
45c4638 feat(phase3): add retention automation foundation
fe663f9 feat(phase2): add user trips analytics dashboard
415a0ed feat(phase2): add reusable inquiry form
809539e feat(phase2): add owner insights UI and notifications
```

---

## Next: Phase 3 Continuation

Ready to move forward with:
1. Admin retention settings panel (Task 6)
2. Integration testing & cron setup
3. Production deployment
4. Monitoring & optimization

Or pivot to:
- Phase 4: Enhanced user inquiry management
- Phase 5: Advanced analytics with charts
- Other feature phases as needed
