import webpush from "web-push";

let configured = false;

export function configurePush() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@shubhspace.com";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(email, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  configurePush();
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  };
  return webpush.sendNotification(pushSubscription, JSON.stringify(payload));
}

export async function sendPushToUser(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload
) {
  configurePush();
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );
  return results;
}
