import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse, type RateLimitConfig } from "@/lib/rate-limit";

type ApiSecurityOptions = {
  methods?: string[];
  rateLimitConfig?: RateLimitConfig;
  requireTrustedOrigin?: boolean;
  cacheControl?: string;
};

function normalizeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveAllowedOrigins(request: Request) {
  const requestOrigin = normalizeOrigin(request.url);
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => Boolean(value));

  return new Set([requestOrigin, ...configuredOrigins].filter((value): value is string => Boolean(value)));
}

function isAllowedOrigin(request: Request, origin: string) {
  return resolveAllowedOrigins(request).has(origin);
}

function applyApiSecurityHeaders(
  response: NextResponse,
  request: Request,
  options: Pick<ApiSecurityOptions, "methods" | "cacheControl"> = {}
) {
  const origin = request.headers.get("origin");

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("Vary", "Origin");
  response.headers.set("Cache-Control", options.cacheControl || "no-store");

  if (origin && isAllowedOrigin(request, origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      (options.methods || ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]).join(", ")
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }

  return response;
}

function rejectUntrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  if (isAllowedOrigin(request, origin)) {
    return null;
  }

  return applyApiSecurityHeaders(
    NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
    request
  );
}

export function createOptionsResponse(request: Request, methods?: string[]) {
  return applyApiSecurityHeaders(new NextResponse(null, { status: 204 }), request, { methods });
}

export function withApiSecurity(
  handler: (request: Request, ...args: any[]) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (request: Request, ...args: any[]) => {
    if (request.method === "OPTIONS") {
      return createOptionsResponse(request, options.methods);
    }

    if (options.requireTrustedOrigin !== false && !["GET", "HEAD"].includes(request.method)) {
      const originFailure = rejectUntrustedOrigin(request);
      if (originFailure) {
        return originFailure;
      }
    }

    if (options.rateLimitConfig) {
      const { success, remaining, resetTime } = rateLimit(request, options.rateLimitConfig);

      if (!success) {
        return applyApiSecurityHeaders(rateLimitResponse(resetTime), request, {
          methods: options.methods,
          cacheControl: options.cacheControl,
        });
      }

      const response = await handler(request, ...args);
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(resetTime));
      return applyApiSecurityHeaders(response, request, {
        methods: options.methods,
        cacheControl: options.cacheControl,
      });
    }

    const response = await handler(request, ...args);
    return applyApiSecurityHeaders(response, request, {
      methods: options.methods,
      cacheControl: options.cacheControl,
    });
  };
}