"use client";

import { queueOfflineRequest } from "@/lib/offline-db";

/**
 * Enhanced fetch that queues requests when offline
 * Use this instead of fetch() for critical operations (bookings, payments, etc)
 */
export async function fetchWithOfflineSupport(
  url: string,
  options?: RequestInit & { priority?: "high" | "normal" | "low" }
): Promise<Response> {
  const isOnline = navigator.onLine;
  const method = (options?.method || "GET").toUpperCase();
  const { priority, ...fetchOptions } = options || {};

  // Only queue non-GET requests when offline
  if (!isOnline && method !== "GET") {
    console.log(
      `[Offline Fetch] ${method} ${url} - Queuing for sync`,
      fetchOptions?.body
    );

    // Queue the request
    const headers = new Headers(fetchOptions?.headers);
    await queueOfflineRequest({
      url,
      method: method as "POST" | "PATCH" | "DELETE" | "PUT",
      headers: Object.fromEntries(headers),
      body: fetchOptions?.body ? JSON.stringify(fetchOptions.body) : undefined,
      priority: priority || "normal",
    });

    // Return a successful response locally (optimistic update)
    // This allows the UI to update immediately
    return new Response(JSON.stringify({ offline: true, queued: true }), {
      status: 202, // Accepted - processing offline
      headers: { "Content-Type": "application/json" },
    });
  }

  // Online or GET request - fetch normally
  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    // Network error while online - queue if it's not a GET
    if (method !== "GET") {
      console.log(
        `[Offline Fetch] Network error on ${method} ${url} - Queuing`,
        error
      );
      const headers = new Headers(fetchOptions?.headers);
      await queueOfflineRequest({
        url,
        method: method as "POST" | "PATCH" | "DELETE" | "PUT",
        headers: Object.fromEntries(headers),
        body: fetchOptions?.body ? JSON.stringify(fetchOptions.body) : undefined,
        priority: priority || "normal",
      });

      return new Response(JSON.stringify({ offline: true, queued: true }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw error;
  }
}

/**
 * Wrapper for specific API calls that should support offline mode
 */
export async function apiCall(
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
  endpoint: string,
  data?: unknown,
  priority?: "high" | "low"
): Promise<Response> {
  const options: RequestInit & { priority?: "high" | "normal" | "low" } = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  
  // Add priority for offline queue (not passed to fetch)
  (options as any).priority = priority || "normal";

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  return fetchWithOfflineSupport(endpoint, options);
}

/**
 * Safe response parser that handles both normal and offline responses
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!isJson) {
    throw new Error(`Expected JSON response, got ${contentType}`);
  }

  const data = await response.json();

  // Check if this is an offline queue response
  if (response.status === 202 && data.offline && data.queued) {
    // Return optimistic response
    return {
      success: true,
      offline: true,
      queued: true,
    } as T;
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data as T;
}
