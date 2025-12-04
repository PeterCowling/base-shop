// packages/platform-core/src/analytics/client.ts

type EventPayload = { type: string; [key: string]: unknown };

const CONSENT_COOKIE = "consent.analytics";
const CLIENT_ID_KEY = "analytics.clientId";

function hasConsent(): boolean {
  try {
    if (typeof document === "undefined") return false;
    return document.cookie.split("; ").some((c) => c.startsWith(`${CONSENT_COOKIE}=true`));
  } catch {
    return false;
  }
}

function getClientId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      const existing = localStorage.getItem(CLIENT_ID_KEY);
      if (existing) return existing;
      const next = (crypto as { randomUUID?: () => string }).randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      localStorage.setItem(CLIENT_ID_KEY, next);
      return next;
    }
  } catch {
    /* ignore */
  }
  return "anon";
}

export async function logAnalyticsEvent(event: EventPayload) {
  if (!hasConsent()) return;
  const clientId = getClientId();
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, ...event }),
    });
  } catch {
    /* best-effort */
  }
}
