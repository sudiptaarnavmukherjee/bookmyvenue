import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { computeProviderAlerts } from "@/lib/notification-reliability";
import {
  buildServerTimingHeader,
  buildSloStatus,
  calculateAvailabilityPercent,
  calculateErrorBudget,
  logStructuredEvent,
  measureLatencyProbe,
} from "@/lib/observability";

export const dynamic = "force-dynamic";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(_req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      logStructuredEvent({
        level: "warn",
        event: "admin.observability.unauthorized",
        requestId,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since24h = hoursAgo(24);
    const since7d = daysAgo(7);
    const cancellationSlaBoundary = hoursAgo(48);

    const probeResults = await Promise.all([
      measureLatencyProbe(
        {
          key: "admin_stats",
          name: "Admin Stats",
          description: "Counts users, listings, and booking revenue totals.",
          targetMs: 180,
        },
        async () => {
          const [totalUsers, totalVenues, totalCaterers, totalBookings] = await Promise.all([
            prisma.user.count(),
            prisma.venue.count({ where: { deletedAt: null } }),
            prisma.caterer.count({ where: { isActive: true } }),
            prisma.booking.count(),
          ]);

          return { totalUsers, totalVenues, totalCaterers, totalBookings };
        }
      ),
      measureLatencyProbe(
        {
          key: "catalog_search",
          name: "Catalog Search",
          description: "Samples the public venue and caterer listing workload.",
          targetMs: 250,
        },
        async () => {
          const venueWhere = { deletedAt: null, isActive: true, isVerified: true };
          const catererWhere = { isActive: true, isVerified: true };
          const [venues, venueCount, caterers, catererCount] = await Promise.all([
            prisma.venue.findMany({ where: venueWhere, select: { id: true }, take: 12, orderBy: { viewCount: "desc" } }),
            prisma.venue.count({ where: venueWhere }),
            prisma.caterer.findMany({ where: catererWhere, select: { id: true }, take: 12, orderBy: { viewCount: "desc" } }),
            prisma.caterer.count({ where: catererWhere }),
          ]);

          return {
            sampleSize: venues.length + caterers.length,
            totalListings: venueCount + catererCount,
          };
        }
      ),
      measureLatencyProbe(
        {
          key: "booking_ops",
          name: "Booking Operations",
          description: "Loads recent bookings with cancellation state for owner and admin workflows.",
          targetMs: 240,
        },
        async () =>
          prisma.booking.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              venue: { select: { id: true, name: true } },
              caterer: { select: { id: true, name: true } },
              cancellationRequest: { select: { id: true, status: true, createdAt: true } },
            },
          })
      ),
      measureLatencyProbe(
        {
          key: "notifications",
          name: "Notification Reliability",
          description: "Aggregates recent email and SMS delivery outcomes.",
          targetMs: 160,
        },
        async () => {
          const [emailAttempts, smsAttempts, failedEmailCount, failedSmsCount] = await Promise.all([
            prisma.emailLog.count({
              where: { status: { in: ["SENT", "FAILED"] }, createdAt: { gte: since24h } },
            }),
            prisma.smsLog.count({
              where: { status: { in: ["SENT", "DELIVERED", "FAILED"] }, createdAt: { gte: since24h } },
            }),
            prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
            prisma.smsLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
          ]);

          return { emailAttempts, smsAttempts, failedEmailCount, failedSmsCount };
        }
      ),
      measureLatencyProbe(
        {
          key: "audit_trail",
          name: "Audit Trail",
          description: "Loads the recent audit stream used for admin investigations.",
          targetMs: 180,
        },
        async () =>
          prisma.auditLog.findMany({
            take: 20,
            orderBy: { createdAt: "desc" },
            select: { id: true, action: true, entityType: true, createdAt: true },
          })
      ),
    ]);

    const probes = probeResults.map((entry) => entry.probe);
    const healthyProbeCount = probes.filter((probe) => probe.status === "healthy").length;
    const degradedProbeCount = probes.filter((probe) => probe.status === "degraded").length;
    const criticalProbeCount = probes.filter((probe) => probe.status === "critical").length;
    const syntheticAvailabilityPercent = Number(((healthyProbeCount / probes.length) * 100).toFixed(2));
    const syntheticBudget = calculateErrorBudget(99.9, syntheticAvailabilityPercent);

    const [
      emailSuccess24h,
      emailFailed24h,
      smsSuccess24h,
      smsFailed24h,
      providerAlerts,
      openCancellationRequests,
      staleCancellationRequests,
      recentCancellationRequests,
      breachedCancellationRequests,
    ] = await Promise.all([
      prisma.emailLog.count({ where: { status: "SENT", createdAt: { gte: since24h } } }),
      prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
      prisma.smsLog.count({
        where: { status: { in: ["SENT", "DELIVERED"] }, createdAt: { gte: since24h } },
      }),
      prisma.smsLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
      computeProviderAlerts(6),
      prisma.cancellationRequest.count({ where: { status: "PENDING" } }),
      prisma.cancellationRequest.count({
        where: {
          status: "PENDING",
          createdAt: { lt: cancellationSlaBoundary },
        },
      }),
      prisma.cancellationRequest.count({ where: { createdAt: { gte: since7d } } }),
      prisma.cancellationRequest.count({
        where: {
          status: "PENDING",
          createdAt: {
            gte: since7d,
            lt: cancellationSlaBoundary,
          },
        },
      }),
    ]);

    const notificationAvailabilityPercent = calculateAvailabilityPercent(
      emailSuccess24h + smsSuccess24h,
      emailFailed24h + smsFailed24h
    );
    const cancellationSlaPercent = recentCancellationRequests === 0
      ? 100
      : Number(
          (((recentCancellationRequests - breachedCancellationRequests) / recentCancellationRequests) * 100).toFixed(2)
        );

    const serviceLevels = [
      {
        key: "synthetic_control_plane",
        name: "Synthetic Control Plane Availability",
        window: "Live synthetic probe set",
        description: "Tracks whether core admin, catalog, booking, notification, and audit workloads are responding within target thresholds.",
        targetPercent: 99.9,
        status: buildSloStatus(syntheticAvailabilityPercent, 99.9),
        errorBudget: syntheticBudget,
      },
      {
        key: "notification_delivery",
        name: "Notification Delivery Reliability",
        window: "Last 24 hours",
        description: "Uses email and SMS delivery outcomes to measure customer-facing delivery health.",
        targetPercent: 99,
        status: buildSloStatus(notificationAvailabilityPercent, 99),
        errorBudget: calculateErrorBudget(99, notificationAvailabilityPercent),
      },
      {
        key: "cancellation_response_sla",
        name: "Cancellation Response SLA",
        window: "Last 7 days",
        description: "Measures whether cancellation requests are resolved before the 48-hour review target is breached.",
        targetPercent: 95,
        status: buildSloStatus(cancellationSlaPercent, 95),
        errorBudget: calculateErrorBudget(95, cancellationSlaPercent),
      },
    ];

    const incidentChecklist = [
      {
        severity: "SEV-1",
        trigger: "Critical customer booking impact or admin control plane outage.",
        responseTarget: "Acknowledge in 15 minutes",
        actions: [
          "Stabilize the failing dependency or disable the affected workflow.",
          "Post owner/admin-facing status guidance and capture the request IDs involved.",
          "Assign an incident commander and start a decision log.",
        ],
      },
      {
        severity: "SEV-2",
        trigger: "Latency breach, provider degradation, or backlog growth without full outage.",
        responseTarget: "Acknowledge in 30 minutes",
        actions: [
          "Throttle or pause the noisy job, integration, or retry loop.",
          "Review recent structured logs and audit trail entries for shared request IDs.",
          "Escalate if customer impact grows beyond one workflow or channel.",
        ],
      },
      {
        severity: "SEV-3",
        trigger: "Minor degradation, single-tenant issue, or one-off provider failure.",
        responseTarget: "Triage within 4 hours",
        actions: [
          "Capture reproduction steps and tag the owner system involved.",
          "Schedule remediation in the next operating cycle.",
          "Convert repeated occurrences into a tracked reliability task.",
        ],
      },
    ];

    const overallStatus = criticalProbeCount > 0 || providerAlerts.length >= 2
      ? "critical"
      : degradedProbeCount > 0 || staleCancellationRequests > 0 || providerAlerts.length > 0
        ? "degraded"
        : "healthy";

    logStructuredEvent({
      level: overallStatus === "critical" ? "error" : overallStatus === "degraded" ? "warn" : "info",
      event: "admin.observability.snapshot",
      requestId,
      overallStatus,
      syntheticAvailabilityPercent,
      notificationAvailabilityPercent,
      openCancellationRequests,
      staleCancellationRequests,
      providerAlertCount: providerAlerts.length,
      probeCount: probes.length,
    });

    const response = NextResponse.json({
      generatedAt: new Date().toISOString(),
      requestId,
      overview: {
        status: overallStatus,
        healthyProbeCount,
        degradedProbeCount,
        criticalProbeCount,
        totalProbeCount: probes.length,
        syntheticAvailabilityPercent,
        staleCancellationRequests,
        openCancellationRequests,
        providerAlertCount: providerAlerts.length,
      },
      latency: {
        probes,
      },
      serviceLevels,
      operationalRisks: {
        failedNotifications24h: emailFailed24h + smsFailed24h,
        notificationSuccess24h: emailSuccess24h + smsSuccess24h,
        openCancellationRequests,
        staleCancellationRequests,
        providerAlerts,
      },
      incidentChecklist,
    });

    response.headers.set("Cache-Control", "no-store");
    response.headers.set("x-observability-request-id", requestId);
    response.headers.set("server-timing", buildServerTimingHeader(probes));
    return response;
  } catch (error) {
    logStructuredEvent({
      level: "error",
      event: "admin.observability.failed",
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to load observability data", requestId },
      { status: 500 }
    );
  }
}