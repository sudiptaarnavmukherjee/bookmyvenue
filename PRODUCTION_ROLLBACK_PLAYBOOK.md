# Production Rollback Playbook

## Goal
Use this playbook when a deployment causes customer-facing failures, background job instability, or broken admin workflows.

## Rollback Triggers
- Booking creation, payment verification, or owner/admin dashboards fail for multiple users.
- Cron jobs start overlapping, repeat work unexpectedly, or produce large retry backlogs.
- Error rate or latency stays above the operational threshold after a short mitigation attempt.
- A schema or environment change breaks page generation, API routes, or authentication.

## Immediate Stabilization
1. Pause new deploys and assign one incident owner.
2. Capture the failing deployment URL, recent commit SHA, and impacted routes.
3. If cron jobs are contributing to load, disable the Vercel cron schedule or remove the `CRON_SECRET` temporarily to block external execution.
4. If a third-party dependency is degraded, stop retries that amplify the issue before continuing recovery.

## Vercel Rollback Steps
1. Open the Vercel project dashboard.
2. Go to Deployments.
3. Find the last known healthy production deployment.
4. Promote or redeploy that version to production.
5. Confirm the restored deployment has the expected environment variables before traffic returns.

## Database and Migration Safety
- Do not roll back the database blindly.
- If the bad deploy included a schema change, first decide whether the code can be rolled back safely against the new schema.
- If not, prepare a forward fix or a targeted SQL revert for only the affected objects.
- Before manual SQL changes, export the affected table data or take a provider snapshot if available.

## Cache and Queue Recovery
1. Revalidate or purge CDN paths for homepage, listing, and detail endpoints if stale responses persist.
2. Check any cron-backed queues or retry dashboards for duplicate work created during the incident.
3. Drain or re-run only the items that are safe and idempotent after the stable deploy is live.

## Verification Checklist
- Sign in as admin and load the main admin dashboard.
- Load public venue and catering listings.
- Create or simulate one booking-related flow without completing a real payment.
- Confirm cron routes return expected auth or success responses.
- Verify observability and notification dashboards reflect recovery.

## Post-Incident Follow-Up
1. Record the broken deployment SHA, recovery SHA, and exact rollback time.
2. Document whether recovery used rollback, forward fix, config change, or manual DB repair.
3. Add any missing guardrail discovered during the incident to the roadmap or backlog.