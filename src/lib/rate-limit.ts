import { NextResponse } from "next/server";

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 60,  // 60 requests per minute
};

// Different limits for different endpoints
const endpointLimits: Record<string, RateLimitConfig> = {
  "/api/auth/signup": { windowMs: 60 * 60 * 1000, maxRequests: 5 },  // 5 signups per hour
  "/api/auth/signin": { windowMs: 15 * 60 * 1000, maxRequests: 10 },  // 10 logins per 15 min
  "/api/bookings": { windowMs: 60 * 1000, maxRequests: 10 },  // 10 bookings per minute
  "/api/upload": { windowMs: 60 * 1000, maxRequests: 20 },  // 20 uploads per minute
  "/api/venues": { windowMs: 60 * 1000, maxRequests: 100 },  // 100 venue requests per minute
  "/api/catering": { windowMs: 60 * 1000, maxRequests: 100 },
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export function rateLimit(
  request: Request,
  config?: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  const ip = getClientIp(request);
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Get config for this endpoint or use default
  const limitConfig = config || endpointLimits[path] || defaultConfig;
  
  const key = `${ip}:${path}`;
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {  // 1% chance to clean up
    cleanupExpiredEntries();
  }
  
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + limitConfig.windowMs,
    });
    return {
      success: true,
      remaining: limitConfig.maxRequests - 1,
      resetTime: now + limitConfig.windowMs,
    };
  }
  
  if (entry.count >= limitConfig.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  return {
    success: true,
    remaining: limitConfig.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      error: "Too many requests",
      message: "Please try again later",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

// Middleware helper for API routes
export function withRateLimit(
  handler: (request: Request, ...args: any[]) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: Request, ...args: any[]): Promise<NextResponse> => {
    const { success, remaining, resetTime } = rateLimit(request, config);
    
    if (!success) {
      return rateLimitResponse(resetTime);
    }
    
    const response = await handler(request, ...args);
    
    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(resetTime));
    
    return response;
  };
}
