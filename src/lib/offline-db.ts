"use client";

/**
 * IndexedDB utilities for offline request queuing
 * Stores pending API requests to be synced when connection restored
 */

export interface OfflineRequest {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "DELETE" | "PUT";
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  priority: "high" | "normal" | "low";
  retries: number;
}

const DB_NAME = "BookMyVenue_Offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_requests";

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for pending requests
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("priority", "priority", { unique: false });
        store.createIndex("url", "url", { unique: false });
      }
    };
  });
}

/**
 * Add a request to the offline queue
 */
export async function queueOfflineRequest(
  request: Omit<OfflineRequest, "id" | "timestamp" | "retries">
): Promise<string> {
  const db = await initOfflineDB();

  const id = `${request.method}_${request.url}_${Date.now()}_${Math.random()}`;
  const queuedRequest: OfflineRequest = {
    ...request,
    id,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readwrite")
      .objectStore(STORE_NAME);
    const putRequest = store.put(queuedRequest);

    putRequest.onerror = () => reject(putRequest.error);
    putRequest.onsuccess = () => {
      console.log(
        `[Offline Queue] Queued ${request.method} ${request.url} (ID: ${id})`
      );
      resolve(id);
    };
  });
}

/**
 * Get all pending requests sorted by priority and timestamp
 */
export async function getPendingRequests(): Promise<OfflineRequest[]> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readonly")
      .objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    getAllRequest.onerror = () => reject(getAllRequest.error);
    getAllRequest.onsuccess = () => {
      const requests = getAllRequest.result as OfflineRequest[];
      // Sort by priority (high first) then by timestamp (oldest first)
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      requests.sort((a, b) => {
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
      resolve(requests);
    };
  });
}

/**
 * Remove a request from the queue (after successful sync)
 */
export async function removeQueuedRequest(id: string): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readwrite")
      .objectStore(STORE_NAME);
    const deleteRequest = store.delete(id);

    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onsuccess = () => {
      console.log(`[Offline Queue] Removed request ${id}`);
      resolve();
    };
  });
}

/**
 * Update retry count for a request
 */
export async function updateRequestRetries(
  id: string,
  retries: number
): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readwrite")
      .objectStore(STORE_NAME);

    const getRequest = store.get(id);
    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const request = getRequest.result as OfflineRequest | undefined;
      if (request) {
        request.retries = retries;
        const putRequest = store.put(request);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Clear all pending requests (use with caution)
 */
export async function clearOfflineQueue(): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readwrite")
      .objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onerror = () => reject(clearRequest.error);
    clearRequest.onsuccess = () => {
      console.log("[Offline Queue] Cleared all pending requests");
      resolve();
    };
  });
}

/**
 * Get count of pending requests
 */
export async function getPendingRequestCount(): Promise<number> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const store = db
      .transaction([STORE_NAME], "readonly")
      .objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onerror = () => reject(countRequest.error);
    countRequest.onsuccess = () => resolve(countRequest.result);
  });
}

/**
 * Sync all pending requests with the server
 */
export async function syncPendingRequests(): Promise<{
  successful: number;
  failed: number;
}> {
  const requests = await getPendingRequests();
  let successful = 0;
  let failed = 0;

  console.log(
    `[Offline Sync] Starting sync for ${requests.length} pending requests`
  );

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          ...request.headers,
        },
        body: request.body ? JSON.parse(request.body) : undefined,
      });

      if (response.ok || response.status === 201) {
        // Success - remove from queue
        await removeQueuedRequest(request.id);
        successful++;
        console.log(
          `[Offline Sync] ✓ ${request.method} ${request.url} synced`
        );
      } else {
        // Server error - retry later
        failed++;
        const newRetries = request.retries + 1;
        await updateRequestRetries(request.id, newRetries);

        // Remove after 5 failed retries
        if (newRetries >= 5) {
          await removeQueuedRequest(request.id);
          console.log(
            `[Offline Sync] ✗ Max retries reached, removed ${request.method} ${request.url}`
          );
        } else {
          console.log(
            `[Offline Sync] ✗ ${request.method} ${request.url} failed (retry ${newRetries}/5)`
          );
        }
      }
    } catch (error) {
      failed++;
      const newRetries = request.retries + 1;
      await updateRequestRetries(request.id, newRetries);

      // Remove after 5 failed retries
      if (newRetries >= 5) {
        await removeQueuedRequest(request.id);
        console.log(
          `[Offline Sync] ✗ Max retries reached, removed ${request.method} ${request.url}`
        );
      }
      console.log(
        `[Offline Sync] Error syncing ${request.method} ${request.url}:`,
        error
      );
    }
  }

  console.log(
    `[Offline Sync] Complete: ${successful} successful, ${failed} failed`
  );
  return { successful, failed };
}
