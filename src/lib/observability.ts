type LogLevel = "info" | "warn" | "error";

export type ProbeStatus = "healthy" | "degraded" | "critical";

export type LatencyProbe = {
  key: string;
  name: string;
  description: string;
  targetMs: number;
  latencyMs: number;
  status: ProbeStatus;
};

type StructuredLogPayload = {
  level: LogLevel;
  event: string;
  requestId?: string;
  timestamp: string;
  [key: string]: unknown;
};

export function classifyLatency(latencyMs: number, targetMs: number): ProbeStatus {
  if (latencyMs <= targetMs) {
    return "healthy";
  }

  if (latencyMs <= targetMs * 1.5) {
    return "degraded";
  }

  return "critical";
}

export async function measureLatencyProbe<T>(
  probe: Omit<LatencyProbe, "latencyMs" | "status">,
  fn: () => Promise<T>
): Promise<{ probe: LatencyProbe; result: T }> {
  const startedAt = performance.now();
  const result = await fn();
  const latencyMs = Number((performance.now() - startedAt).toFixed(1));

  return {
    result,
    probe: {
      ...probe,
      latencyMs,
      status: classifyLatency(latencyMs, probe.targetMs),
    },
  };
}

export function logStructuredEvent(payload: Omit<StructuredLogPayload, "timestamp">) {
  const line = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });

  if (payload.level === "error") {
    console.error(line);
    return;
  }

  if (payload.level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function calculateAvailabilityPercent(successCount: number, failureCount: number) {
  const total = successCount + failureCount;
  if (total === 0) {
    return 100;
  }

  return Number(((successCount / total) * 100).toFixed(2));
}

export function calculateErrorBudget(targetPercent: number, actualPercent: number) {
  const allowedFailurePercent = Math.max(0, 100 - targetPercent);
  const consumedFailurePercent = Math.max(0, 100 - actualPercent);
  const remainingFailurePercent = Math.max(0, allowedFailurePercent - consumedFailurePercent);
  const consumedPercent =
    allowedFailurePercent === 0
      ? consumedFailurePercent > 0
        ? 100
        : 0
      : Number(((consumedFailurePercent / allowedFailurePercent) * 100).toFixed(2));

  return {
    targetPercent,
    actualPercent: Number(actualPercent.toFixed(2)),
    allowedFailurePercent: Number(allowedFailurePercent.toFixed(2)),
    consumedFailurePercent: Number(consumedFailurePercent.toFixed(2)),
    remainingFailurePercent: Number(remainingFailurePercent.toFixed(2)),
    consumedPercent: Math.min(100, consumedPercent),
    remainingPercent: Number((100 - Math.min(100, consumedPercent)).toFixed(2)),
  };
}

export function buildServerTimingHeader(probes: LatencyProbe[]) {
  return probes
    .map((probe) => `${probe.key};dur=${probe.latencyMs};desc="${probe.name}"`)
    .join(", ");
}

export function buildSloStatus(actualPercent: number, targetPercent: number): ProbeStatus {
  if (actualPercent >= targetPercent) {
    return "healthy";
  }

  if (actualPercent >= targetPercent - 1) {
    return "degraded";
  }

  return "critical";
}