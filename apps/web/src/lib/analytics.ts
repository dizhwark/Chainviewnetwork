"use client";

import type { AnalyticsEventName, AnalyticsProperties } from "@maybe/shared";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "maybe_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

/** Fire-and-forget funnel event. Never blocks the UI or throws into the caller. */
export function trackEvent(eventName: AnalyticsEventName, properties?: AnalyticsProperties): void {
  if (typeof window === "undefined") return;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  fetch(`${base}/api/v1/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, properties, sessionId: getSessionId() }),
    keepalive: true,
  }).catch(() => {
    // Analytics failures must never disrupt the user experience.
  });
}
